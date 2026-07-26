// app/tarot/ask/page.tsx
// 사이트 내 타로점 — 시안의 "유료 회원, 내부 타로점" 흐름입니다.
//
// ┌─ 화면 순서 ───────────────────────────────────────────────────────
// │ 1) ask    — 자유 질문 입력 (제안 칩 + 입력창)
// │ 2) draw   — 카드 섞기 · 뽑기 (공용 CardReadingFlow, inline 모드)
// │ 3) result — 사이트 안에서 해석 보기 + 이어서 대화하기
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 해석과 답변은 아직 AI 에 연결되어 있지 않습니다.
//    lib/mock-reading.ts 의 임시 데이터를 쓰고 있으며,
//    연동할 때 그 파일의 두 함수만 실제 호출로 바꾸면 됩니다.
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, HEADER_SPACE } from "@/components/page-header"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { Button } from "@/components/ui/button"
import { ReadingResultView, type PickedCard } from "@/components/reading-result-view"
import { SUGGESTED_QUESTIONS, buildMockReading, type ReadingResult } from "@/lib/mock-reading"
import type { ReadingQuestion } from "@/lib/reading-content"
import { canUseInsiteReading, consumeTrial, getEntitlement } from "@/lib/reading-entitlement"
import { rememberQuestion } from "@/lib/recent-questions"

// 자유 질문용 스프레드 — 시안의 6장 십자 배열
const FREE_QUESTION: ReadingQuestion = {
  slug: "free",
  label: "자유 질문",
  layoutKey: "six-cross",
  positions: [
    { label: "지나온 흐름", guide: "지나온 흐름을 떠올리며 골라보라냥" },
    { label: "지금 마음", guide: "지금 네 마음을 떠올리며 골라보라냥" },
    { label: "상대의 마음", guide: "상대의 마음을 떠올리며 골라보라냥" },
    { label: "가로막는 것", guide: "가로막는 것을 떠올리며 골라보라냥" },
    { label: "다가올 흐름", guide: "다가올 흐름을 떠올리며 골라보라냥" },
    { label: "조언", guide: "지금 필요한 조언을 떠올리며 골라보라냥" },
  ],
}

type Step = "ask" | "draw" | "result"

export default function AskPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [step, setStep] = useState<Step>("ask")
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<ReadingResult | null>(null)
  const [cards, setCards] = useState<PickedCard[]>([])

  // 권한 확인 — 유료 회원이거나 체험이 남은 회원만 이 화면을 씁니다
  useEffect(() => {
    if (canUseInsiteReading(getEntitlement())) {
      setAllowed(true)
      return
    }
    const as = new URLSearchParams(window.location.search).get("as")
    router.replace(as ? `/?as=${as}` : "/")
  }, [router])

  function submit(text: string) {
    const q = text.trim()
    if (!q) return
    setQuestion(q)
    // 체험으로 보는 경우 여기서 1회 차감합니다 (유료 회원은 차감 안 함)
    consumeTrial()
    rememberQuestion(q)
    setStep("draw")
  }

  // 권한 확인 전에는 빈 화면 (무료 화면으로 되돌아가는 중일 수 있음)
  if (!allowed) return <div className="min-h-screen bg-background" />

  // ── 2) 카드 섞기 · 뽑기 ────────────────────────────────────────
  if (step === "draw") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className={`relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}>
          <PageHeader backHref="/tarot/ask" />
          <CardReadingFlow
            mode="inline"
            topicLabel={question}
            topicSlug="self"
            question={FREE_QUESTION}
            introMessage={`"${question}"이라... 좋은 질문이구먼. 마음을 담아 섞어보라냥.`}
            onComplete={(picked) => {
              setCards(picked)
              setResult(buildMockReading(question, picked))
              setStep("result")
            }}
          />
        </main>
      </div>
    )
  }

  // ── 3) 해석 + 대화 ────────────────────────────────────────────
  if (step === "result" && result) {
    return (
      <ReadingResultView
        question={question}
        result={result}
        cards={cards}
        onRestart={() => {
          setQuestion("")
          setResult(null)
          setCards([])
          setStep("ask")
        }}
      />
    )
  }

  // ── 1) 질문 입력 ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader backHref="/" />

        <ReadingCharacterBubble
          placement="top"
          message="무엇이든 물어보라냥. 이 몸이 카드로 읽어줄게."
        />

        <div className="mt-auto pb-8">
          <p className="mb-2 text-sm text-muted-foreground">제안</p>
          <div className="flex flex-col items-start gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="rounded-full bg-card px-4 py-2.5 text-left text-sm text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-muted"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(question)
            }}
            className="mt-4 flex items-center gap-2"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="무엇이든 물어보세요."
              aria-label="질문 입력"
              className="h-12 flex-1 rounded-full border border-input bg-card px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
            />
            <Button type="submit" variant="solid" size="pill" className="px-6">
              물어보기
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
