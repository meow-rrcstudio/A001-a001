// lib/payments/provider.ts
// 지금 이 사이트가 어느 결제사로 돈을 받는지 한 곳에서 정합니다.
//
// ┌─ 왜 갈라두는가 ───────────────────────────────────────────────────
// │ 웹은 카카오페이로, 앱인토스 미니앱은 토스 결제로 갈 예정입니다.
// │ 둘을 코드 여기저기서 if 로 가르면 한쪽만 고쳐진 채 남습니다.
// │ "어느 결제사인가"를 묻는 곳은 여기 하나뿐이어야 합니다.
// │
// │ 결제사가 갈려도 그 뒤는 같습니다 — 주문을 남기고(purchases),
// │ 승인이 떨어지면 별조각을 얹고(finalize_purchase), 환불하면 거둡니다
// │ (refund_purchase). 그 부분은 결제사와 상관없이 하나입니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import { isKakaoPayConfigured, isKakaoPayTestMode } from "@/lib/kakaopay"
import { isTossConfigured, isTossTestMode } from "@/lib/toss"

/** purchases.provider 에 그대로 적히는 값입니다 */
export type PaymentProvider = "kakaopay" | "toss"

/**
 * 어느 결제사를 쓸지.
 *
 * 환경변수로 못박을 수 있고(PAYMENT_PROVIDER), 없으면 키가 있는 쪽을
 * 씁니다. 둘 다 있으면 카카오페이가 먼저입니다 — 웹의 기본 결제사입니다.
 *
 * ⚠️ NEXT_PUBLIC_ 이 아닙니다. 화면은 이 값을 몰라도 됩니다 —
 *    /api/payments/checkout 이 "어디로 가라"까지 정해서 내려줍니다.
 *    화면이 결제사를 알면, 결제사를 바꿀 때 화면도 함께 고쳐야 합니다.
 */
export function activeProvider(): PaymentProvider | null {
  const forced = process.env.PAYMENT_PROVIDER?.trim().toLowerCase()
  if (forced === "kakaopay") return isKakaoPayConfigured ? "kakaopay" : null
  if (forced === "toss") return isTossConfigured ? "toss" : null

  if (isKakaoPayConfigured) return "kakaopay"
  if (isTossConfigured) return "toss"
  return null
}

/** 지금 결제사가 테스트 열쇠로 도는 중인가 (화면에 알려줍니다) */
export function isTestMode(provider: PaymentProvider): boolean {
  return provider === "kakaopay" ? isKakaoPayTestMode : isTossTestMode
}
