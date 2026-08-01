// app/my/credits/fail/fail-view.tsx
// 결제창에서 실패하거나 창을 닫았을 때 토스가 보내오는 자리(failUrl).
//
// 대부분은 "그냥 창을 닫은 것"입니다. 그걸 오류처럼 다루면, 마음을 바꾼
// 것뿐인 사람에게 뭔가 잘못한 기분을 안깁니다. 사유 코드로 갈라서
// 취소는 담담히 받습니다.
//
// ⚠️ 토스가 준 영어 사유(message)를 그대로 찍지 않습니다. 우리말로
//    바꿔 말하고, 원문은 콘솔에만 남깁니다 (lib/chat-errors.ts 와 같은 원칙).
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { CREDIT_UNIT } from "@/lib/credit-packs"

/** 토스가 주는 사유 코드 중, 말을 달리해야 하는 것들 */
function describe(code: string | null): { title: string; body: string } {
  switch (code) {
    // 사용자가 결제창을 닫았거나 취소했습니다 — 잘못한 일이 아닙니다.
    case "PAY_PROCESS_CANCELED":
    case "USER_CANCEL":
      return {
        title: "결제를 그만뒀어요",
        body: "언제든 다시 할 수 있어요.",
      }
    case "PAY_PROCESS_ABORTED":
      return {
        title: "결제가 끝까지 가지 못했어요",
        body: "카드사나 결제 수단 쪽에서 멈춘 것 같아요. 다른 수단으로 해보셔도 좋아요.",
      }
    case "REJECT_CARD_COMPANY":
      return {
        title: "카드사에서 막았어요",
        body: "한도나 카드 상태를 확인해 주세요. 다른 카드로 하셔도 됩니다.",
      }
    default:
      return {
        title: "결제가 되지 않았어요",
        body: "잠시 뒤에 다시 해보세요. 계속 이러면 알려주세요.",
      }
  }
}

export function FailView() {
  const params = useSearchParams()
  const code = params.get("code")
  const message = params.get("message")

  // 원문은 우리가 봅니다 — 화면에는 우리말만 갑니다.
  useEffect(() => {
    if (code || message) console.warn("[payments/fail]", code, message)
  }, [code, message])

  const { title, body } = describe(code)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col ${HEADER_SPACE}`}>
        <PageHeader variant="close" backHref="/my/credits" />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <h1 className="font-myeongjo text-2xl font-bold leading-snug text-foreground">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{body}</p>

          <Link
            href="/my/credits/buy"
            className="mt-7 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-brand-lime transition-opacity hover:opacity-90"
          >
            {CREDIT_UNIT.one} 다시 사기
          </Link>
          <Link
            href="/tarot/ask"
            className="mt-4 block text-sm text-foreground underline underline-offset-4 hover:opacity-70"
          >
            맛보기로 먼저 보기
          </Link>
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
