// lib/kakaopay.ts
// 카카오페이 단건 결제 — 준비(ready)와 승인(approve).
//
// ┌─ 결제가 흘러가는 길 (토스와 다릅니다) ────────────────────────────
// │ 1. 화면에서 묶음을 고름 (app/my/credits/buy/page.tsx)
// │ 2. POST /api/payments/checkout
// │      서버가 주문을 남기고 → 카카오에 "결제 준비"를 청합니다.
// │      카카오가 결제 고유번호(tid)와 갈 주소 셋을 줍니다.
// │      ⚠️ tid 를 반드시 우리 쪽에 저장해야 합니다. 승인할 때 필요한데
// │         다시 받을 길이 없습니다 (purchases.payment_key 에 넣습니다).
// │ 3. 브라우저가 그 주소로 "이동"합니다 (토스는 팝업, 카카오는 이동)
// │ 4. 카카오톡에서 결제수단을 고르고 비밀번호를 넣으면, 카카오가
// │    approval_url 에 pg_token 을 붙여 우리 화면으로 돌려보냅니다.
// │ 5. POST /api/payments/confirm
// │      tid + pg_token 으로 승인을 청합니다 ← 여기서 돈이 나갑니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 4번에서 돌아왔다는 것만으로 별조각을 주면 안 됩니다. approval_url 은
//    사용자가 직접 열 수 있습니다. pg_token 은 카카오만 만들 수 있고,
//    5번의 승인이 떨어져야 실제 결제입니다.
//
// ⚠️ partner_user_id 에 개인정보를 넣지 말라고 문서가 못박고 있습니다
//    (실명·휴대폰번호·이메일·ID 금지). 우리는 계정 uuid 를 넣습니다 —
//    그것만으로는 누구인지 알 수 없습니다.
import "server-only"

const KAKAOPAY_API = "https://open-api.kakaopay.com/online/v1/payment"

/**
 * 승인에 쓰는 비밀 키.
 *
 * ⚠️ 절대 브라우저로 내보내면 안 됩니다. NEXT_PUBLIC_ 을 붙이지 마세요.
 *    카카오는 헤더에 `SECRET_KEY {키}` 꼴로 넣습니다 (Bearer 가 아닙니다).
 */
const SECRET_KEY = process.env.KAKAOPAY_SECRET_KEY ?? ""

/**
 * 가맹점 코드.
 *
 * 테스트는 TC0ONETIME 과 Secret key(dev) 조합으로 그냥 됩니다 —
 * 제휴 전에도 결제 왕복을 확인할 수 있습니다. 제휴가 끝나면 발급받은
 * 코드로 바꾸세요.
 */
const CID = process.env.KAKAOPAY_CID || "TC0ONETIME"

/** 가맹점 코드 인증키 (발급받은 경우에만) */
const CID_SECRET = process.env.KAKAOPAY_CID_SECRET ?? ""

/** 결제를 열 준비가 됐는지 */
export const isKakaoPayConfigured = Boolean(SECRET_KEY)

/** 테스트 가맹점 코드인지 — 화면에 "지금은 테스트예요"를 띄우는 데 씁니다 */
export const isKakaoPayTestMode = CID === "TC0ONETIME"

export interface KakaoReadyResult {
  tid: string
  /** PC 웹 — 팝업이나 레이어로 엽니다 */
  pcUrl: string
  /** 모바일 웹 */
  mobileUrl: string
  /** 모바일 앱(웹뷰) */
  appUrl: string
}

export type KakaoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string }

/** 카카오가 실패를 알려주는 모양 */
interface KakaoError {
  error_code?: number
  error_message?: string
  extras?: { method_result_code?: string; method_result_message?: string }
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<KakaoResult<T>> {
  if (!SECRET_KEY) {
    return { ok: false, code: "NOT_CONFIGURED", message: "결제 설정이 아직 없어요." }
  }

  let response: Response
  try {
    response = await fetch(`${KAKAOPAY_API}${path}`, {
      method: "POST",
      headers: {
        // ⚠️ Bearer 가 아니라 SECRET_KEY 입니다. 문서 그대로입니다.
        Authorization: `SECRET_KEY ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cid: CID, ...(CID_SECRET ? { cid_secret: CID_SECRET } : {}), ...body }),
      cache: "no-store",
    })
  } catch {
    // 여기서 끊기면 승인이 됐는지 안 됐는지 알 수 없습니다.
    return { ok: false, code: "NETWORK", message: "결제 확인에 실패했어요. 잠시 뒤 다시 해주세요." }
  }

  const raw = (await response.json().catch(() => null)) as (T & KakaoError) | null

  if (!response.ok || !raw) {
    const error = raw as KakaoError | null
    return {
      ok: false,
      code: String(error?.error_code ?? "UNKNOWN"),
      // 카카오가 주는 사람 말(예: "진행중인 거래가 있습니다")이 가장 정확합니다.
      message:
        error?.extras?.method_result_message ??
        error?.error_message ??
        "결제가 되지 않았어요.",
    }
  }

  return { ok: true, value: raw as T }
}

/**
 * 결제 준비 — 아직 돈은 나가지 않습니다.
 *
 * 응답의 tid 를 저장해야 나중에 승인할 수 있습니다.
 */
export async function readyPayment(args: {
  orderId: string
  /** 계정 uuid (개인정보를 넣지 않습니다) */
  userKey: string
  itemName: string
  amountKrw: number
  approvalUrl: string
  cancelUrl: string
  failUrl: string
}): Promise<KakaoResult<KakaoReadyResult>> {
  const result = await call<{
    tid: string
    next_redirect_pc_url: string
    next_redirect_mobile_url: string
    next_redirect_app_url: string
  }>("/ready", {
    partner_order_id: args.orderId,
    partner_user_id: args.userKey,
    item_name: args.itemName.slice(0, 100),
    quantity: 1,
    total_amount: args.amountKrw,
    // 비과세 없음. 부가세는 값을 안 보내면 카카오가 알아서 계산합니다
    // ((총액 - 비과세) / 11, 반올림) — 우리 값과 셈이 같습니다.
    tax_free_amount: 0,
    approval_url: args.approvalUrl,
    cancel_url: args.cancelUrl,
    fail_url: args.failUrl,
  })

  if (!result.ok) return result

  return {
    ok: true,
    value: {
      tid: result.value.tid,
      pcUrl: result.value.next_redirect_pc_url,
      mobileUrl: result.value.next_redirect_mobile_url,
      appUrl: result.value.next_redirect_app_url,
    },
  }
}

export interface KakaoApproveResult {
  aid: string
  tid: string
  orderId: string
  /** 실제로 결제된 총액 — 우리가 적어둔 값과 대조합니다 */
  totalAmount: number
  /** CARD · MONEY */
  method: string
  approvedAt?: string
}

/**
 * 결제 승인 — 여기서 돈이 나갑니다.
 *
 * ⚠️ total_amount 를 함께 보냅니다. 준비 때와 다르면 카카오가 막아줍니다 —
 *    우리 쪽 대조(아래 confirm 라우트)와 이중으로 겹칩니다.
 */
export async function approvePayment(args: {
  tid: string
  orderId: string
  userKey: string
  pgToken: string
  amountKrw: number
}): Promise<KakaoResult<KakaoApproveResult>> {
  const result = await call<{
    aid: string
    tid: string
    partner_order_id: string
    payment_method_type: string
    amount: { total: number }
    approved_at?: string
  }>("/approve", {
    tid: args.tid,
    partner_order_id: args.orderId,
    partner_user_id: args.userKey,
    pg_token: args.pgToken,
    total_amount: args.amountKrw,
  })

  if (!result.ok) return result

  return {
    ok: true,
    value: {
      aid: result.value.aid,
      tid: result.value.tid,
      orderId: result.value.partner_order_id,
      totalAmount: result.value.amount?.total ?? 0,
      method: result.value.payment_method_type ?? "",
      approvedAt: result.value.approved_at,
    },
  }
}

/**
 * 승인됐는지 안 됐는지 우리가 알 수 없는 답들.
 *
 * ⚠️ 이런 답에 failed 를 찍으면 안 됩니다. 실제로는 승인된 결제를 실패로
 *    덮으면 돈은 나갔는데 별조각을 영영 못 줍니다 (토스 쪽과 같은 원칙 —
 *    lib/toss.ts 의 TOSS_UNCERTAIN_CODES 주석 참고).
 */
export function isUncertainKakaoError(code: string): boolean {
  return code === "NETWORK" || code === "UNKNOWN"
}

export interface KakaoCancelResult {
  tid: string
  /** 카카오가 말하는 결제 상태 (CANCEL_PAYMENT · PART_CANCEL_PAYMENT …) */
  status: string
  /** 이번 요청으로 취소된 금액 */
  canceledNow: number
  /** 지금까지 취소된 누계 */
  canceledTotal: number
  /** 아직 더 취소할 수 있는 금액 */
  cancelableLeft: number
}

/**
 * 결제 취소 — 돈을 돌려줍니다.
 *
 * ⚠️ 부분 취소가 됩니다. 우리 환불정책(app/refund 제4조)은 "쓴 몫은 낱개
 *    값으로 쳐서 빼고 나머지를 돌려준다"라서, 열 장 사서 넷을 쓴 사람은
 *    전액이 아니라 그 나머지만 돌아갑니다.
 *
 * ⚠️ 비과세(0)는 승인 때와 똑같이 보냅니다. 부가세는 승인 때 안 보냈으니
 *    취소에서도 안 보냅니다 — 카카오가 같은 방식으로 계산합니다.
 *    (문서: "승인과 동일하게 요청 시 값을 전달하지 않을 경우 자동계산")
 */
export async function cancelPayment(args: {
  tid: string
  /** 돌려줄 금액 */
  amountKrw: number
}): Promise<KakaoResult<KakaoCancelResult>> {
  const result = await call<{
    tid: string
    status: string
    approved_cancel_amount?: { total?: number }
    canceled_amount?: { total?: number }
    cancel_available_amount?: { total?: number }
  }>("/cancel", {
    tid: args.tid,
    cancel_amount: args.amountKrw,
    cancel_tax_free_amount: 0,
  })

  if (!result.ok) return result

  return {
    ok: true,
    value: {
      tid: result.value.tid,
      status: result.value.status,
      canceledNow: result.value.approved_cancel_amount?.total ?? 0,
      canceledTotal: result.value.canceled_amount?.total ?? 0,
      cancelableLeft: result.value.cancel_available_amount?.total ?? 0,
    },
  }
}
