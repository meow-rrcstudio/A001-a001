// lib/toss.ts
// 토스페이먼츠 설정과 승인 호출.
//
// ┌─ 결제가 흘러가는 길 ──────────────────────────────────────────────
// │ 1. 화면에서 묶음을 고름
// │ 2. POST /api/payments/checkout
// │      서버가 주문번호를 만들고 purchases 에 pending 한 줄을 남깁니다.
// │      ⚠️ 금액은 여기서 정합니다. 화면이 보내온 금액은 쓰지 않습니다.
// │ 3. 브라우저가 토스 결제창을 띄움 (결제수단 입력은 전부 토스 쪽)
// │ 4. 토스가 successUrl 로 되돌려 보냄 (paymentKey·orderId·amount)
// │ 5. POST /api/payments/confirm
// │      우리가 남긴 pending 줄과 대조한 뒤 토스에 승인을 요청하고,
// │      승인이 떨어지면 크레딧을 얹습니다.
// │
// │ ⚠️ 4번에서 돌아온 것만 믿고 크레딧을 주면 안 됩니다. 그 주소는
// │    사용자가 직접 열 수 있어서, 결제 없이 성공 화면으로 들어올 수
// │    있습니다. 5번의 승인 요청이 실제 결제를 확정하는 유일한 단계입니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

/** 브라우저에서 결제창을 띄울 때 쓰는 키. 나가도 되는 값입니다. */
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""

/**
 * 승인에 쓰는 키.
 *
 * ⚠️ 절대 브라우저로 내보내면 안 됩니다. 이 키가 있으면 남의 결제를
 *    취소하고 조회할 수 있습니다. NEXT_PUBLIC_ 을 붙이지 마세요.
 */
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? ""

/** 결제를 열 준비가 됐는지 (두 키가 다 있어야 합니다) */
export const isTossConfigured = Boolean(TOSS_CLIENT_KEY && TOSS_SECRET_KEY)

/**
 * 테스트 키인지.
 *
 * 토스는 테스트 키를 test_ 로 시작하게 만듭니다. 화면에 "지금은 테스트예요"
 * 라고 알려주는 데 씁니다 — 테스트 키인 줄 모르고 진짜 결제를 기다리는
 * 일이 없도록.
 */
export const isTossTestMode = TOSS_CLIENT_KEY.startsWith("test_")

const TOSS_API = "https://api.tosspayments.com/v1/payments"

/**
 * 주문번호.
 *
 * 토스는 6~64자를 요구하고, 우리 purchases.order_id 는 unique 입니다.
 * 시간과 난수를 붙여 겹치지 않게 만듭니다. 사람이 읽을 일이 있어서
 * 앞에 무엇을 산 것인지 남깁니다.
 */
export function makeOrderId(packKey: string): string {
  const now = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `ss_${packKey}_${now}${rand}`
}

/** 토스가 승인 응답으로 돌려주는 것 중 우리가 쓰는 것만 */
export interface TossPayment {
  paymentKey: string
  orderId: string
  totalAmount: number
  status: string
  /** 카드 · 간편결제 … */
  method?: string
  approvedAt?: string
}

export type TossResult =
  | { ok: true; payment: TossPayment }
  | { ok: false; code: string; message: string }

/**
 * 결제 승인.
 *
 * 이 호출이 성공해야 실제로 돈이 빠져나갑니다. 그전까지는 아무 일도
 * 일어나지 않은 것과 같습니다.
 *
 * ⚠️ 같은 paymentKey 로 두 번 부르면 토스가 거절합니다(이미 처리된 결제).
 *    그래서 우리 쪽에서도 purchases.status 로 한 번 더 막습니다 —
 *    두 번 눌러 크레딧이 두 배로 들어가는 일이 없어야 합니다.
 */
export async function confirmPayment(args: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<TossResult> {
  if (!TOSS_SECRET_KEY) {
    return { ok: false, code: "NOT_CONFIGURED", message: "결제 설정이 아직 없어요." }
  }

  // 토스는 Basic 인증을 쓰는데, 비밀번호 자리를 비우고 콜론까지만 붙입니다.
  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")

  let response: Response
  try {
    response = await fetch(`${TOSS_API}/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        // 같은 요청이 두 번 가도 토스가 한 번만 처리하게 합니다
        // (네트워크가 끊겨 우리가 재시도할 때를 위한 것입니다)
        "Idempotency-Key": `confirm_${args.orderId}`,
      },
      body: JSON.stringify(args),
    })
  } catch {
    // 여기서 실패하면 승인이 됐는지 안 됐는지 알 수 없습니다.
    // 크레딧을 주지 않고, 사용자에게는 확인 중이라고 말합니다.
    return { ok: false, code: "NETWORK", message: "결제 확인에 실패했어요. 잠시 뒤 다시 확인해 주세요." }
  }

  const body = (await response.json().catch(() => null)) as
    | (TossPayment & { code?: string; message?: string })
    | null

  if (!response.ok || !body) {
    return {
      ok: false,
      code: body?.code ?? "UNKNOWN",
      message: body?.message ?? "결제 승인이 거절됐어요.",
    }
  }

  return { ok: true, payment: body }
}
