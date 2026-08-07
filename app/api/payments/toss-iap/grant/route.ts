// app/api/payments/toss-iap/grant/route.ts
// 인앱결제로 산 별조각을 실제로 얹는 자리.
//
// ┌─ 웹(카카오페이)과 무엇이 다른가 ──────────────────────────────────
// │ 웹에서는 우리가 주문을 먼저 만듭니다 — checkout 이 pending 한 줄을
// │ 넣고, 결제가 끝나면 confirm 이 그 줄을 paid 로 바꿉니다.
// │
// │ 인앱결제는 **토스가 주문을 만듭니다.** 우리에게는 다 끝난 뒤에
// │ orderId 하나가 옵니다. 그래서 순서가 뒤집힙니다 —
// │ 물어보고(진짜인가) → 그때 주문 줄을 만들고 → 별조각을 얹습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 미니앱이 보내는 orderId 를 믿지 않습니다. 그대로 믿으면 주문번호를
//    지어내서 얼마든지 받아갈 수 있습니다. 토스에 다시 물어 그 답만 씁니다.
//
// ⚠️ 금액이 아니라 **sku** 로 판단합니다. 가격을 두 곳에서 정하게 되는데
//    (우리 credit-packs · 토스 콘솔) 어긋날 수 있습니다. sku 는 하나입니다.
//
// ⚠️ Node 런타임이어야 합니다 (mTLS).
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { findPack } from "@/lib/credit-packs"
import { TossApiError } from "@/lib/server/toss-api"
import { fetchTossOrder, isTossOrderPaid } from "@/lib/server/toss-iap"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function fail(message: string, status: number, kind: string) {
  return NextResponse.json({ granted: false, error: message, kind }, { status })
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value
  if (!user) return fail("로그인이 필요해요.", 401, "signedOut")

  const body = (await request.json().catch(() => null)) as { orderId?: string } | null
  const orderId = body?.orderId?.trim()
  if (!orderId) return fail("주문번호가 없어요.", 400, "badRequest")

  const admin = getSupabaseAdmin()
  if (!admin) return fail("서버 설정이 아직 없어요.", 503, "server")

  // ── ① 토스에게 물어봅니다 ─────────────────────────────────────────
  let order
  try {
    order = await fetchTossOrder(orderId)
  } catch (error) {
    if (error instanceof TossApiError) {
      console.warn("[toss-iap] 주문 조회 실패", orderId, error.errorCode, error.message)
      // ⚠️ 여기서 "실패"라고 단정하지 않습니다. 우리가 못 물어본 것일 수도
      //    있습니다(요청 한도·일시 장애). 미니앱은 나중에 다시 부릅니다.
      return fail("결제를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.", 502, "server")
    }
    throw error
  }

  if (!isTossOrderPaid(order)) {
    console.warn("[toss-iap] 결제되지 않은 주문", orderId, order.status)
    return fail("아직 결제가 끝나지 않았어요.", 409, "notPaid")
  }

  // ── ② 무엇을 산 것인가 ────────────────────────────────────────────
  //
  // ⚠️ 콘솔의 상품 식별자(sku)를 우리 CREDIT_PACKS 의 key 와 **같은 값**으로
  //    등록합니다 (single · three · ten). 그래야 이 한 줄로 끝나고, 매핑
  //    표를 따로 두지 않아도 됩니다 — 표를 두면 상품이 늘 때마다 한쪽만
  //    고쳐진 채 남습니다.
  const pack = findPack(order.sku)
  if (!pack) {
    // 콘솔에 우리가 모르는 상품이 등록됐다는 뜻입니다. 돈은 이미 나갔으므로
    // 조용히 넘기면 안 됩니다 — 사람이 봐야 하는 자리입니다.
    console.error("[toss-iap] 모르는 상품", orderId, order.sku)
    return fail("아직 준비되지 않은 상품이에요.", 409, "unknownSku")
  }

  // ── ③ 주문 줄을 만들고 별조각을 얹습니다 ──────────────────────────
  //
  // ⚠️ 두 번 눌러도 한 번만 얹혀야 합니다. 세 겹으로 막습니다.
  //      · purchases.order_id 가 unique — 같은 주문은 한 줄뿐
  //      · on conflict do nothing — 이미 있으면 넣지 않음
  //      · finalize_purchase 가 already_paid 를 알아봄 (credit_entries 의
  //        idempotency_key 까지 걸려 있습니다)
  const { error: insertError } = await admin.from("purchases").insert({
    user_id: user.id,
    pack_key: pack.key,
    credits: pack.credits,
    // ⚠️ 우리 가격을 적습니다. get-order-status 는 금액을 주지 않습니다.
    //    콘솔 가격이 우리와 다르면 이 값이 실제로 낸 돈과 어긋납니다 —
    //    그래서 두 곳의 가격을 같게 두는 것이 중요합니다.
    amount_krw: pack.priceKrw,
    provider: "toss-iap",
    order_id: orderId,
    buyer_email: user.email ?? null,
    method: "toss-iap",
  })

  // 23505 = unique 위반. 이미 처리된 주문이라 오류가 아닙니다.
  if (insertError && insertError.code !== "23505") {
    console.error("[toss-iap] 주문 기록 실패", orderId, insertError.message)
    return fail("결제를 기록하지 못했어요.", 500, "server")
  }

  const { data, error: rpcError } = await admin.rpc("finalize_purchase", {
    p_order_id: orderId,
    p_user_id: user.id,
    // 웹에서는 결제사가 주는 열쇠를 넣는 자리인데, 인앱결제는 orderId 하나로
    // 조회·환불이 다 됩니다.
    p_payment_key: orderId,
    p_method: "toss-iap",
  })

  const result = Array.isArray(data) ? data[0] : data
  if (rpcError || !result?.ok) {
    console.error("[toss-iap] 지급 실패", orderId, rpcError?.message ?? result?.message)
    return fail("별조각을 얹지 못했어요.", 500, "server")
  }

  // ⚠️ true 를 돌려줘야 토스가 "지급 완료"로 봅니다. false 나 오류면
  //    저쪽이 미지급 주문으로 남겨두고, 다음에 getPendingOrders 로
  //    다시 들고 옵니다 — 그 편이 안전합니다.
  return NextResponse.json({ granted: true, credits: result.credits })
}
