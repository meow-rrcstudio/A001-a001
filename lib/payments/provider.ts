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
//
// ┌─ ⚠️ 웹은 카카오페이만 씁니다 (계약 조건) ─────────────────────────
// │ 카카오페이 1년 무료의 조건이 **웹 독점**입니다. 웹에서 다른 결제사로
// │ 받으면 그 조건을 어깁니다.
// │
// │ 그래서 자동으로 토스로 넘어가지 않습니다. 예전에는 카카오 열쇠가
// │ 없으면 토스가 있는지 보고 그쪽으로 갔는데, 열쇠에 오타가 나거나
// │ 만료되면 아무도 모르는 사이에 웹이 토스로 결제받게 됩니다 —
// │ 화면은 멀쩡히 돌기 때문에 알아챌 방법이 없습니다.
// │
// │ 이제 카카오 열쇠가 없으면 결제를 **닫습니다**(ready:false).
// │ "지금은 살 수 없어요"가 조건을 어기는 것보다 낫습니다.
// │
// │ 토스 코드와 열쇠는 그대로 둡니다 — 앱인토스 미니앱 쪽에서 씁니다.
// │ 다만 웹에서 켜려면 PAYMENT_PROVIDER=toss 를 손으로 넣어야 하고,
// │ 그때는 서버 기록에 경고가 크게 남습니다.
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

  if (forced === "toss") {
    // 일부러 못박은 경우에만 갑니다. 그래도 크게 남깁니다 — 웹에서 이
    // 값이 켜져 있으면 카카오페이 무료 조건을 어기는 중입니다.
    if (!isTossConfigured) return null
    console.warn(
      "[payments] ⚠️ PAYMENT_PROVIDER=toss — 웹이 토스로 결제받고 있습니다. " +
        "카카오페이 독점 조건을 어기는 상태입니다. 시험이 끝나면 이 값을 지우세요.",
    )
    return "toss"
  }

  if (forced === "kakaopay") return isKakaoPayConfigured ? "kakaopay" : null

  // ⚠️ 여기서 토스로 넘어가지 않습니다 (아래 머리말 참고).
  //    카카오 열쇠가 없으면 결제를 닫습니다 — 조용히 다른 결제사로
  //    바뀌는 것보다 "지금은 살 수 없어요"가 낫습니다.
  return isKakaoPayConfigured ? "kakaopay" : null
}

/** 지금 결제사가 테스트 열쇠로 도는 중인가 (화면에 알려줍니다) */
export function isTestMode(provider: PaymentProvider): boolean {
  return provider === "kakaopay" ? isKakaoPayTestMode : isTossTestMode
}
