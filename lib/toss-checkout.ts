// lib/toss-checkout.ts
// 화면에서 결제창을 여는 한 걸음.
//
// ⚠️ 결제사가 둘입니다 (웹=카카오페이 · 앱인토스=토스 예정). 화면은 어느
//    쪽인지 몰라도 됩니다 — 서버가 "어디로 가라"까지 정해서 내려줍니다.
//    · 카카오페이  받은 주소로 이동합니다 (카카오톡에서 결제)
//    · 토스        SDK 로 결제창을 띄웁니다
//
// ┌─ 하는 일 ─────────────────────────────────────────────────────────
// │ 1. 서버에 주문을 만들어 달라고 한다 (POST /api/payments/checkout)
// │      금액은 서버가 정합니다 — 여기서 값을 만들지 않습니다.
// │ 2. 토스 SDK 를 불러온다 (한 번만)
// │ 3. 결제창을 연다. 그다음은 토스 화면입니다.
// └──────────────────────────────────────────────────────────────────
//
// 돌아오는 자리는 /my/credits/success · /my/credits/fail 입니다.
// 크레딧은 거기서 승인을 받은 뒤에 들어옵니다.
//
// ⚠️ npm 패키지 대신 스크립트를 그때 불러옵니다. 결제창은 크레딧 화면에
//    들어온 사람만 쓰는데, 패키지로 넣으면 사이트를 여는 모든 사람이
//    그 무게를 집니다.
"use client"

import { TOSS_CLIENT_KEY, TOSS_SDK_URL } from "@/lib/toss-client"

/** 토스 SDK 중 우리가 쓰는 만큼만 */
interface TossPaymentWindow {
  requestPayment(options: {
    method: "CARD"
    amount: { currency: "KRW"; value: number }
    orderId: string
    orderName: string
    successUrl: string
    failUrl: string
    card?: { flowMode?: "DEFAULT"; useEscrow?: boolean; useCardPoint?: boolean }
  }): Promise<void>
}

interface TossSdk {
  payment(options: { customerKey: string }): TossPaymentWindow
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossSdk
  }
}

/** 같은 스크립트를 두 번 넣지 않도록 붙잡아 둡니다 */
let sdkLoading: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.TossPayments) return Promise.resolve()
  if (sdkLoading) return sdkLoading

  sdkLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = TOSS_SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      // 다음에 다시 눌렀을 때 새로 받아볼 수 있게 풀어둡니다
      sdkLoading = null
      reject(new Error("토스 결제창을 불러오지 못했습니다"))
    }
    document.head.appendChild(script)
  })

  return sdkLoading
}

export type CheckoutResult =
  /** 결제창이 열렸습니다. 그다음은 토스와 successUrl 이 이어갑니다 */
  | { ok: true }
  /** 열지 못했습니다. message 는 그대로 화면에 써도 되는 우리말입니다 */
  | { ok: false; message: string }

/**
 * 묶음 하나를 골라 결제창을 엽니다.
 *
 * ⚠️ 사용자가 결제창을 닫으면 여기서 예외가 납니다. 그건 실패가 아니라
 *    마음을 바꾼 것이라, 오류로 떠들지 않고 조용히 돌아옵니다.
 */
export async function openTossCheckout(packKey: string): Promise<CheckoutResult> {
  let order: {
    provider?: "kakaopay" | "toss"
    orderId: string
    amount: number
    orderName: string
    /** 토스 */
    clientKey?: string
    customerKey?: string
    /** 카카오페이 — 기기에 맞는 주소를 고릅니다 */
    redirect?: { pc: string; mobile: string; app: string }
  }

  try {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ packKey }),
    })

    if (response.status === 401) {
      return { ok: false, message: "로그인하고 다시 눌러주세요." }
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      return { ok: false, message: body.error ?? "결제를 시작하지 못했어요." }
    }

    order = await response.json()
  } catch {
    return { ok: false, message: "연결이 닿지 않았어요. 잠시 뒤 다시 해주세요." }
  }

  // ── 카카오페이 — 받은 주소로 이동합니다 ──────────────────────────
  //
  // ⚠️ 팝업(window.open)이 아니라 이동입니다. 팝업은 모바일 브라우저와
  //    앱 웹뷰에서 자주 막히고, 막히면 아무 일도 일어나지 않은 것처럼
  //    보입니다. 카카오도 모바일에서는 웹뷰로 띄우라고 안내합니다.
  if (order.provider === "kakaopay" && order.redirect) {
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    window.location.href = isMobile ? order.redirect.mobile : order.redirect.pc
    return { ok: true }
  }

  try {
    await loadSdk()
  } catch {
    return { ok: false, message: "결제창을 불러오지 못했어요. 잠시 뒤 다시 해주세요." }
  }

  // 서버가 준 키를 먼저 씁니다. 빌드에 박힌 값(NEXT_PUBLIC_)이 재배포
  // 전이라 낡아 있을 수 있는데, 서버 쪽은 언제나 지금 값입니다.
  const clientKey = order.clientKey || TOSS_CLIENT_KEY
  const sdk = window.TossPayments?.(clientKey)
  if (!sdk) return { ok: false, message: "결제창을 열지 못했어요." }

  const origin = window.location.origin

  try {
    await sdk.payment({ customerKey: order.customerKey ?? "" }).requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: order.amount },
      orderId: order.orderId,
      orderName: order.orderName,
      successUrl: `${origin}/my/credits/success`,
      failUrl: `${origin}/my/credits/fail`,
      card: { flowMode: "DEFAULT", useEscrow: false, useCardPoint: false },
    })
    return { ok: true }
  } catch (error) {
    // 창을 닫은 것도 여기로 옵니다. 사유는 콘솔에만 남기고, 화면에는
    // 아무 말도 하지 않습니다 — 마음을 바꾼 사람에게 오류를 들이대지
    // 않으려는 뜻입니다. (실제로 실패한 결제는 failUrl 로 갑니다)
    console.warn("[toss] 결제창이 닫혔습니다:", error)
    return { ok: true }
  }
}
