// app/tarot/ask/page.tsx
// 타로보기 — 누구든 여기서 시작합니다.
//
// ┌─ 화면 순서 ───────────────────────────────────────────────────────
// │ 1) ask    — 주제 칩 + 질문 칩 + 입력창 (한 화면)
// │ 2) draw   — 카드 섞기 · 뽑기 (공용 CardReadingFlow, inline 모드)
// │ 3) result — 해석. 여기서 갈립니다
// │              별조각이 있으면 → 사이트 안 해석 + 이어서 대화
// │              없으면(비회원 포함) → 맛보기 해석 + 가입 권유
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 진입점을 하나로 모았습니다 ──────────────────────────────────────
// │ 예전에는 갈래가 둘이었습니다. 별조각이 있으면 이 화면, 없으면
// │ /tarot/reading (주제 알약 목록) → /tarot/reading/[주제] (질문 목록).
// │ 사람마다 "타로보기"를 눌렀을 때 다른 화면이 떴다는 뜻입니다.
// │
// │ 이제 전부 이 화면입니다. 주제 고르기와 질문 고르기가 여기 칩으로
// │ 들어왔고, 옛 화면 둘은 지웠습니다. 갈리는 자리는 카드를 다 뽑은
// │ 뒤 해석 한 곳뿐입니다 — 무엇을 물을지 고르는 경험은 같아야 합니다.
// └──────────────────────────────────────────────────────────────────
//
// 해석은 /api/reading(유료) · /api/reading/free(맛보기)가 흘려보내 주고,
// 이어지는 면담은 /api/reading/chat 이 맡습니다.
"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { QuestionPicker } from "@/components/question-picker"
import { FreeReadingResult } from "@/components/free-reading-result"
import { readingTopics, type ReadingTopicSlug } from "@/lib/reading-topics"
import { topicContent, type ReadingQuestion } from "@/lib/reading-content"
import type { ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { HEADER_SPACE } from "@/lib/layout"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { Button } from "@/components/ui/button"
import { ReadingResultView, type PickedCard } from "@/components/reading-result-view"
import { buildFreeQuestion, FREE_QUESTION_SLUG } from "@/lib/free-question"
import { useReadingStream } from "@/lib/use-reading-stream"
import { FALLBACK_PLAN, layoutKeyForCount, type ReadingPlan } from "@/lib/ai/reading-plan"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import { ChatInput } from "@/components/chat-input"
import { ChatErrorBox } from "@/components/chat-error-box"
import { describeChatError, type ChatErrorInfo } from "@/lib/chat-errors"
import { canUseInsiteReading } from "@/lib/reading-entitlement"
import { useAccount } from "@/lib/use-account"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { appendTurn, replaceTurns, saveReading } from "@/lib/reading-archive"

type Step = "ask" | "draw" | "result"

export default function AskPage() {
  const router = useRouter()
  const { account, ready: accountReady, refresh: refreshAccount } = useAccount()
  // 별조각으로 사이트 안 해석을 받을 수 있는 사람인가.
  // ⚠️ 이 값으로 화면을 막지 않습니다. 무엇을 물을지 고르는 데까지는
  //    누구나 옵니다 — 갈리는 곳은 해석 한 곳뿐입니다.
  const paid = accountReady && canUseInsiteReading(account)
  const [step, setStep] = useState<Step>("ask")
  const [question, setQuestion] = useState("")
  // 고른 주제 (칩). 안 골랐으면 추천 질문이 뜹니다.
  const [topic, setTopic] = useState<ReadingTopicSlug | null>(null)
  // 이번에 보는 질문 — 준비된 질문이면 배열까지 함께 정해져 있습니다.
  const [asked, setAsked] = useState<{
    topicSlug: ReadingTopicKey
    question: ReadingQuestion
  } | null>(null)
  // 키보드가 가린 높이 — 입력창을 그만큼 올려 키보드에 붙입니다
  const keyboardInset = useKeyboardInset()
  const [cards, setCards] = useState<PickedCard[]>([])
  // 샨티가 이 질문에 맞게 고른 배열 (몇 장 · 어떤 자리)
  const [plan, setPlan] = useState<ReadingPlan | null>(null)
  const [planning, setPlanning] = useState(false)
  // 판을 시작하지도 못하고 막혔을 때의 사유 (지금은 무료 총량 문 하나입니다).
  // ⚠️ 카드를 뽑기 전에 말해줘야 합니다. 다 뽑고 나서 막히면 한 판을
  //    통째로 헛수고시킨 셈입니다.
  const [startError, setStartError] = useState<ChatErrorInfo | null>(null)
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

  // 홈에서 주제 카드를 눌러 들어오면 그 주제가 이미 골라진 채로 시작합니다
  // (?주제=love). 한 번 고른 것을 또 고르게 하지 않으려는 것입니다.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("topic")
    if (wanted && readingTopics.some((t) => t.slug === wanted)) {
      setTopic(wanted as ReadingTopicSlug)
    }
  }, [])

  /**
   * 질문이 정해졌습니다 — 여기서부터 한 판이 시작됩니다.
   *
   * prepared 가 있으면 준비된 질문이라 배열(몇 장·어떤 자리)이 이미
   * 정해져 있습니다. 직접 친 질문이면 배열을 정해야 하는데, 그건
   * 별조각을 낸 사람에게만 샨티가 해줍니다 (아래 참고).
   */
  async function submit(text: string, prepared?: ReadingQuestion, topicSlug?: ReadingTopicSlug) {
    const q = text.trim()
    if (!q || planning) return
    setQuestion(q)
    setStartError(null)

    // ── 맛보기로 보는 사람 ─────────────────────────────────────────
    // 서버를 부르지 않고 바로 뽑기로 갑니다. 낼 별조각도, 만들 판도
    // 없으니 물어볼 것이 없습니다.
    //
    // ⚠️ 배열은 샨티가 고르지 않습니다 — 그건 /api/reading/plan 이고
    //    로그인과 별조각이 필요합니다. 준비된 질문이면 그 질문에 딸린
    //    배열을, 직접 친 질문이면 기본 여섯 장 십자를 씁니다.
    //    막는 것이 아니라 갈리는 것입니다: "샨티가 이 질문에 맞는 배열을
    //    골라준다"가 가입하면 달라지는 것 하나가 됩니다.
    if (!paid) {
      setAsked({
        topicSlug: (topicSlug ?? "self") as ReadingTopicKey,
        question: prepared ?? buildFreeQuestion(q),
      })
      setPlan(null)
      setStep("draw")
      return
    }

    setPlanning(true)
    // 이 질문에 어떤 배열이 어울릴지 샨티가 정합니다 (2초 안팎).
    //
    // 별조각은 이 호출 안에서 서버가 깎습니다. 화면에서 깎던 예전 방식은
    // 이 호출만 건너뛰면 공짜였습니다.
    let nextPlan: ReadingPlan = FALLBACK_PLAN
    try {
      const response = await fetch("/api/reading/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      })

      // 별조각이 모자라면 받으러 가는 길로 보냅니다 (빈손으로 뽑게 두지 않습니다).
      // ⚠️ 화면을 열 때는 있었는데 그 사이에 다른 탭에서 다 쓴 경우입니다.
      //    드문 일이라 맛보기로 슬쩍 바꿔치기하지 않고 분명히 말합니다 —
      //    사이트 안 해석을 기대하고 고른 질문이니까요.
      if (response.status === 402) {
        setPlanning(false)
        router.push("/my/credits")
        return
      }

      // ── 판을 시작하지 못한 경우 ──────────────────────────────────
      // 지금은 무료 총량 문 하나입니다(kind: "doorClosed"). 카드를 뽑기
      // 전에 이 자리에서 말해주고, 크레딧으로 가는 길을 함께 내줍니다.
      //
      // ⚠️ 여기서 뽑기 화면으로 넘어가면 안 됩니다. 판(readingId)이 없어서
      //    다 뽑고 난 뒤 해석을 부르는 자리에서 막힙니다 — 한 판을 통째로
      //    헛수고시키고, 그제서야 이유를 말하는 셈입니다.
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string
          hint?: string
          kind?: string
        }
        setPlanning(false)
        setStartError(
          describeChatError({
            status: response.status,
            kind: body.kind,
            message: body.error,
            hint: body.hint,
          })
        )
        void refreshAccount()
        return
      }

      nextPlan = (await response.json()) as ReadingPlan
    } catch {
      // 연결이 끊긴 것뿐일 수 있습니다. 배열은 기본값으로 두고 흐름은 잇습니다
      // (해석을 부를 때 다시 한 번 막힐 기회가 있습니다).
      nextPlan = FALLBACK_PLAN
    }

    setPlan(nextPlan)
    // 샨티가 고른 배열로 뽑습니다. 준비된 질문이어도 그렇습니다 — 질문 글을
    // 보고 고른 것이라 그 질문에 더 맞습니다.
    setAsked({
      topicSlug: (topicSlug ?? "self") as ReadingTopicKey,
      question: buildFreeQuestion(q, nextPlan),
    })
    setPlanning(false)
    setStep("draw")
    void refreshAccount()
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

  // 누가 왔는지 알기 전에는 그리지 않습니다. 별조각 유무로 해석이 갈리는데,
  // 모르는 채로 그리면 맛보기 화면이 잠깐 스쳤다 바뀝니다.
  if (!accountReady) return <div className="min-h-screen bg-background" />

  // ── 2) 카드 섞기 · 뽑기 ────────────────────────────────────────
  if (step === "draw" && asked) {
    return (
      // 카드 고르기 화면은 딱 한 화면입니다. 100vh 는 모바일 사파리에서
      // 주소창을 뺀 높이보다 커서 스크롤이 생기므로 dvh 를 씁니다.
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <main
          className={`relative z-10 mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
        >
          {/* 뒤로가면 질문 고르기로 돌아옵니다. 주소를 옮기지 않고 단계만
              되돌립니다 — 옮기면 고른 주제와 친 글이 사라집니다. */}
          <PageHeader variant="reading" centerCharacter onBack={() => setStep("ask")} />
          <CardReadingFlow
            mode="inline"
            topicLabel={question}
            topicSlug={asked.topicSlug}
            question={asked.question}
            introMessage={plan?.intro ?? `"${question}"이라... 좋은 질문이구먼. 마음을 담아 섞어보라냥.`}
            onComplete={(picked) => {
              setCards(picked)
              setStep("result")
              // 별조각을 낸 사람만 여기서 해석을 받습니다. 맛보기는 결과
              // 화면이 스스로 부릅니다 (부르는 주소가 다릅니다).
              if (paid) void runReading(picked)
            }}
          />
        </main>
      </div>
    )
  }

  // ── 3) 해석 ───────────────────────────────────────────────────
  // 여기가 유일하게 갈리는 자리입니다.
  if (step === "result" && asked && !paid) {
    return (
      <FreeReadingResult
        topicSlug={asked.topicSlug}
        question={asked.question}
        cards={cards}
        isLoggedIn={account.isLoggedIn}
        onBack={() => setStep("ask")}
      />
    )
  }

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
          // 이 판에 딸려온 이어묻기 몫 — 선물 판과 산 판이 다릅니다.
          // 화면이 숫자를 직접 알고 있으면 안 됩니다 (서버가 정합니다).
          followupsAllowed={plan?.followupsAllowed}
          streaming={streaming}
          error={error}
          onTurn={(turn) => readingId && appendTurn(readingId, turn)}
          onTurnsReplace={(turns) => readingId && replaceTurns(readingId, turns)}
          onDrawRequest={handleDrawRequest}
          onRegenerate={() => void runReading(cards)}
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
                // 이것도 카드를 뽑는 화면이라 헤더에 샨티가 섭니다
                centerCharacter
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
        <PageHeader variant="reading" centerCharacter backHref="/" />

        {/* 말풍선은 상단에 고정합니다 — 아래 칩이 길어 스크롤돼도 샨티의
            말은 자리를 지킵니다. */}
        <div className="shrink-0">
          <ReadingCharacterBubble
            placement="top"
            message={
              topic
                ? topicContent[topic].reactionLine
                : "잘 왔다냥. 때로는 가볍게 던진 질문이 큰 울림을 준다네. 궁금한 것이 있으면 이 몸에게 물어보게냥."
            }
          />
        </div>

        {/* ── 제안 ───────────────────────────────────────────────────
            말풍선 바로 아래에서 시작해 아래로 흘러내립니다. 칩이 많으면
            (주제 하나에 질문이 여남은 개입니다) 이 영역만 스크롤합니다.

            ⚠️ 아래에 붙이지 않습니다(justify-end 아님). 붙여놨더니 화면이
               큰 기기에서 말풍선과 칩 사이가 텅 비고, 칩 묶음이 입력창에
               딸린 부속처럼 보였습니다. 시안은 위에서부터 떨어집니다. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col pt-5">
            {/* 판을 시작하지 못했을 때 — 무엇 때문인지와 다음 걸음을 함께.
                입력창 바로 위라 다시 물으려던 손이 반드시 지나갑니다. */}
            {startError && <ChatErrorBox info={startError} className="mb-4" />}

            <QuestionPicker
              topic={topic}
              onTopicChange={setTopic}
              onPick={(label, prepared, slug) => void submit(label, prepared, slug)}
              disabled={planning}
            />
          </div>
        </div>

        {/* 입력창은 화면 맨 아래 붙박이입니다.
            키보드가 올라오면 그 높이만큼 위로 올려 키보드에 딱 붙입니다
            (h-dvh 는 키보드를 계산에 넣지 않아 그대로 두면 가려집니다). */}
        <div
          className={`shrink-0 transition-[margin] duration-150 ${
            // 키보드가 올라와 있으면 아래 여백을 10px 로 줄여 바짝 붙입니다
            keyboardInset > 0 ? "pb-2.5" : "pb-[max(2rem,env(safe-area-inset-bottom))]"
          }`}
          style={{ marginBottom: keyboardInset }}
        >
          <ChatInput
            value={question}
            onChange={setQuestion}
            onSubmit={() => submit(question)}
            disabled={planning}
            placeholder={planning ? "샨티가 카드를 고르는 중..." : "무엇이든 물어보세요."}
            ariaLabel="질문 입력"
            // 흰 질문 칩이 깔린 화면이라 입력창은 회색으로 눌러둡니다
            tone="muted"
            className="mt-4"
          />
        </div>
      </main>
    </div>
  )
}
