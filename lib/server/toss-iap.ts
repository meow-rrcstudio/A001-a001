// lib/server/toss-iap.ts
// 앱인토스 인앱결제 — 주문이 진짜인지 토스에게 물어봅니다.
//
// ┌─ 왜 물어봐야 하는가 ──────────────────────────────────────────────
// │ 미니앱의 processProductGrant({ orderId }) 는 **화면이 부르는** 함수
// │ 입니다. 거기서 받은 orderId 를 그대로 믿고 별조각을 얹으면, 주문번호를
// │ 지어내서 얼마든지 받아갈 수 있습니다.
// │
// │ 그래서 우리 서버가 그 번호를 들고 토스에 다시 물어봅니다. "이 주문
// │ 진짜 결제됐어?" 그 답만 믿습니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import { callTossApi } from "@/lib/server/toss-api"

/** 토스가 알려주는 주문 상태 */
export type TossOrderStatus = {
  orderId: string
  /** 콘솔에 등록한 상품 식별자 — 우리 CREDIT_PACKS 의 key 와 같은 값입니다 */
  sku: string
  /** "PURCHASED" 등. 문서에 전체 목록이 없어 문자열로 받습니다 */
  status: string
  statusDeterminedAt?: string
  reason?: string
}

/**
 * 주문 하나를 조회합니다.
 *
 * ⚠️ 이 API 는 사용자 헤더가 필요 없습니다 — mTLS 로 "우리 미니앱의
 *    주문인지"까지 저쪽이 가립니다. 그러니 남의 미니앱 주문번호를 넣어도
 *    우리에게는 안 보입니다.
 */
export function fetchTossOrder(orderId: string) {
  return callTossApi<TossOrderStatus>(
    "/api-partner/v1/apps-in-toss/order/get-order-status",
    { method: "POST", body: { orderId } },
  )
}

/**
 * 돈이 실제로 들어온 주문인가.
 *
 * ⚠️ "PURCHASED 가 아니면 지급하지 않는다" 로 둡니다. 상태 이름의 전체
 *    목록이 문서에 없어서, 모르는 값이 오면 **주지 않는 쪽**으로 기웁니다.
 *    잘못 주면 되돌리기 어렵지만, 안 주고 뒤늦게 주는 것은 언제든 됩니다.
 */
export function isTossOrderPaid(order: TossOrderStatus): boolean {
  return order.status === "PURCHASED"
}

/**
 * 돈이 되돌아간 주문인가 (별조각을 거둬야 합니다).
 *
 * ⚠️ 환불이 **토스 쪽에서** 일어납니다. 웹에서는 우리가 환불을 시작하지만
 *    인앱결제는 사용자가 토스에서 무릅니다. 우리는 모르는 채로 별조각만
 *    남습니다 — 열 장을 사고 환불받은 뒤에도 열 판을 볼 수 있다는 뜻입니다.
 */
export function isTossOrderRefunded(order: TossOrderStatus): boolean {
  return order.status === "REFUNDED" || order.status === "CANCELED"
}
