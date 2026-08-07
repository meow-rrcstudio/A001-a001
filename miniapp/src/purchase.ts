// miniapp/src/purchase.ts
// 별조각 사기 — 인앱결제.
//
// ┌─ 웹과 무엇이 다른가 ──────────────────────────────────────────────
// │ 웹에서는 우리가 주문을 만들고 결제창으로 보냅니다.
// │ 미니앱에서는 토스가 주문서를 띄우고, 결제가 끝나면 우리를 부릅니다
// │ (processProductGrant). 순서가 반대입니다.
// │
// │ ⚠️ 외부 결제창으로 나가는 것 자체가 금지입니다(정책 4번). 카카오페이
// │    흐름을 미니앱으로 옮기면 안 됩니다 — 반드시 이 길입니다.
// └──────────────────────────────────────────────────────────────────
import { IAP } from "@apps-in-toss/web-framework"
// ⚠️ 웹과 **같은 파일**입니다 (공용 자리 — vite.config.ts 참고).
//    가격·개수·이름을 미니앱에 다시 적지 않습니다. 다시 적으면 웹에서
//    값을 바꿨을 때 미니앱만 옛 값으로 남고, 아무도 모릅니다.
import { CREDIT_PACKS, formatKrw, nameCredits } from "@/lib/credit-packs"
import { callApi } from "./api"

/**
 * 살 수 있는 묶음.
 *
 * ⚠️ 여기에 다시 적지 않고 웹의 CREDIT_PACKS 를 그대로 씁니다. 콘솔에
 *    등록하는 상품 식별자(sku)도 그 `key` 와 **같은 값**입니다 —
 *    single · three · ten. 그래서 서버가 `findPack(sku)` 한 줄로 끝나고,
 *    양쪽을 잇는 표가 아예 없습니다.
 *
 * ⚠️ 영문 소문자만 씁니다. `1-credit`·`3pack`·`10개` 처럼 숫자나 다른
 *    언어가 섞이면 플랫폼마다 규칙이 달라 언젠가 어긋납니다.
 */
export type PackKey = string

/** 화면에 늘어놓을 묶음들 — 웹의 목록과 언제나 같습니다 */
export const packs = CREDIT_PACKS.map((pack) => ({
  sku: pack.key,
  label: nameCredits(pack.credits),
  price: formatKrw(pack.priceKrw),
  featured: pack.featured ?? false,
}))

export type PurchaseOutcome =
  | { ok: true; credits: number }
  | { ok: false; reason: string }

/**
 * 별조각을 삽니다.
 *
 * ⚠️ 끝나면 cleanup 을 **반드시** 부릅니다. SDK 가 그렇게 하라고 적어
 *    두었습니다 — 안 부르면 다음 결제에서 지난번 흐름이 살아 있습니다.
 *
 * ⚠️ processProductGrant 가 돌려주는 값이 곧 "지급됐는가" 입니다.
 *    false 를 주면 토스가 미지급 주문으로 남겨두고 다음에 다시 들고
 *    옵니다(getPendingOrders). 그러니 **확실하지 않으면 false 입니다** —
 *    true 로 얼버무리면 돈은 나갔는데 별조각이 없는 사람이 생깁니다.
 */
export function buyCredits(sku: PackKey): Promise<PurchaseOutcome> {
  // 낡은 토스 앱에는 이 기능이 없습니다. 부르기 전에 봐야 합니다 —
  // 안 보면 그 사람들에게서 조용히 깨집니다.
  if (!IAP.createOneTimePurchaseOrder.isSupported()) {
    return Promise.resolve({
      ok: false,
      reason: "토스 앱을 최신으로 업데이트해 주세요.",
    })
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (outcome: PurchaseOutcome) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(outcome)
    }

    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        /**
         * 돈이 나간 뒤 토스가 여기를 부릅니다. 별조각을 얹는 자리입니다.
         *
         * ⚠️ 여기서 화면이 직접 얹지 않습니다. 서버에 orderId 만 넘기고,
         *    서버가 토스에 "이 주문 진짜 결제됐어?" 를 다시 물어본 뒤에
         *    얹습니다. 화면이 얹으면 주문번호를 지어내서 받아갈 수 있습니다.
         */
        processProductGrant: async ({ orderId }) => {
          try {
            const result = await callApi<{ granted: boolean; credits: number }>(
              "/api/payments/toss-iap/grant",
              { method: "POST", body: JSON.stringify({ orderId }) },
            )
            if (result.granted) {
              finish({ ok: true, credits: result.credits })
              return true
            }
            return false
          } catch {
            // ⚠️ 여기서 삼키고 false 를 돌려줍니다. 우리가 못 얹었다는 뜻이라
            //    토스가 미지급으로 남겨둡니다 — 다음에 다시 시도됩니다.
            return false
          }
        },
      },
      onEvent: () => {
        // 지급까지 끝나면 processProductGrant 쪽에서 이미 resolve 됩니다.
        // 여기 홀로 오는 경우는 지급이 실패한 것입니다.
        finish({ ok: false, reason: "별조각을 얹지 못했어요. 잠시 뒤 다시 확인해 주세요." })
      },
      onError: () => {
        // 사용자가 결제창을 닫은 경우도 여기로 옵니다.
        finish({ ok: false, reason: "결제를 마치지 못했어요." })
      },
    })
  })
}

/**
 * 환불된 것이 있는지 훑습니다. **미니앱을 열 때마다** 부릅니다.
 *
 * ⚠️ 환불이 토스 쪽에서 일어나기 때문입니다. 우리에게는 아무도 알려주지
 *    않아서, 그냥 두면 돈은 돌아갔는데 별조각은 남습니다.
 *
 * ⚠️ 실패해도 화면을 막지 않습니다. 이건 뒤에서 맞춰두는 일이지,
 *    사용자가 기다려야 하는 일이 아닙니다.
 */
export async function reconcileRefunds(): Promise<number> {
  try {
    const { revoked } = await callApi<{ revoked: number }>(
      "/api/payments/toss-iap/reconcile",
      { method: "POST" },
    )
    return revoked
  } catch {
    return 0
  }
}
