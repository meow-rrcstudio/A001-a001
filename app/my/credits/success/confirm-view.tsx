// app/my/credits/success/confirm-view.tsx
// 토스가 되돌려 보낸 자리. 여기서 승인을 청합니다.
//
// ⚠️ 이 화면에 닿았다고 결제가 된 것이 아닙니다. 이 주소는 사용자가 직접
//    열 수 있습니다. 승인(POST /api/payments/confirm)이 떨어져야 크레딧이
//    들어옵니다 — 그래서 "결제가 끝났어요"를 미리 쓰지 않고, 답을 받은
//    뒤에 말합니다.
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"

type Phase =
  | { step: "confirming" }
  | { step: "done"; credits: number }
  /** 다시 열면 될 수도 있는 실패 (연결 끊김·크레딧 적립 실패) */
  | { step: "pending"; message: string }
  | { step: "failed"; message: string }

export function ConfirmView() {
  const params = useSearchParams()
  const paymentKey = params.get("paymentKey")
  const orderId = params.get("orderId")
  const amount = params.get("amount")

  const [phase, setPhase] = useState<Phase>({ step: "confirming" })
  // ⚠️ 개발 모드에서는 effect 가 두 번 돕니다. 승인을 두 번 청하면 토스가
  //    두 번째를 거절해서, 성공한 결제가 실패로 보입니다.
  const askedRef = useRef(false)

  useEffect(() => {
    if (askedRef.current) return
    askedRef.current = true

    if (!paymentKey || !orderId || !amount) {
      setPhase({ step: "failed", message: "결제 정보가 없어요. 결제를 다시 해주세요." })
      return
    }

    void (async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean
          credits?: number
          error?: string
          pending?: boolean
        }

        if (response.ok && data.ok) {
          setPhase({ step: "done", credits: data.credits ?? 0 })
          return
        }

        setPhase({
          step: data.pending ? "pending" : "failed",
          message: data.error ?? "결제를 확인하지 못했어요.",
        })
      } catch {
        setPhase({
          step: "pending",
          message: "결제 확인이 닿지 않았어요. 잠시 뒤 다시 열어주세요.",
        })
      }
    })()
  }, [paymentKey, orderId, amount])

  const pill =
    "flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
  const quiet = "mt-3 block text-center text-sm text-black underline underline-offset-4 hover:opacity-70"

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col ${HEADER_SPACE}`}>
        <PageHeader variant="sub" backHref="/my/credits" surface="lime" />

        <div className="flex flex-1 flex-col justify-center px-6 pb-16">
          {phase.step === "confirming" && (
            <>
              <h1 className="font-myeongjo text-2xl font-bold leading-snug text-black">
                결제를 확인하는 중이에요
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/80">
                잠깐만 기다려 주세요. 이 화면을 닫지 말아 주세요.
              </p>
            </>
          )}

          {phase.step === "done" && (
            <>
              <h1 className="font-myeongjo text-2xl font-bold leading-snug text-black">
                {countCredits(phase.credits)} 담았어요
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/80">
                이제 샨티에게 바로 물어볼 수 있어요.
              </p>
              <Link href="/tarot/ask" className={`${pill} mt-7`}>
                타로 보러 가기
              </Link>
              <Link href="/my/credits" className={quiet}>
                {CREDIT_UNIT.one} 화면으로
              </Link>
            </>
          )}

          {/* 다시 열면 될 수도 있는 경우 — "실패"라고 단정하지 않습니다.
              돈이 나갔는지 아닌지 우리도 모르는 상태라, 단정하면 둘 중
              한쪽에게는 거짓말이 됩니다. */}
          {phase.step === "pending" && (
            <>
              <h1 className="font-myeongjo text-2xl font-bold leading-snug text-black">
                결제를 확인하는 중이에요
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/80">{phase.message}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={`${pill} mt-7`}
              >
                다시 확인하기
              </button>
              <Link href="/my/credits" className={quiet}>
                {CREDIT_UNIT.one} 화면으로
              </Link>
            </>
          )}

          {phase.step === "failed" && (
            <>
              <h1 className="font-myeongjo text-2xl font-bold leading-snug text-black">
                결제가 되지 않았어요
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/80">{phase.message}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/70">
                돈이 빠져나갔다면 곧 돌아가요. 계속 이러면 알려주세요.
              </p>
              <Link href="/my/credits" className={`${pill} mt-7`}>
                다시 해보기
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
