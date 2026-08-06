// lib/server/payment-recovery.ts
// 돈은 나갔는데 별조각이 없는 주문을 스스로 찾아 마무리합니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 승인(POST /api/payments/confirm)은 브라우저가 청합니다. 토스가
// │ successUrl 로 돌려보내면 그 화면이 서버를 부르는 구조입니다.
// │
// │ 그래서 이런 틈이 있습니다.
// │   · 승인 요청이 토스에 닿아 돈이 빠져나간 직후 창을 닫음
// │   · 우리 서버가 응답을 받기 전에 끊김 (배포·타임아웃·순간 장애)
// │   · 지하철에서 결제하고 터널에 들어감
// │
// │ 그러면 우리 표에는 pending 한 줄만 남고, 그 줄에는 결제 열쇠도
// │ 없습니다. 사람은 돈을 냈는데 별조각이 없고, 우리는 그런 줄이
// │ 있다는 것조차 모릅니다. 웹훅이 있으면 토스가 알려주지만 아직
// │ 없습니다 — 그전까지 이 파일이 그 자리를 대신합니다.
// │
// │ 그래서 결제사에 되묻습니다. "정말 결제됐고, 금액도 우리가 적어둔
// │ 값과 같다"일 때만 마무리합니다.
// │
// │ 묻는 길이 결제사마다 다릅니다.
// │   · 토스      주문번호로 조회 (열쇠가 없어도 됩니다)
// │   · 카카오페이 tid 로 조회 — 결제 준비 때 저장해 둔 값입니다
// │                (/online/v1/payment/order)
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 여기서 새로 승인하지 않습니다. 조회만 합니다. 돈을 나가게 하는 일은
//    여전히 사람이 결제창에서 시작한 것뿐입니다.
import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchPaymentByOrderId, isPaymentSettled } from "@/lib/toss"
import { fetchOrder, isKakaoOrderPaid } from "@/lib/kakaopay"

/** 한 번에 살펴볼 주문 수. 화면을 여는 김에 도는 일이라 짧게 끊습니다 */
const MAX_ORDERS = 5

/**
 * 얼마나 지난 주문까지 살펴보는가.
 *
 * 결제창을 열었다가 그냥 닫은 pending 줄이 대부분입니다. 그런 줄까지
 * 매번 토스에 물어보면 헛일이라, 최근 것만 봅니다. 더 오래된 것은
 * 문의가 들어왔을 때 사람이 003 마이그레이션 끝의 점검 쿼리로 찾습니다.
 */
const WINDOW_MS = 3 * 24 * 60 * 60 * 1000

export interface RecoveryResult {
  /** 실제로 마무리된(별조각이 들어간) 주문 수 */
  recovered: number
}

/**
 * 이 사람의 미확정 주문을 살펴보고, 이미 결제된 것이 있으면 마무리합니다.
 *
 * 실패해도 부르는 쪽의 흐름을 끊지 않습니다 — 이건 곁다리로 도는 일이라
 * 여기서 던지면 결제내역 화면이 통째로 안 열립니다.
 */
export async function recoverPendingPurchases(
  admin: SupabaseClient,
  userId: string
): Promise<RecoveryResult> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const { data, error } = await admin
    .from("purchases")
    .select("order_id, amount_krw, provider, payment_key")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS)

  if (error || !data || data.length === 0) return { recovered: 0 }

  let recovered = 0

  for (const row of data) {
    const orderId = row.order_id as string
    const amountKrw = row.amount_krw as number
    const provider = (row.provider as string | null) ?? "toss"
    const tid = row.payment_key as string | null

    // 결제사마다 묻는 길이 다릅니다. 어느 쪽이든 "정말 결제됐고 금액도
    // 우리가 적어둔 값과 같다"일 때만 다음으로 넘어갑니다.
    const settled = await lookUp({ provider, orderId, amountKrw, tid })
    if (!settled) continue

    const { data: finalized, error: finalizeError } = await admin.rpc("finalize_purchase", {
      p_order_id: orderId,
      p_user_id: userId,
      p_payment_key: settled.paymentKey,
      p_method: settled.method,
      p_paid_at: settled.paidAt,
    })

    const row0 = (Array.isArray(finalized) ? finalized[0] : finalized) as
      | { ok?: boolean; message?: string }
      | null

    if (finalizeError || !row0?.ok) {
      console.error(
        `[payment-recovery] 마무리를 못 했습니다 — 주문 ${orderId}:`,
        finalizeError?.message ?? row0?.message ?? "unknown"
      )
      continue
    }

    // 이 줄은 반드시 남깁니다. 여기까지 왔다는 것은 "받고도 못 준" 결제가
    // 실제로 있었다는 뜻이라, 얼마나 자주 일어나는지 알아야 합니다.
    console.warn(`[payment-recovery] 미확정 결제를 되살렸습니다 — 주문 ${orderId}`)
    recovered += 1
  }

  return { recovered }
}

/** 결제사에 되물어, 마무리해도 되는 주문이면 그 값을 돌려줍니다 */
async function lookUp(args: {
  provider: string
  orderId: string
  amountKrw: number
  tid: string | null
}): Promise<{ paymentKey: string; method: string | null; paidAt: string } | null> {
  const { provider, orderId, amountKrw, tid } = args

  // ── 카카오페이 ────────────────────────────────────────────────────
  //
  // ⚠️ 카카오는 주문번호로 못 묻습니다 — tid 로만 묻습니다. 그 tid 는
  //    결제 준비 때 우리가 purchases.payment_key 에 저장해 둔 값입니다.
  //    없으면 준비 단계에서 이미 실패한 줄이라 물어볼 것도 없습니다.
  if (provider === "kakaopay") {
    if (!tid) return null

    const found = await fetchOrder(tid)
    // 결제창만 열고 닫은 주문도 조회는 됩니다(QUIT_PAYMENT 등).
    // isKakaoOrderPaid 가 걸러 줍니다.
    if (!found.ok) return null

    const order = found.value
    if (!isKakaoOrderPaid(order)) return null

    if (order.orderId !== orderId || order.totalAmount !== amountKrw) {
      console.error(
        `[payment-recovery] 조회 결과가 주문과 다릅니다 — 주문 ${orderId}: ` +
          `${order.orderId}/${order.totalAmount} (우리 ${amountKrw})`,
      )
      return null
    }

    return {
      paymentKey: order.tid,
      method: order.method ?? null,
      paidAt: order.approvedAt ?? new Date().toISOString(),
    }
  }

  // ── 토스 ──────────────────────────────────────────────────────────
  const found = await fetchPaymentByOrderId(orderId)
  // 결제창만 열고 닫은 주문은 토스에 아예 없습니다 (NOT_FOUND_PAYMENT).
  // 그건 정상이라 로그도 남기지 않습니다.
  if (!found.ok) return null

  const payment = found.payment
  if (!isPaymentSettled(payment)) return null

  if (payment.orderId !== orderId || payment.totalAmount !== amountKrw) {
    console.error(
      `[payment-recovery] 조회 결과가 주문과 다릅니다 — 주문 ${orderId}: ` +
        `${payment.orderId}/${payment.totalAmount} (우리 ${amountKrw})`,
    )
    return null
  }

  return {
    paymentKey: payment.paymentKey,
    method: payment.method ?? null,
    paidAt: payment.approvedAt ?? new Date().toISOString(),
  }
}
