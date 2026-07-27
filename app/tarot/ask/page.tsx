// app/tarot/ask/page.tsx
// 사이트 내 타로점 — 시안의 "유료 회원, 내부 타로점" 흐름입니다.
//
// ┌─ 화면 순서 ───────────────────────────────────────────────────────
// │ 1) ask    — 자유 질문 입력 (제안 칩 + 입력창)
// │ 2) draw   — 카드 섞기 · 뽑기 (공용 CardReadingFlow, inline 모드)
// │ 3) result — 사이트 안에서 해석 보기 + 이어서 대화하기
// └──────────────────────────────────────────────────────────────────
//
// 해석은 /api/reading 이 흘려보내 주고, 도착하는 대로 화면에 채워집니다.
// ⚠️ 이어지는 대화(답변)는 아직 lib/mock-reading.ts 의 임시 함수입니다.
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { Button } from "@/components/ui/button"
import { ReadingResultView, type PickedCard } from "@/components/reading-result-view"
import { SUGGESTED_QUESTIONS } from "@/lib/mock-reading"
import { buildFreeQuestion, FREE_QUESTION_SLUG } from "@/lib/free-question"
import { useReadingStream } from "@/lib/use-reading-stream"
import { canUseInsiteReading, consumeTrial, getEntitlement } from "@/lib/reading-entitlement"
import { appendTurn, saveReading } from "@/lib/reading-archive"

type Step = "ask" | "draw" | "result"

export default function AskPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [step, setStep] = useState<Step>("ask")
  const [question, setQuestion] = useState("")
  const [cards, setCards] = useState<PickedCard[]>([])
  // 해석은 흘려받습니다 — 제목부터 차례로 화면에 채워집니다.
  const { reading, streaming, error, run } = useReadingStream()
  // 보관된 타로점 id — 이어서 나눈 대화를 여기에 계속 쌓습니다
  const [readingId, setReadingId] = useState<string | null>(null)

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
    setStep("draw")
  }

  // 권한 확인 전에는 빈 화면 (무료 화면으로 되돌아가는 중일 수 있음)
  if (!allowed) return <div className="min-h-screen bg-background" />

  // ── 2) 카드 섞기 · 뽑기 ────────────────────────────────────────
  if (step === "draw") {
    return (
      // 카드 고르기 화면은 딱 한 화면입니다. 100vh 는 모바일 사파리에서
      // 주소창을 뺀 높이보다 커서 스크롤이 생기므로 dvh 를 씁니다.
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <main className={`relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}>
          <PageHeader variant="reading" backHref="/tarot/ask" />
          <CardReadingFlow
            mode="inline"
            topicLabel={question}
            topicSlug="self"
            question={buildFreeQuestion(question)}
            introMessage={`"${question}"이라... 좋은 질문이구먼. 마음을 담아 섞어보라냥.`}
            onComplete={async (picked) => {
              setCards(picked)
              setStep("result")
              // 결과 화면으로 먼저 넘어간 뒤 해석을 받습니다 (빈 화면 대기 없이)
              const built = await run({
                topicKey: "self",
                questionSlug: FREE_QUESTION_SLUG,
                questionLabel: question,
                cards: picked,
              })
              // 다 받았을 때만 보관합니다 — 메뉴의 "최근 본 타로점"과 MY 기록이 이걸 봅니다
              if (built) {
                setReadingId(
                  saveReading({ question, topicLabel: question, cards: picked, result: built })
                )
              }
            }}
          />
        </main>
      </div>
    )
  }

  // ── 3) 해석 + 대화 ────────────────────────────────────────────
  if (step === "result") {
    return (
      <ReadingResultView
        question={question}
        result={reading ?? {}}
        cards={cards}
        streaming={streaming}
        error={error}
        onTurn={(turn) => readingId && appendTurn(readingId, turn)}
        onRestart={() => {
          setQuestion("")
          setCards([])
          setReadingId(null)
          setStep("ask")
        }}
      />
    )
  }

  // ── 1) 질문 입력 ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref="/" />

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
                className="rounded-full bg-card px-4 py-2.5 text-left text-sm text-foreground shadow-raised transition-colors hover:bg-muted"
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
