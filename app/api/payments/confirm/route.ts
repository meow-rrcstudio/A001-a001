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
import { approvePayment, isUncertainKakaoError } from "@/lib/kakaopay"
import {
  confirmPayment,
  fetchPayment,
  isPaymentSettled,
  TOSS_ALREADY_PROCESSED,
  TOSS_UNCERTAIN_CODES,
  type TossPayment,
} from "@/lib/toss"
import { CREDIT_UNIT, withJosa } from "@/lib/credit-packs"

export const dynamic = "force-dynamic"

/**
 * 이 길만 서울에서 돌립니다.
 *
 * ⚠️ 카카오페이는 결제 준비를 청한 곳과 결제창을 여는 곳이 크게 다르면
 *    막을 수 있습니다. Vercel 기본 지역은 미국이라, 미국에서 준비를
 *    청하고 한국에서 결제창을 열면 "접근금지"가 뜹니다.
 *    돈이 오가는 길이니 카카오와 가까운 곳에서 부릅니다.
 */
export const preferredRegion = "icn1"

export const maxDuration = 30

interface Body {
  /** 카카오페이면 "kakaopay", 없으면 토스(옛 화면 호환) */
  provider?: string
  /** 토스 — 결제 열쇠 */
  paymentKey?: string
  orderId?: string
  amount?: number
  /** 카카오페이 — 결제수단을 고르고 돌아올 때 붙어 오는 표 */
  pgToken?: string
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

  const isKakao = body.provider === "kakaopay"
  const paymentKey = String(body.paymentKey ?? "")
  const orderId = String(body.orderId ?? "")
  const pgToken = String(body.pgToken ?? "")
  const amount = Number(body.amount)

  if (!orderId) {
    return NextResponse.json({ error: "결제 정보가 모자라요." }, { status: 400 })
  }
  // 카카오는 주문번호와 pg_token 만 돌아옵니다 (금액·열쇠는 우리 표에 있습니다).
  // 토스는 결제 열쇠와 금액이 함께 돌아옵니다.
  if (isKakao ? !pgToken : !paymentKey || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "결제 정보가 모자라요." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })
  }

  // 우리가 남긴 주문 — 남의 주문번호를 적어 보낼 수 있으니 주인도 함께 봅니다.
  const { data: purchase, error: findError } = await admin
    .from("purchases")
    .select("id, user_id, credits, amount_krw, status, payment_key, provider")
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
    if (purchase.payment_key && purchase.payment_key !== paymentKey) {
      console.warn(`[payments/confirm] 이미 결제된 주문에 다른 paymentKey 가 들어왔습니다 — 주문 ${orderId}`)
      return NextResponse.json({ error: "이미 다른 결제로 끝난 주문이에요." }, { status: 409 })
    }
    return NextResponse.json({ ok: true, credits: purchase.credits, already: true })
  }

  if (purchase.status !== "pending") {
    return NextResponse.json({ error: "이미 끝난 주문이에요." }, { status: 409 })
  }

  // ⚠️ 카카오는 금액이 화면에서 오지 않습니다. 우리가 적어둔 값을 그대로
  //    승인에 싣고, 카카오가 준비 때와 다르면 막아줍니다. 아래 대조는
  //    화면이 금액을 보내는 토스에만 해당합니다.
  if (!isKakao && purchase.amount_krw !== amount) {
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

  // ══════════════════════════════════════════════════════════════════
  // 카카오페이 — 승인
  // ══════════════════════════════════════════════════════════════════
  if (isKakao) {
    // tid 는 결제 준비 때 우리가 받아 적어둔 값입니다. 화면이 보낸 것을
    // 쓰지 않습니다 — 남의 결제 열쇠를 적어 보낼 수 있으니까요.
    const tid = String(purchase.payment_key ?? "")
    if (!tid) {
      console.error(`[payments/confirm] tid 가 없습니다 — 주문 ${orderId}`)
      return NextResponse.json(
        { error: "결제 정보를 찾지 못했어요. 다시 시도해 주세요." },
        { status: 500 }
      )
    }

    // ── 여기서 돈이 나갑니다 ────────────────────────────────────────
    const approved = await approvePayment({
      tid,
      orderId,
      userKey: user.id,
      pgToken,
      // 우리가 적어둔 값을 싣습니다. 준비 때와 다르면 카카오가 막습니다.
      amountKrw: purchase.amount_krw,
    })

    if (!approved.ok) {
      // 승인됐는지 모르는 답은 failed 로 굳히지 않습니다. 굳히면 실제로는
      // 승인된 결제를 실패로 덮어 별조각을 영영 못 줍니다.
      if (isUncertainKakaoError(approved.code)) {
        console.warn(`[payments/confirm] 카카오 승인 여부를 모릅니다 — 주문 ${orderId}: ${approved.code}`)
        return NextResponse.json({ error: approved.message, pending: true }, { status: 503 })
      }

      await admin
        .from("purchases")
        .update({
          status: "failed",
          failure_reason: `${approved.code}: ${approved.message}`.slice(0, 300),
        })
        .eq("id", purchase.id)

      return NextResponse.json({ error: approved.message, code: approved.code }, { status: 402 })
    }

    // 받은 답이 정말 이 주문인가. 카카오도 검사하지만 우리 쪽에서도 봅니다.
    if (approved.value.orderId !== orderId || approved.value.totalAmount !== purchase.amount_krw) {
      console.error(
        `[payments/confirm] 카카오 승인 응답이 주문과 다릅니다 — 주문 ${orderId}: ` +
          `${approved.value.orderId}/${approved.value.totalAmount}`
      )
      return NextResponse.json(
        { error: "결제 승인값이 주문과 맞지 않아요. 고객센터로 알려주세요.", pending: true },
        { status: 500 }
      )
    }

    const { data: done, error: doneError } = await admin.rpc("finalize_purchase", {
      p_order_id: orderId,
      p_user_id: user.id,
      p_payment_key: approved.value.tid,
      p_method: approved.value.method || null,
      p_paid_at: approved.value.approvedAt ?? new Date().toISOString(),
    })

    const doneRow = (Array.isArray(done) ? done[0] : done) as
      | { ok?: boolean; credits?: number; message?: string }
      | null

    if (doneError || !doneRow?.ok) {
      console.error(
        `[payments/confirm] 카카오 승인은 됐는데 완료 처리를 못 했습니다 — 주문 ${orderId}:`,
        doneError?.message ?? doneRow?.message ?? "unknown"
      )
      return NextResponse.json(
        {
          error: `결제는 됐는데 ${withJosa(CREDIT_UNIT.one, "을를")} 얹지 못했어요. 잠시 뒤 다시 열어주세요.`,
          pending: true,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, credits: doneRow.credits ?? purchase.credits })
  }

  // ══════════════════════════════════════════════════════════════════
  // 토스 — 승인
  // ══════════════════════════════════════════════════════════════════
  // ── 여기서 돈이 나갑니다 ──────────────────────────────────────────
  const result = await confirmPayment({ paymentKey, orderId, amount })

  let payment: TossPayment | null = result.ok ? result.payment : null

  if (!result.ok) {
    // ── ① 이미 승인된 결제 ────────────────────────────────────────
    // 우리가 승인을 청했는데 응답을 못 받고 끊긴 뒤 다시 청하면 여기로
    // 옵니다. 돈은 이미 나갔습니다. 실패로 처리하면 낸 사람이 별조각을
    // 영영 못 받으므로, 조회해서 우리 주문이 맞는지 확인하고 이어서
    // 마무리합니다. (사람 손 없이 되돌아오는 유일한 길입니다)
    if (TOSS_ALREADY_PROCESSED.has(result.code)) {
      const found = await fetchPayment(paymentKey)
      if (found.ok) {
        payment = found.payment
        console.warn(
          `[payments/confirm] 이미 승인된 결제를 이어서 마무리합니다 — 주문 ${orderId} (${result.code})`
        )
      } else {
        console.error(
          `[payments/confirm] 이미 승인된 결제인데 조회도 실패 — 주문 ${orderId}:`,
          `${found.code}: ${found.message}`
        )
        return NextResponse.json(
          { error: "결제를 확인하는 중이에요. 잠시 뒤 다시 열어주세요.", pending: true },
          { status: 503 }
        )
      }
    }
    // ── ② 승인됐는지 모르는 답 ────────────────────────────────────
    // 여기서 failed 를 찍으면 실제로는 승인된 결제를 우리가 실패로
    // 덮습니다. 모를 때는 pending 그대로 두고 다시 확인하게 둡니다.
    else if (TOSS_UNCERTAIN_CODES.has(result.code)) {
      console.warn(`[payments/confirm] 승인 여부를 모릅니다 — 주문 ${orderId}: ${result.code}`)
      return NextResponse.json({ error: result.message, pending: true }, { status: 503 })
    }
    // ── ③ 분명한 거절 ────────────────────────────────────────────
    else {
      await admin
        .from("purchases")
        .update({ status: "failed", failure_reason: `${result.code}: ${result.message}`.slice(0, 300) })
        .eq("id", purchase.id)

      return NextResponse.json({ error: result.message, code: result.code }, { status: 402 })
    }
  }

  if (!payment) {
    return NextResponse.json(
      { error: "결제를 확인하지 못했어요. 잠시 뒤 다시 열어주세요.", pending: true },
      { status: 503 }
    )
  }

  // ── 받은 답이 정말 이 주문인가 ────────────────────────────────────
  // 토스가 짝을 검사하지만, 우리 쪽에서도 한 번 더 봅니다. 승인 응답을
  // 그대로 믿고 지급하는 코드는 응답을 만들어 낼 수 있는 순간 무너집니다.
  if (payment.orderId !== orderId || payment.totalAmount !== purchase.amount_krw) {
    console.error(
      `[payments/confirm] 승인 응답이 주문과 다릅니다 — 주문 ${orderId}: 응답 ${payment.orderId}/${payment.totalAmount}`
    )
    return NextResponse.json(
      { error: "결제 승인값이 주문과 맞지 않아요. 고객센터로 알려주세요.", pending: true },
      { status: 500 }
    )
  }

  // ── 돈이 실제로 들어왔는가 ───────────────────────────────────────
  // ⚠️ 가상계좌(무통장)는 승인 응답이 200 이어도 WAITING_FOR_DEPOSIT 입니다.
  //    계좌만 발급된 것이고 입금은 아직입니다. 여기서 별조각을 주면 돈을
  //    받기도 전에 물건을 내주는 셈이고, 입금 없이 만료되면 그대로 손해가
  //    됩니다. 주문은 pending 으로 두고, 입금이 확인되면 그때 지급합니다.
  //
  //    ⚠️ 지금 우리에겐 웹훅이 없어서, 입금 뒤 자동으로 지급되지 않습니다.
  //       가상계좌를 열려면 웹훅(DONE 이벤트)을 먼저 붙이세요. 그전까지는
  //       토스 상점 설정에서 가상계좌를 꺼두는 편이 안전합니다.
  if (!isPaymentSettled(payment)) {
    console.warn(
      `[payments/confirm] 아직 입금 전입니다 — 주문 ${orderId}: status=${payment.status}`
    )
    return NextResponse.json(
      {
        error: "아직 입금이 확인되지 않았어요. 입금이 확인되면 별조각이 들어옵니다.",
        pending: true,
        status: payment.status,
      },
      { status: 202 }
    )
  }

  // ── 크레딧 지급과 결제 완료 표시를 DB 함수 한 덩어리로 끝냅니다 ─────
  // 둘을 API 서버에서 따로 실행하면 중간 실패 때 "돈은 받았는데 미지급"
  // 또는 "지급은 됐는데 결제는 pending" 상태가 됩니다. 함수 안에서 해당
  // purchase 줄을 잠그고, credit_entries idempotency_key 와 paid 표시를
  // 같은 트랜잭션으로 묶습니다.
  const { data: finalized, error: finalizeError } = await admin.rpc("finalize_purchase", {
    p_order_id: orderId,
    p_user_id: user.id,
    p_payment_key: payment.paymentKey,
    p_method: payment.method ?? null,
    p_paid_at: payment.approvedAt ?? new Date().toISOString(),
  })

  const finalizedRow = (Array.isArray(finalized) ? finalized[0] : finalized) as
    | { ok?: boolean; credits?: number; message?: string }
    | null

  if (finalizeError || !finalizedRow?.ok) {
    console.error(
      `[payments/confirm] 승인은 됐는데 완료 처리를 못 했습니다 — 주문 ${orderId}:`,
      finalizeError?.message ?? finalizedRow?.message ?? "unknown"
    )
    return NextResponse.json(
      { error: `결제는 됐는데 ${withJosa(CREDIT_UNIT.one, "을를")} 얹지 못했어요. 잠시 뒤 다시 열어주세요.`, pending: true },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, credits: finalizedRow.credits ?? purchase.credits })
}
