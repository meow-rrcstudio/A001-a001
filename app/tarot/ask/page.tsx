// app/tarot/ask/page.tsx
// 사이트 내 타로점 — 시안의 "유료 회원, 내부 타로점" 흐름입니다.
//
// ┌─ 화면 순서 ───────────────────────────────────────────────────────
// │ 1) ask    — 자유 질문 입력 (제안 칩 + 입력창)
// │ 2) draw   — 카드 섞기 · 뽑기 (공용 CardReadingFlow, inline 모드)
// │ 3) result — 사이트 안에서 해석 보기 + 이어서 대화하기
// └──────────────────────────────────────────────────────────────────
//
// 해석은 /api/reading, 이어지는 면담은 /api/reading/chat 이 흘려보내 주고,
// 도착하는 대로 화면에 채워집니다.
"use client"

import { useCallback, useEffect, useState } from "react"
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
import { FALLBACK_PLAN, layoutKeyForCount, type ReadingPlan } from "@/lib/ai/reading-plan"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import { ChatInput } from "@/components/chat-input"
import { canUseInsiteReading } from "@/lib/reading-entitlement"
import { useAccount } from "@/lib/use-account"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { appendTurn, replaceTurns, saveReading } from "@/lib/reading-archive"

type Step = "ask" | "draw" | "result"

export default function AskPage() {
  const router = useRouter()
  const { account, ready: accountReady, refresh: refreshAccount } = useAccount()
  const [allowed, setAllowed] = useState(false)
  const [step, setStep] = useState<Step>("ask")
  const [question, setQuestion] = useState("")
  // 키보드가 가린 높이 — 입력창을 그만큼 올려 키보드에 붙입니다
  const keyboardInset = useKeyboardInset()
  const [cards, setCards] = useState<PickedCard[]>([])
  // 샨티가 이 질문에 맞게 고른 배열 (몇 장 · 어떤 자리)
  const [plan, setPlan] = useState<ReadingPlan | null>(null)
  const [planning, setPlanning] = useState(false)
  // 해석은 흘려받습니다 — 제목부터 차례로 화면에 채워집니다.
  const { reading, streaming, error, run } = useReadingStream()
  // 보관된 타로점 id — 이어서 나눈 대화를 여기에 계속 쌓습니다
  const [readingId, setReadingId] = useState<string | null>(null)
  // 면담 도중 샨티가 "네가 직접 뽑아라"라고 했을 때. 카드 고르기 화면을
  // 해석 위에 덮어 띄웁니다 — 해석 화면을 걷어내면 나눈 대화가 사라집니다.
  const [followup, setFollowup] = useState<{
    draw: ChatDrawRequest
    done: (picked: PickedCard[]) => void
  } | null>(null)
  // 면담 중에 더 뽑은 카드. 처음 뽑은 카드와 합쳐서 "이미 나온 카드" 목록이
  // 되고, 다음 뽑기의 부채에서 빠집니다 (같은 카드가 두 번 나오지 않도록).
  const [extraCards, setExtraCards] = useState<PickedCard[]>([])

  const handleDrawRequest = useCallback(
    (draw: ChatDrawRequest, done: (picked: PickedCard[]) => void) => {
      setFollowup({ draw, done })
    },
    []
  )

  // 권한 확인 — 크레딧이 남은 회원만 이 화면을 씁니다
  useEffect(() => {
    if (!accountReady) return
    if (canUseInsiteReading(account)) {
      setAllowed(true)
      return
    }
    const as = new URLSearchParams(window.location.search).get("as")
    // 크레딧이 없으면 무료 흐름으로 보냅니다. 홈으로 보내면 "왜 튕겼지?"
    // 가 되는데, 주제 고르기로 보내면 무료로도 볼 수 있는 길이 이어집니다.
    router.replace(as ? `/tarot/reading?as=${as}` : "/tarot/reading")
  }, [router, accountReady, account])

  async function submit(text: string) {
    const q = text.trim()
    if (!q || planning) return
    setQuestion(q)
    setPlanning(true)
    // 이 질문에 어떤 배열이 어울릴지 정합니다 (2초 안팎).
    //
    // 크레딧은 이 호출 안에서 서버가 깎습니다. 화면에서 깎던 예전 방식은
    // 이 호출만 건너뛰면 공짜였습니다.
    try {
      const response = await fetch("/api/reading/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      })

      // 크레딧이 모자라면 사러 가는 길로 보냅니다 (빈손으로 뽑게 두지 않습니다)
      if (response.status === 402) {
        setPlanning(false)
        router.push("/my/credits")
        return
      }

      setPlan(response.ok ? ((await response.json()) as ReadingPlan) : FALLBACK_PLAN)
    } catch {
      setPlan(FALLBACK_PLAN)
    } finally {
      setPlanning(false)
      setStep("draw")
      void refreshAccount()
    }
  }

  /**
   * 해석을 받아 보관합니다. 카드를 다 뽑았을 때와 새로고침이 함께 씁니다.
   * (새로고침은 같은 카드 그대로 해석만 다시 받는 것입니다)
   */
  async function runReading(picked: PickedCard[]) {
    const built = await run({
      topicKey: "self",
      questionSlug: FREE_QUESTION_SLUG,
      questionLabel: question,
      plan,
      cards: picked,
      readingId: plan?.readingId,
    })
    // 다 받았을 때만 보관합니다 — 메뉴의 "최근 본 타로점"과 MY 기록이 이걸 봅니다
    if (built) {
      setReadingId(
        saveReading({
          question,
          topicLabel: question,
          cards: picked,
          layoutKey: plan?.layoutKey,
          positions: plan?.positions.map((p) => p.label),
          result: built,
        })
      )
    }
  }

  // 권한 확인 전에는 빈 화면 (무료 화면으로 되돌아가는 중일 수 있음)
  if (!allowed) return <div className="min-h-screen bg-background" />

  // ── 2) 카드 섞기 · 뽑기 ────────────────────────────────────────
  if (step === "draw") {
    return (
      // 카드 고르기 화면은 딱 한 화면입니다. 100vh 는 모바일 사파리에서
      // 주소창을 뺀 높이보다 커서 스크롤이 생기므로 dvh 를 씁니다.
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <main
          className={`relative z-10 mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
        >
          <PageHeader variant="reading" backHref="/tarot/ask" />
          <CardReadingFlow
            mode="inline"
            topicLabel={question}
            topicSlug="self"
            question={buildFreeQuestion(question, plan)}
            introMessage={plan?.intro ?? `"${question}"이라... 좋은 질문이구먼. 마음을 담아 섞어보라냥.`}
            onComplete={(picked) => {
              setCards(picked)
              setStep("result")
              // 결과 화면으로 먼저 넘어간 뒤 해석을 받습니다 (빈 화면 대기 없이)
              void runReading(picked)
            }}
          />
        </main>
      </div>
    )
  }

  // ── 3) 해석 + 대화 ────────────────────────────────────────────
  if (step === "result") {
    return (
      <>
        <ReadingResultView
          question={question}
          result={reading ?? {}}
          cards={cards}
          positions={plan?.positions.map((p) => p.label)}
          layoutKey={plan?.layoutKey}
          readingId={plan?.readingId}
          streaming={streaming}
          error={error}
          onTurn={(turn) => readingId && appendTurn(readingId, turn)}
          onTurnsReplace={(turns) => readingId && replaceTurns(readingId, turns)}
          onDrawRequest={handleDrawRequest}
          onRegenerate={() => void runReading(cards)}
          onRestart={() => {
            setQuestion("")
            setCards([])
            setExtraCards([])
            setReadingId(null)
            setStep("ask")
          }}
        />

        {/* 면담 중 추가로 뽑기 — 해석 화면 위에 덮습니다 (대화를 잃지 않도록) */}
        {followup && (
          <div className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-background">
            <main
              className={`relative z-10 mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
            >
              {/* 뒤로가기는 주소를 옮기지 않고 이 덮개만 걷습니다 — 옮기면
                  아래 깔린 대화가 통째로 사라집니다. 빈 배열로 돌려주면
                  "뽑기를 물렀다"는 뜻이라, 대화 쪽이 되묻는 칩을 내밉니다. */}
              <PageHeader
                variant="reading"
                onBack={() => {
                  followup.done([])
                  setFollowup(null)
                }}
              />
              <CardReadingFlow
                mode="inline"
                topicLabel={question}
                topicSlug="self"
                question={{
                  slug: FREE_QUESTION_SLUG,
                  label: question,
                  layoutKey: layoutKeyForCount(
                    followup.draw.positions.length
                  ) as ReturnType<typeof buildFreeQuestion>["layoutKey"],
                  positions: followup.draw.positions,
                }}
                introMessage={followup.draw.intro}
                // 이 판에서 이미 나온 카드는 부채에서 빼둡니다 —
                // 사용자가 말한 "남은 카드들 중"입니다.
                excludeNames={[...cards, ...extraCards].map((c) => c.name)}
                // 이미 섞어서 펼쳐둔 판입니다. 한 장 더 뽑겠다고 도로 걷어
                // 다시 섞게 하지 않습니다 — 펼쳐진 그대로 이어서 뽑습니다.
                skipShuffle
                onComplete={(picked) => {
                  followup.done(picked)
                  setExtraCards((prev) => [...prev, ...picked])
                  setFollowup(null)
                }}
              />
            </main>
          </div>
        )}
      </>
    )
  }

  // ── 1) 질문 입력 ──────────────────────────────────────────────
  return (
    // 진입 화면도 딱 한 화면입니다. 100vh 는 모바일 사파리 주소창 높이를
    // 빼주지 않아서 아래(제안 칩 + 입력창)가 잘렸습니다.
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <main
        className={`mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
      >
        <PageHeader variant="reading" backHref="/" />

        <div className="shrink-0">
          <ReadingCharacterBubble
            placement="top"
            message="무엇이든 물어보라냥. 이 몸이 카드로 읽어줄게."
          />
        </div>

        {/* 아래 묶음은 화면 맨 아래에 붙박이입니다 — 잘리지 않습니다.
            키보드가 올라오면 그 높이만큼 위로 올려 키보드에 딱 붙입니다
            (h-dvh 는 키보드를 계산에 넣지 않아 그대로 두면 가려집니다). */}
        <div
          className={`mt-auto shrink-0 transition-[margin] duration-150 ${
            // 키보드가 올라와 있으면 아래 여백을 10px 로 줄여 바짝 붙입니다
            keyboardInset > 0 ? "pb-2.5" : "pb-[max(2rem,env(safe-area-inset-bottom))]"
          }`}
          style={{ marginBottom: keyboardInset }}
        >
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

          <ChatInput
            value={question}
            onChange={setQuestion}
            onSubmit={() => submit(question)}
            disabled={planning}
            placeholder={planning ? "샨티가 카드를 고르는 중..." : "무엇이든 물어보세요."}
            ariaLabel="질문 입력"
            className="mt-4"
          />
        </div>
      </main>
    </div>
  )
}
