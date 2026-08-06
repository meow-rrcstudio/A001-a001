// app/api/admin/refund/route.ts
// 환불 창구 — 돈을 돌려주고, 남은 별조각을 거둡니다. 한 번에.
//
// ┌─ 왜 한 자리에 묶는가 ─────────────────────────────────────────────
// │ 지금까지 환불은 두 손으로 했습니다. 돈은 결제사 콘솔에서, 별조각은
// │ SQL 편집기에서. 두 손으로 하는 일은 언젠가 한쪽이 빠집니다 —
// │ 빠지는 쪽은 늘 별조각이고, 그러면 열 장을 사고 환불받은 사람이
// │ 열 판을 그대로 봅니다.
// │
// │ 순서도 중요합니다. 돈이 먼저입니다. 별조각을 먼저 거뒀는데 돈
// │ 돌려주기가 실패하면, 산 것도 못 쓰고 돈도 못 받은 상태가 됩니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 얼마를 돌려주는가 ───────────────────────────────────────────────
// │ 환불정책 제4조 그대로입니다 — 쓴 몫은 낱개 값(888원)으로 쳐서 빼고
// │ 나머지를 돌려줍니다. 열 장(6,880원)을 사서 넷을 썼으면
// │ 6,880 - 4×888 = 3,328원. 셈은 lib/credit-packs.ts 의 refundAmount 가
// │ 합니다 — 정책 문서와 같은 함수를 봐야 둘이 어긋나지 않습니다.
// │
// │ amount 를 직접 넣으면 그 값으로 합니다 (분쟁·사과 환불 등).
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 관리자 화면이 아직 없어서 열쇠 한 줄로 지킵니다. 이 열쇠는 남의 돈을
//    움직일 수 있으므로 절대 브라우저·저장소·채팅에 두지 마세요.
//    (Vercel 환경변수 ADMIN_REFUND_TOKEN 에만 둡니다)
//
// 쓰는 법:
//   curl -X POST https://soulseoul.xyz/api/admin/refund \
//     -H "x-admin-token: ..." -H "content-type: application/json" \
//     -d '{"orderId":"ss_ten_...","note":"고객 요청"}'
import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { formatKrw, refundAmount } from "@/lib/credit-packs"
import { cancelPayment } from "@/lib/kakaopay"
import { cancelTossPayment } from "@/lib/toss"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const TOKEN = process.env.ADMIN_REFUND_TOKEN ?? ""

/**
 * 열쇠 대조.
 *
 * ⚠️ === 로 비교하지 않습니다. 문자열 비교는 앞에서부터 다른 글자를 만나면
 *    바로 멈춰서, 걸린 시간으로 열쇠를 한 글자씩 알아낼 수 있습니다.
 */
function tokenOk(given: string | null): boolean {
  if (!TOKEN || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(TOKEN)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

interface Body {
  orderId?: string
  /** 돌려줄 금액. 없으면 환불정책대로 셈합니다 */
  amount?: number
  note?: string
}

export async function POST(request: Request) {
  // 열쇠부터 봅니다. 틀리면 아무것도 알려주지 않습니다 —
  // "그런 주문 없음"과 "열쇠 틀림"을 구분해 주면 그것만으로 단서가 됩니다.
  if (!tokenOk(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const limited = rateLimit(rateKey("admin-refund", null, request), 20, 10 * 60_000)
  if (limited) return limited

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 })
  }

  const orderId = String(body.orderId ?? "").trim()
  if (!orderId) return NextResponse.json({ error: "주문번호가 없어요." }, { status: 400 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })

  const { data: purchase, error: findError } = await admin
    .from("purchases")
    .select("id, user_id, credits, amount_krw, status, payment_key, provider")
    .eq("order_id", orderId)
    .maybeSingle()

  if (findError) {
    console.error("[admin/refund] 주문을 못 읽었습니다:", findError.message)
    return NextResponse.json({ error: "주문을 읽지 못했어요." }, { status: 500 })
  }
  if (!purchase) return NextResponse.json({ error: "그런 주문이 없어요." }, { status: 404 })

  if (purchase.status === "canceled") {
    return NextResponse.json({ ok: true, already: true, message: "이미 환불된 주문이에요." })
  }
  if (purchase.status !== "paid") {
    return NextResponse.json(
      { error: `결제가 끝난 주문이 아니에요 (지금 ${purchase.status}).` },
      { status: 409 }
    )
  }

  // ── 얼마를 돌려줄까 ───────────────────────────────────────────────
  // 남은 잔액으로 "이 결제분에서 몇 장을 썼는지"를 어림합니다. 장부에
  // 어느 결제의 장을 썼는지까지는 적혀 있지 않아서, 남은 것을 이 결제의
  // 몫으로 먼저 봅니다 — 회원에게 유리한 쪽입니다.
  const { data: balanceRow } = await admin
    .from("credit_balance")
    .select("credits")
    .eq("user_id", purchase.user_id)
    .maybeSingle()

  const balance = Math.max(0, balanceRow?.credits ?? 0)
  const leftFromThis = Math.min(balance, purchase.credits)
  const usedFromThis = purchase.credits - leftFromThis
  const amount =
    typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount >= 0
      ? Math.floor(body.amount)
      : refundAmount(purchase.amount_krw, usedFromThis)

  if (amount > purchase.amount_krw) {
    return NextResponse.json(
      { error: `낸 돈보다 많이 돌려줄 수 없어요 (${formatKrw(purchase.amount_krw)}).` },
      { status: 400 }
    )
  }

  const tid = String(purchase.payment_key ?? "")
  if (!tid) {
    return NextResponse.json(
      { error: "결제 열쇠가 없어 결제사에 취소를 청할 수 없어요. 콘솔에서 처리해 주세요." },
      { status: 409 }
    )
  }

  // ── ① 돈 먼저 ────────────────────────────────────────────────────
  if (amount > 0) {
    const canceled =
      purchase.provider === "kakaopay"
        ? await cancelPayment({ tid, amountKrw: amount })
        : await cancelTossPayment({
            paymentKey: tid,
            reason: (body.note ?? "고객 요청").slice(0, 200),
            amountKrw: amount,
          })

    if (!canceled.ok) {
      console.error(
        `[admin/refund] 결제 취소 실패 — 주문 ${orderId}: ${canceled.code} ${canceled.message}`
      )
      return NextResponse.json(
        { error: `결제사에서 취소가 안 됐어요: ${canceled.message}`, code: canceled.code },
        { status: 502 }
      )
    }
  }

  // ── ② 그다음 별조각 ──────────────────────────────────────────────
  // 남아 있는 만큼만 거둡니다. 이미 쓴 것은 되돌릴 수 없고, 잔액이 음수가
  // 되면 다음에 산 별조각까지 못 쓰게 됩니다 (마이그레이션 003 참고).
  const { data: done, error: doneError } = await admin.rpc("refund_purchase", {
    p_order_id: orderId,
    p_refund_krw: amount,
    p_note: body.note ?? null,
  })

  const row = (Array.isArray(done) ? done[0] : done) as
    | { ok?: boolean; credits_taken?: number; balance_after?: number; message?: string }
    | null

  if (doneError || !row?.ok) {
    // 돈은 이미 나갔습니다. 사람이 반드시 봐야 하는 자리라 크게 남깁니다.
    console.error(
      `[admin/refund] ⚠️ 돈은 돌려줬는데 별조각을 못 거뒀습니다 — 주문 ${orderId}:`,
      doneError?.message ?? row?.message ?? "unknown"
    )
    return NextResponse.json(
      {
        error: "돈은 돌려줬는데 별조각을 거두지 못했어요. 이 주문번호로 알려주세요.",
        orderId,
        refunded: amount,
      },
      { status: 500 }
    )
  }

  console.warn(
    `[admin/refund] 환불 완료 — 주문 ${orderId}: ${amount}원, 별조각 ${row.credits_taken ?? 0}장 회수`
  )

  return NextResponse.json({
    ok: true,
    orderId,
    provider: purchase.provider,
    paid: purchase.amount_krw,
    /** 쓴 것으로 본 장수 (낱개 값으로 공제됩니다) */
    usedCredits: usedFromThis,
    refunded: amount,
    creditsTaken: row.credits_taken ?? 0,
    balanceAfter: row.balance_after ?? 0,
  })
}
