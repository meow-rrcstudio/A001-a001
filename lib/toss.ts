// lib/toss.ts
// 토스페이먼츠 설정과 승인 호출.
//
// ┌─ 결제가 흘러가는 길 ──────────────────────────────────────────────
// │ 1. 화면에서 묶음을 고름 (app/my/credits/buy/page.tsx)
// │ 2. POST /api/payments/checkout
// │      서버가 주문번호를 만들고 purchases 에 pending 한 줄을 남깁니다.
// │      ⚠️ 금액은 여기서 정합니다. 화면이 보내온 금액은 쓰지 않습니다.
// │ 3. 브라우저가 토스 결제창을 띄움 (lib/toss-checkout.ts)
// │      결제수단 입력은 전부 토스 쪽입니다. 우리는 카드번호를 보지 않습니다.
// │ 4. 토스가 successUrl 로 되돌려 보냄 (paymentKey·orderId·amount)
// │      app/my/credits/success — 실패·취소는 /my/credits/fail 입니다.
// │ 5. POST /api/payments/confirm
// │      우리가 남긴 pending 줄과 대조한 뒤 토스에 승인을 요청하고,
// │      승인이 떨어지면 크레딧을 얹습니다.
// │
// │ ⚠️ 4번에서 돌아온 것만 믿고 크레딧을 주면 안 됩니다. 그 주소는
// │    사용자가 직접 열 수 있어서, 결제 없이 성공 화면으로 들어올 수
// │    있습니다. 5번의 승인 요청이 실제 결제를 확정하는 유일한 단계입니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

// 화면에도 나가는 값(결제창 키)은 lib/toss-client.ts 에 있습니다.
// 이 파일은 server-only 라 화면이 가져올 수 없어서 나눠 두었습니다.
import { TOSS_CLIENT_KEY, isTossTestKey } from "@/lib/toss-client"

export { TOSS_CLIENT_KEY }

/**
 * 승인에 쓰는 키.
 *
 * ⚠️ 절대 브라우저로 내보내면 안 됩니다. 이 키가 있으면 남의 결제를
 *    취소하고 조회할 수 있습니다. NEXT_PUBLIC_ 을 붙이지 마세요.
 */
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? ""

/** 결제를 열 준비가 됐는지 (두 키가 다 있어야 합니다) */
export const isTossConfigured = Boolean(TOSS_CLIENT_KEY && TOSS_SECRET_KEY)

/** 테스트 키인지 (lib/toss-client.ts 참고) */
export const isTossTestMode = isTossTestKey

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
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const rand = Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 24)
  return `ss_${packKey}_${now}_${rand}`
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
 * 승인이 됐는지 안 됐는지 "우리가 알 수 없는" 답들.
 *
 * ⚠️ 이런 답에 failed 를 찍으면 안 됩니다. 실제로는 승인된 결제를 우리가
 *    실패로 덮어버리면, 돈은 나갔는데 별조각은 영영 못 주고 사람은
 *    "결제 실패"라는 화면만 봅니다. 모를 때는 pending 그대로 두고 다시
 *    확인할 수 있게 둡니다 (confirm-view 의 "다시 확인하기").
 */
export const TOSS_UNCERTAIN_CODES = new Set([
  "NETWORK",
  "PROVIDER_ERROR",
  "UNKNOWN_PAYMENT_ERROR",
  "FAILED_INTERNAL_SYSTEM_PROCESSING",
  "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING",
  "TIMEOUT",
])

/**
 * "이미 처리된 결제" — 돈은 이미 나갔고 우리 쪽 뒷정리만 남은 상태.
 *
 * 우리가 승인을 청했는데 응답을 못 받고 끊긴 뒤 다시 청하면 이 답이
 * 옵니다. 이때 실패로 처리하면 낸 사람이 별조각을 못 받습니다 —
 * 조회해서 우리 주문이 맞는지 확인하고 이어서 마무리해야 합니다.
 */
export const TOSS_ALREADY_PROCESSED = new Set([
  "ALREADY_PROCESSED_PAYMENT",
  "ALREADY_COMPLETED_PAYMENT",
])

/**
 * 승인이 끝나 돈이 실제로 들어온 상태인가.
 *
 * ⚠️ 응답이 200 이라고 다 끝난 것이 아닙니다. 가상계좌(무통장)는
 *    WAITING_FOR_DEPOSIT 으로 돌아옵니다 — 계좌만 발급됐고 입금은
 *    아직입니다. 여기서 별조각을 주면 돈을 받기도 전에 물건을 내주는
 *    셈이고, 입금 없이 만료되면 그대로 손해입니다.
 */
export function isPaymentSettled(payment: TossPayment): boolean {
  return payment.status === "DONE"
}

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

/**
 * 결제 조회 — 승인을 다시 청하지 않고 지금 상태만 봅니다.
 *
 * 승인 요청이 "이미 처리된 결제"로 거절됐을 때, 그게 정말 우리 주문이
 * 맞는지(같은 orderId · 같은 금액) 확인하는 데 씁니다. 돈은 나갔는데
 * 별조각이 없는 상태를 사람 손 없이 되돌리는 유일한 길입니다.
 */
export async function fetchPayment(paymentKey: string): Promise<TossResult> {
  if (!TOSS_SECRET_KEY) {
    return { ok: false, code: "NOT_CONFIGURED", message: "결제 설정이 아직 없어요." }
  }

  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")

  let response: Response
  try {
    response = await fetch(`${TOSS_API}/${encodeURIComponent(paymentKey)}`, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    })
  } catch {
    return { ok: false, code: "NETWORK", message: "결제 확인에 실패했어요. 잠시 뒤 다시 확인해 주세요." }
  }

  const body = (await response.json().catch(() => null)) as
    | (TossPayment & { code?: string; message?: string })
    | null

  if (!response.ok || !body) {
    return {
      ok: false,
      code: body?.code ?? "UNKNOWN",
      message: body?.message ?? "결제를 조회하지 못했어요.",
    }
  }

  return { ok: true, payment: body }
}

/**
 * 주문번호로 결제를 조회합니다.
 *
 * 결제 열쇠(paymentKey)를 우리가 못 받은 경우에도 쓸 수 있는 유일한 길입니다.
 * 승인 요청은 화면(브라우저)이 청하는데, 그 사이에 창을 닫거나 연결이
 * 끊기면 우리 표에는 pending 한 줄만 남고 열쇠가 없습니다. 돈이 나갔는지
 * 아닌지는 토스에게 주문번호로 물어보는 수밖에 없습니다
 * (lib/server/payment-recovery.ts).
 */
export async function fetchPaymentByOrderId(orderId: string): Promise<TossResult> {
  if (!TOSS_SECRET_KEY) {
    return { ok: false, code: "NOT_CONFIGURED", message: "결제 설정이 아직 없어요." }
  }

  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")

  let response: Response
  try {
    response = await fetch(`${TOSS_API}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    })
  } catch {
    return { ok: false, code: "NETWORK", message: "결제 확인에 실패했어요." }
  }

  const body = (await response.json().catch(() => null)) as
    | (TossPayment & { code?: string; message?: string })
    | null

  if (!response.ok || !body) {
    return {
      ok: false,
      code: body?.code ?? "UNKNOWN",
      message: body?.message ?? "결제를 조회하지 못했어요.",
    }
  }

  return { ok: true, payment: body }
}

/**
 * 결제 취소 — 돈을 돌려줍니다.
 *
 * 부분 취소가 됩니다(cancelAmount 를 빼면 전액). 우리 환불정책은 쓴 몫을
 * 낱개 값으로 쳐서 빼므로 대개 부분 취소입니다.
 */
export async function cancelTossPayment(args: {
  paymentKey: string
  reason: string
  amountKrw?: number
}): Promise<TossResult> {
  if (!TOSS_SECRET_KEY) {
    return { ok: false, code: "NOT_CONFIGURED", message: "결제 설정이 아직 없어요." }
  }

  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")

  let response: Response
  try {
    response = await fetch(`${TOSS_API}/${encodeURIComponent(args.paymentKey)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        // 같은 취소가 두 번 가도 한 번만 처리되게
        "Idempotency-Key": `cancel_${args.paymentKey}_${args.amountKrw ?? "all"}`,
      },
      body: JSON.stringify({
        cancelReason: args.reason.slice(0, 200),
        ...(args.amountKrw ? { cancelAmount: args.amountKrw } : {}),
      }),
    })
  } catch {
    return { ok: false, code: "NETWORK", message: "취소 요청이 닿지 않았어요." }
  }

  const body = (await response.json().catch(() => null)) as
    | (TossPayment & { code?: string; message?: string })
    | null

  if (!response.ok || !body) {
    return {
      ok: false,
      code: body?.code ?? "UNKNOWN",
      message: body?.message ?? "결제를 취소하지 못했어요.",
    }
  }

  return { ok: true, payment: body }
}
