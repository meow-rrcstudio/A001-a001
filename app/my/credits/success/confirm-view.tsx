// app/my/credits/success/confirm-view.tsx
// 토스가 되돌려 보낸 자리. 여기서 승인을 청합니다.
//
// ⚠️ 이 화면에 닿았다고 결제가 된 것이 아닙니다. 이 주소는 사용자가 직접
//    열 수 있습니다. 승인(POST /api/payments/confirm)이 떨어져야 별조각이
//    들어옵니다 — 그래서 "결제가 끝났어요"를 미리 쓰지 않고, 답을 받은
//    뒤에 말합니다.
//
// ┌─ 화면 ────────────────────────────────────────────────────────────
// │ 기다리는 동안  : 샨티가 통통 뛰고, 아래에 무슨 일이 일어나는지 한 줄
// │ 들어왔을 때    : 별 + 몇 개가 생겼는지 + 바로 쓰러 가는 길
// │ 확인 못 했을 때: 다시 확인하기
// │ 안 됐을 때     : 무엇이 안 됐고 돈은 어떻게 되는지
// │
// │ 넷 다 화면 한가운데에 놓습니다. 결과를 기다리는 화면이라 눈이 갈 곳이
// │ 하나여야 합니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { BlinkingShanti } from "@/components/pixel-sprite"
import { CREDIT_UNIT, countCredits, withJosa } from "@/lib/credit-packs"

type Phase =
  | { step: "confirming" }
  | { step: "done"; credits: number }
  /** 다시 열면 될 수도 있는 실패 (연결 끊김·별조각 적립 실패) */
  | { step: "pending"; message: string }
  | { step: "failed"; message: string }

/**
 * 별조각 한 개 — 라임으로 채우고 검은 선을 두른 네 갈래 별.
 *
 * 푸터의 ✦ 와 같은 표식이지만 이건 "방금 생긴 것"을 가리키는 자리라
 * 글자가 아니라 그림으로 둡니다 (글꼴에 따라 모양이 달라지지 않게).
 */
function StarPiece() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M24 2c1.6 11.2 8.2 18.4 22 22-13.8 3.6-20.4 10.8-22 22-1.6-11.2-8.2-18.4-22-22C15.8 20.4 22.4 13.2 24 2Z"
        fill="var(--brand-lime)"
        stroke="var(--brand-ink)"
        strokeWidth="2.5"
      />
    </svg>
  )
}

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

  const title = "font-myeongjo text-2xl font-bold leading-snug text-foreground"
  const body = "mt-2 text-[15px] leading-relaxed text-muted-foreground"
  const pill =
    "mt-7 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-brand-lime transition-opacity hover:opacity-90"
  const quiet =
    "mt-4 block text-sm text-foreground underline underline-offset-4 hover:opacity-70"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col ${HEADER_SPACE}`}>
        {/* 확인 중에는 닫을 곳을 두되, 나가도 승인은 서버에서 끝납니다 */}
        <PageHeader variant="close" backHref="/my/credits" />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          {phase.step === "confirming" && (
            <>
              <h1 className={title}>
                결제를
                <br />
                확인하는 중이에요
              </h1>
              {/* 샨티가 통통 뛰는 동안은 아직 끝나지 않은 것입니다 */}
              <span className="mt-6 text-2xl leading-none text-muted-foreground">···</span>
              <BlinkingShanti className="mt-4 h-8 text-foreground" busy />
              <p className={body}>잠깐만 기다려 주세요. 이 화면을 닫지 말아 주세요.</p>
            </>
          )}

          {phase.step === "done" && (
            <>
              <StarPiece />
              <h1 className={`${title} mt-6`}>
                {countCredits(phase.credits)}의 {withJosa(CREDIT_UNIT.one, "이가")} 생겼어요.
              </h1>
              <p className={body}>이제 샨티에게 바로 물어볼 수 있어요.</p>
              <Link href="/tarot/ask" className={pill}>
                타로 보러 가기
              </Link>
              <Link href="/my/credits" className={quiet}>
                {CREDIT_UNIT.one}에서 확인해 보기
              </Link>
            </>
          )}

          {/* 다시 열면 될 수도 있는 경우 — "실패"라고 단정하지 않습니다.
              돈이 나갔는지 아닌지 우리도 모르는 상태라, 단정하면 둘 중
              한쪽에게는 거짓말이 됩니다. */}
          {phase.step === "pending" && (
            <>
              <h1 className={title}>
                결제를
                <br />
                확인하는 중이에요
              </h1>
              <p className={body}>{phase.message}</p>
              <button type="button" onClick={() => window.location.reload()} className={pill}>
                다시 확인하기
              </button>
              <Link href="/my/credits" className={quiet}>
                {CREDIT_UNIT.one}에서 확인해 보기
              </Link>
            </>
          )}

          {phase.step === "failed" && (
            <>
              <h1 className={title}>결제가 되지 않았어요</h1>
              <p className={body}>{phase.message}</p>
              <p className={body}>돈이 빠져나갔다면 곧 돌아가요. 계속 이러면 알려주세요.</p>
              <Link href="/my/credits/buy" className={pill}>
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
