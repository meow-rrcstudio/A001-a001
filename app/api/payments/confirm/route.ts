// app/api/payments/confirm/route.ts
// 결제 승인 — 실제로 돈이 빠져나가고, 크레딧이 들어오는 유일한 자리입니다.
//
// ┌─ 순서 ────────────────────────────────────────────────────────────
// │ 1. 로그인한 사람인지 본다
// │ 2. 우리가 남긴 pending 주문을 찾는다 (그 사람 것이 맞는지도)
// │ 3. 금액이 우리가 적어둔 값과 같은지 대조한다
// │ 4. 토스에 승인을 요청한다  ← 여기서 돈이 나갑니다
// │ 5. 승인이 떨어지면 purchases 를 paid 로 바꾸고 크레딧을 얹는다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ successUrl 로 돌아왔다는 것만 믿으면 안 됩니다. 그 주소는 사용자가
//    직접 열 수 있어서, 결제 없이 성공 화면으로 들어올 수 있습니다.
//    4번의 승인 요청만이 결제를 확정합니다.
//
// ⚠️ 3번의 금액 대조를 빠뜨리면 안 됩니다. 화면에서 넘어온 amount 를 그대로
//    토스에 넘기면, 6,880원짜리 주문을 888원으로 승인시킬 수 있습니다.
//    우리가 DB 에 적어둔 값과 같을 때만 넘어갑니다.
import { NextResponse } from "next/server"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server"
import { confirmPayment } from "@/lib/toss"
import { CREDIT_UNIT, withJosa } from "@/lib/credit-packs"

export const dynamic = "force-dynamic"
export const maxDuration = 30

interface Body {
  paymentKey?: string
  orderId?: string
  amount?: number
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 })
  }

  const limited = rateLimit(rateKey("confirm", user.id, request), 20, 10 * 60_000)
  if (limited) return limited

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 })
  }

  const paymentKey = String(body.paymentKey ?? "")
  const orderId = String(body.orderId ?? "")
  const amount = Number(body.amount)

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "결제 정보가 모자라요." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })
  }

  // 우리가 남긴 주문 — 남의 주문번호를 적어 보낼 수 있으니 주인도 함께 봅니다.
  const { data: purchase, error: findError } = await admin
    .from("purchases")
    .select("id, user_id, credits, amount_krw, status")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (findError) {
    console.error("[payments/confirm] 주문을 못 읽었습니다:", findError.message)
    return NextResponse.json({ error: "결제를 확인하지 못했어요." }, { status: 500 })
  }

  if (!purchase) {
    return NextResponse.json({ error: "그런 주문이 없어요." }, { status: 404 })
  }

  // 이미 끝난 주문 — 새로고침으로 두 번 들어온 경우가 대부분입니다.
  // 오류로 돌려보내면 "결제했는데 실패라고 나온다"가 됩니다. 이미 준
  // 크레딧을 다시 주지 않으면서, 화면에는 잘 됐다고 말합니다.
  if (purchase.status === "paid") {
    return NextResponse.json({ ok: true, credits: purchase.credits, already: true })
  }

  if (purchase.status !== "pending") {
    return NextResponse.json({ error: "이미 끝난 주문이에요." }, { status: 409 })
  }

  if (purchase.amount_krw !== amount) {
    // 금액이 어긋나면 승인 자체를 하지 않습니다. 우리가 적어둔 값이 옳습니다.
    console.warn(
      `[payments/confirm] 금액이 어긋납니다 — 주문 ${orderId}: 우리 ${purchase.amount_krw} / 받은 ${amount}`
    )
    await admin
      .from("purchases")
      .update({ status: "failed", failure_reason: "금액 불일치" })
      .eq("id", purchase.id)
    return NextResponse.json({ error: "결제 금액이 맞지 않아요." }, { status: 400 })
  }

  // ── 여기서 돈이 나갑니다 ──────────────────────────────────────────
  const result = await confirmPayment({ paymentKey, orderId, amount })

  if (!result.ok) {
    // NETWORK 는 "승인이 됐는지 안 됐는지 모른다"는 뜻입니다. 그때 failed 로
    // 적어버리면, 실제로는 승인된 결제를 우리가 실패로 덮어 크레딧을 영영
    // 못 주게 됩니다. 모를 때는 pending 그대로 두고 다시 확인할 수 있게 둡니다.
    if (result.code === "NETWORK") {
      return NextResponse.json({ error: result.message, pending: true }, { status: 503 })
    }

    await admin
      .from("purchases")
      .update({ status: "failed", failure_reason: `${result.code}: ${result.message}`.slice(0, 300) })
      .eq("id", purchase.id)

    return NextResponse.json({ error: result.message, code: result.code }, { status: 402 })
  }

  // ── 크레딧을 얹습니다 ─────────────────────────────────────────────
  // ⚠️ 크레딧이 먼저, 주문 표시가 나중입니다. 표시를 먼저 남기면, 크레딧
  //    넣기가 실패했을 때 "결제는 됐는데 크레딧이 없는" 상태로 굳습니다.
  //    (가입 선물에서 똑같은 실수를 했습니다 — app/api/account/route.ts)
  //
  //    두 번 들어가는 것은 열쇠가 막습니다. 주문번호는 unique 라
  //    purchase:<주문번호> 로는 한 줄만 들어갑니다.
  const { error: grantError } = await admin.from("credit_entries").upsert(
    {
      user_id: user.id,
      delta: purchase.credits,
      reason: "purchase",
      purchase_id: purchase.id,
      idempotency_key: `purchase:${orderId}`,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  )

  if (grantError) {
    // 돈은 이미 나갔습니다. 주문은 pending 으로 두어 다시 시도할 수 있게
    // 하고, 반드시 사람이 볼 수 있게 남깁니다.
    console.error(
      `[payments/confirm] 승인은 됐는데 크레딧을 못 넣었습니다 — 주문 ${orderId}:`,
      grantError.message
    )
    return NextResponse.json(
      { error: `결제는 됐는데 ${withJosa(CREDIT_UNIT.one, "을를")} 얹지 못했어요. 잠시 뒤 다시 열어주세요.`, pending: true },
      { status: 500 }
    )
  }

  const { error: markError } = await admin
    .from("purchases")
    .update({
      status: "paid",
      payment_key: result.payment.paymentKey,
      method: result.payment.method ?? null,
      paid_at: result.payment.approvedAt ?? new Date().toISOString(),
    })
    .eq("id", purchase.id)

  if (markError) {
    // 크레딧은 이미 들어갔습니다. 표시만 못 남긴 것이라 사람에게는 성공입니다.
    console.error("[payments/confirm] 주문 표시를 못 남겼습니다:", markError.message)
  }

  return NextResponse.json({ ok: true, credits: purchase.credits })
}
