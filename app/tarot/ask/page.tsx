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

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { QuestionPicker } from "@/components/question-picker"
import { FreeReadingResult } from "@/components/free-reading-result"
import { readingTopics, type ReadingTopicSlug } from "@/lib/reading-topics"
import { topicContent, type ReadingQuestion } from "@/lib/reading-content"
import { getTopicConfig, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { HEADER_SPACE, HEADER_SPACE_PX } from "@/lib/layout"
import { BlurVeil } from "@/components/blur-veil"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { ReadingResultView, type PickedCard } from "@/components/reading-result-view"
import { buildFreeQuestion, freeIntroFor, freeSpreadFor, FREE_QUESTION_SLUG } from "@/lib/free-question"
import { auditFreeQuestion, type QuestionAudit } from "@/lib/question-safety"
import { QuestionCareNotice } from "@/components/question-care-notice"
import { useReadingStream } from "@/lib/use-reading-stream"
import { FALLBACK_PLAN, layoutKeyForCount, type ReadingPlan } from "@/lib/ai/reading-plan"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import { ChatInput } from "@/components/chat-input"
import { AiBadge } from "@/components/ai-badge"
import { ChatErrorBox } from "@/components/chat-error-box"
import { describeChatError, type ChatErrorInfo } from "@/lib/chat-errors"
import { canUseInsiteReading } from "@/lib/reading-entitlement"
import { useAccount } from "@/lib/use-account"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { appendTurn, replaceTurns, saveReading } from "@/lib/reading-archive"
import { resetReadingDeck } from "@/lib/reading-session"
import { createDrawTracker, type DrawTracker } from "@/lib/draw-signals"

type Step = "ask" | "draw" | "result"

/**
 * 카드를 섞기 시작할 때 샨티가 하는 말.
 *
 * ┌─ 어느 말을 쓰는가 ────────────────────────────────────────────────
 * │ 준비된 질문   주제마다 손으로 쓴 확인 문구 (confirmTemplate)
 * │               "그 사람이 마음에 걸리는구먼… 마음을 담아 섞어보라냥"
 * │ 주제 전체보기 그 주제를 통째로 보는 것이라 질문을 되뇌지 않습니다
 * │ 직접 친 질문  샨티가 배열을 고르며 함께 지은 말(plan.intro)
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 예전에는 전부 plan.intro 하나로 갔습니다. 준비된 질문의 확인 문구가
 *    그때 통째로 묻혔습니다 — 주제마다 말투를 달리 써둔 것이 있는데도
 *    무슨 질문이든 같은 말이 나왔습니다.
 *
 * ⚠️ 직접 친 물음의 기본 문구는 손으로 쓰지 않습니다(freeIntroFor). 예전에
 *    여기 「"{q}"이라... 좋은 질문이구먼」이 박혀 있어서, 「힘들다」에도
 *    「나 암이래 너무 걱정돼」에도 똑같이 좋은 질문이라고 답했습니다.
 */
function drawIntro(
  asked: { topicSlug: ReadingTopicKey; question: ReadingQuestion } | null,
  typed: string,
  plan: ReadingPlan | null,
  audit: QuestionAudit | null
): string {
  if (asked && asked.question.slug !== FREE_QUESTION_SLUG) {
    const config = getTopicConfig(asked.topicSlug)
    // "그냥 요즘 ~ 궁금해"는 주제를 통째로 보는 것이라 질문을 되읽지 않습니다
    if (asked.question.slug === "general") {
      return `${topicContent[asked.topicSlug].titleLabel}에 대해 마음을 담아 섞어보라냥.`
    }
    return config.confirmLine(asked.question.label)
  }
  return plan?.intro || freeIntroFor(typed, audit)
}

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
  // 직접 친 물음을 읽어본 결과 — 조심할 물음이면 뽑기 전에 한 마디 겁니다.
  // ⚠️ 물음 자체를 바꾸지는 않습니다 (lib/question-safety.ts 머리말 참고).
  const [audit, setAudit] = useState<QuestionAudit | null>(null)
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

  // 이 판을 어떻게 뽑았는지 재는 자 (lib/draw-signals.ts).
  // ⚠️ 지금은 재서 남기기만 합니다 — 해석에는 싣지 않습니다.
  //
  // ⚠️ 판마다 새로 만들어야 합니다. useRef 는 화면이 처음 뜰 때 딱 한 번만
  //    만들고 그 뒤로는 절대 새로 안 만듭니다. 그런데 "다시 보기"는 페이지를
  //    새로 여는 게 아니라 단계만 되돌리므로(setStep("ask")), 그냥 두면
  //    두 번째 판에 첫 판의 시간이 그대로 섞입니다 — 한 번 열어놓고 여러 판
  //    보는 사람의 기록이 전부 첫 판 쪽으로 오염됩니다. 그래서 질문
  //    고르기로 돌아갈 때 backToAsk() 로 비웁니다.
  const trackerRef = useRef<DrawTracker>(createDrawTracker())

  // 뽑기가 끝난 순간에 찍어두는 사진.
  //
  // ⚠️ 화면을 그리면서 snapshot() 을 부르지 않습니다. 그리는 중에 ref 를
  //    읽는 셈이고, 다시 그릴 때마다 새 사진이 찍혀 자식에게 매번 다른
  //    물건이 넘어갑니다. 뽑기가 끝나는 순간(onComplete)은 이벤트라
  //    ref 를 만져도 되는 자리이고, 뜻으로도 그때가 맞습니다.
  const [drawSignals, setDrawSignals] = useState<ReturnType<DrawTracker["snapshot"]> | null>(null)

  /** 질문 고르기로 되돌아갑니다 — 다음 판을 위해 재는 자를 새로 답니다 */
  const backToAsk = useCallback(() => {
    trackerRef.current = createDrawTracker()
    setDrawSignals(null)
    setStep("ask")
  }, [])

  // ┌─ 겹쳐 놓기 ───────────────────────────────────────────────────────
  // │ 두 층입니다.
  // │   아래층  칩 — 영역이 화면 맨 위에서 맨 아래까지입니다
  // │   위층    헤더 · 말풍선 · 입력창 (붙박이)
  // │ 칩이 위층 뒤 뎁스로 지나가고, 겹치는 자리는 흐림 장막이 덮습니다.
  // │
  // │ ⚠️ 말풍선은 내용이 아닙니다. "지금 무엇을 하는 자리인지" 일러주는
  // │    페이지 안내라 위층에 붙박여야 합니다. 칩과 한 덩이로 흘려보냈더니
  // │    스크롤할 때 안내가 통째로 사라졌습니다.
  // │
  // │ ⚠️ 그렇다고 칩 영역을 "말풍선 아래 ~ 입력창 위"로 잡으면 안 됩니다.
  // │    위층은 화면 밖 테두리지 칩 영역의 경계가 아닙니다. 여백은 첫 칩이
  // │    처음 놓이는 자리만 정하고, 영역 자체는 끝까지 갑니다.
  // │
  // │ ⚠️ 세 덩이를 세로로 쌓는 것(flex-col)도 같은 잘못입니다. 그렇게
  // │    두었더니 마지막 칩이 늘 반쯤 잘린 채 멈췄고, 흐려지지도 않아
  // │    고장처럼 보였습니다.
  // │
  // │ 위층 높이는 재서 씁니다 — 말풍선은 글에 따라 두 줄도 세 줄도 되고
  // │ 입력창도 기기마다 달라서 값을 박아둘 수 없습니다.
  // └──────────────────────────────────────────────────────────────────
  const [bubbleHeight, setBubbleHeight] = useState(0)
  const [inputHeight, setInputHeight] = useState(0)

  // ⚠️ useRef 로 잡으면 안 됩니다. 회원 정보를 기다리는 동안 이 화면은
  //    빈 판을 먼저 내놓는데(accountReady 가 거짓일 때), 그때 effect 가
  //    먼저 돌아 ref 가 비어 있습니다. 그 뒤로는 다시 돌 일이 없어서
  //    입력창 높이가 영영 0 으로 남고, 칩이 입력창 뒤로 지나가지 못한 채
  //    아래 여백만 24px 인 화면이 됩니다 (실제로 그렇게 났습니다).
  //    콜백 ref 는 실제로 붙는 순간에 불려서 그 틈이 없습니다.
  const [inputBar, setInputBar] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!inputBar) return
    const measure = () => setInputHeight(inputBar.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(inputBar)
    return () => observer.disconnect()
  }, [inputBar])

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
    // 직접 친 물음만 읽어봅니다 (칩 질문은 사람이 설계한 것이라 그대로).
    // 물음은 친 그대로 두고, 조심할 물음이면 배열과 안내만 달라집니다.
    const typedAudit = prepared ? null : auditFreeQuestion(q)
    setQuestion(q)
    setAudit(typedAudit)
    setStartError(null)

    // 어떻게 질문을 정했는지 — 칩인가, 주제 고르기 전 추천인가, 직접 쳤는가
    trackerRef.current.chose(prepared ? (topicSlug ? "chip" : "opener") : "typed")

    // 새 판이니 덱을 새로 섞습니다.
    //
    // ⚠️ 덱 순서는 sessionStorage 에 남습니다(lib/reading-session.ts). 안 지우면
    //    한 번 열어둔 탭에서 보는 모든 판이 같은 덱을 씁니다 — 부채 순서는
    //    섞은 횟수로 정해지므로, 같은 횟수만큼 섞고 같은 자리를 고르면 앞
    //    판과 똑같은 카드가 나옵니다. 예전에는 주제 고르기 화면이 들어올 때마다
    //    지웠는데, 그 화면을 이 화면으로 합치면서 지우는 자리가 사라졌습니다.
    //
    // ⚠️ 면담 중에 카드를 더 뽑는 길(followup)에서는 부르지 않습니다. 그건
    //    같은 판이라 펼쳐둔 부채를 그대로 이어 써야 합니다.
    resetReadingDeck()

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
        topicSlug: (topicSlug ?? typedAudit?.topicKey ?? "self") as ReadingTopicKey,
        // ⚠️ 장수는 여섯으로 지키고 자리 이름만 분류에 맞게 갑니다.
        //    진로 질문에 "상대의 마음"이 뜨거나, 검사 결과를 기다리는
        //    사람에게 "다가올 흐름"을 묻는 자리가 생기지 않도록
        //    (lib/free-question.ts 의 freeSpreadFor).
        question: prepared ?? buildFreeQuestion(q, freeSpreadFor(typedAudit)),
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
        body: JSON.stringify({
          question: q,
          // 준비된 질문이면 그 질문에 딸린 배열을 함께 보냅니다. 서버는
          // 이걸 받으면 AI 에게 배열을 묻지 않고 그대로 씁니다 — 손으로
          // 쓴 자리 이름과 뽑을 때 문구가 살아남습니다.
          prepared: prepared
            ? { layoutKey: prepared.layoutKey, positions: prepared.positions }
            : undefined,
        }),
      })

      // 별조각이 모자라면 받으러 가는 길로 보냅니다 (빈손으로 뽑게 두지 않습니다).
      // ⚠️ 화면을 열 때는 있었는데 그 사이에 다른 탭에서 다 쓴 경우입니다.
      //    드문 일이라 맛보기로 슬쩍 바꿔치기하지 않고 분명히 말합니다 —
      //    사이트 안 해석을 기대하고 고른 질문이니까요.
      if (response.status === 402) {
        setPlanning(false)
        router.push("/my/credits/buy")
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
    // ⚠️ 준비된 질문은 그대로 씁니다. 예전에 여기서 buildFreeQuestion 으로
    //    덮어썼더니, 손으로 쓴 배열(켈틱 십자 열 장의 자리 이름과 뽑을 때
    //    들려주는 말)이 통째로 사라지고 일반 문구로 바뀌었습니다.
    //    직접 친 질문일 때만 샨티가 고른 배열을 입힙니다.
    // 서버가 다시 읽어본 결과가 있으면 그것을 씁니다 (화면 것은 참고용).
    setAudit(nextPlan.audit ?? typedAudit)
    setAsked({
      topicSlug: (topicSlug ?? nextPlan.audit?.topicKey ?? typedAudit?.topicKey ?? "self") as ReadingTopicKey,
      question: prepared ?? buildFreeQuestion(q, nextPlan),
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
      topicKey: asked?.topicSlug ?? "self",
      questionSlug: FREE_QUESTION_SLUG,
      questionLabel: question,
      plan,
      cards: picked,
      readingId: plan?.readingId,
      // 이 판을 어떻게 뽑았는지 (재서 남기기만 합니다 — 해석에는 안 실립니다)
      signals: trackerRef.current.snapshot(),
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
      // 카드 고르기 화면도 딱 한 화면입니다.
      // ⚠️ 질문 고르기 화면과 같은 까닭으로 뷰포트에 못 박습니다 —
      //    h-dvh 는 높이만 화면에 맞출 뿐, 상자는 문서 안에 남습니다.
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
        <main
          className={`relative z-10 mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
        >
          {/* 뒤로가면 질문 고르기로 돌아옵니다. 주소를 옮기지 않고 단계만
              되돌립니다 — 옮기면 고른 주제와 친 글이 사라집니다. */}
          <PageHeader variant="reading" centerCharacter onBack={backToAsk} />
          {/* 조심할 물음이면 카드보다 먼저 이 상자를 봅니다 (위기면 연락처까지). */}
          <QuestionCareNotice audit={audit} className="mb-3 shrink-0" />
          <CardReadingFlow
            question={asked.question}
            introMessage={drawIntro(asked, question, plan, audit)}
            // 이 판을 시작하는 뽑기에만 넘깁니다 — 면담 중 더 뽑기에는
            // 넘기지 않습니다 (같은 판을 이어가는 것이라 섞이면 안 됩니다)
            //
            // ⚠️ 여기서 ref 를 읽는 것은 일부러입니다. 자식이 이 통에 값을
            //    "부어야" 하므로 사진이 아니라 통 자체를 넘겨야 합니다. 통은
            //    한 판 내내 바뀌지 않고, 화면에 그리지도 않습니다 — 규칙이
            //    막으려는 "ref 로 화면을 그렸는데 값이 바뀌어도 안 바뀌는"
            //    상황이 아닙니다.
            // eslint-disable-next-line react-hooks/refs
            signals={trackerRef.current}
            onComplete={(picked) => {
              setCards(picked)
              // 뽑기가 끝난 이 순간이 사진 찍을 자리입니다 (이벤트 안이라
              // ref 를 만져도 되고, 뜻으로도 여기가 맞습니다).
              setDrawSignals(trackerRef.current.snapshot())
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
        signals={drawSignals}
        onBack={backToAsk}
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
          <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background">
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
    // ⚠️ h-dvh 가 아니라 fixed inset-0 입니다.
    //
    //    h-dvh 로 두면 상자 높이는 화면과 같아지지만, 상자 자체는 여전히
    //    문서 안에 있습니다. 아이폰 사파리는 주소창을 접었다 펴며 문서를
    //    조금씩 밀어 올리는데, 그때 문서가 통째로 움직입니다. 그러면 이
    //    상자에 기대어 놓은 absolute 들(말풍선·입력창·장막)이 함께
    //    끌려가고, 뷰포트에 못 박힌 fixed(헤더)만 제자리에 남습니다 —
    //    "헤더는 가만있는데 말풍선이랑 입력창만 스크롤되는" 모양이 됩니다.
    //
    //    상자를 뷰포트에 못 박으면 문서가 어떻게 움직이든 상관없어지고,
    //    움직이는 것은 안쪽 스크롤 하나뿐입니다.
    <div className="fixed inset-0 overflow-hidden bg-background">
      <PageHeader variant="reading" centerCharacter backHref="/" />

      {/* ── 아래층: 칩 ─────────────────────────────────────────────────
          영역은 화면 맨 위(y=0)에서 맨 아래까지입니다. 헤더·말풍선·입력창
          자리도 이 영역에 들어갑니다 — 칩은 그 뒤 뎁스로 지나갑니다.

          여백은 "영역의 끝"이 아니라 "쉴 때 놓이는 자리"를 정합니다.
          위층 높이만큼 위아래를 비워, 첫 칩은 말풍선 바로 아래에서
          시작하고 마지막 칩은 입력창 바로 위에서 멈춥니다. 손으로 밀면
          그 사이 구간에서 칩이 위층 뒤로 지나가며 흐려집니다.

          ⚠️ 아래 여백을 0 으로 두면 안 됩니다. 여백이 곧 스크롤할 거리라,
             없애면 내용이 화면보다 짧아져 스크롤 자체가 사라집니다 —
             칩이 위층 뒤로 갈 기회도 함께 없어집니다. 실제로 그랬습니다. */}
      <div className="h-full overflow-y-auto overscroll-contain">
        <div
          className="mx-auto w-full max-w-site px-6 sm:px-8"
          style={{
            paddingTop: HEADER_SPACE_PX + bubbleHeight + 20,
            paddingBottom: inputHeight,
          }}
        >
          {/* 판을 시작하지 못했을 때 — 무엇 때문인지와 다음 걸음을 함께.
              입력창 바로 위라 다시 물으려던 손이 반드시 지나갑니다. */}
          {startError && <ChatErrorBox info={startError} className="mb-4" />}

          <QuestionPicker
            topic={topic}
            onTopicChange={(next) => {
              // 주제를 고쳐 고른 것만 셉니다 (처음 고르는 건 바꾼 게 아닙니다)
              if (topic !== null) trackerRef.current.topicChanged()
              setTopic(next)
            }}
            onPick={(label, prepared, slug) => void submit(label, prepared, slug)}
            disabled={planning}
          />
        </div>
      </div>

      {/* ── 흐림 장막 ────────────────────────────────────────────────
          위층 뒤로 지나가는 칩을 덮습니다. 겹겹이 깔려 경계 없이
          서서히 옅어집니다 (components/blur-veil.tsx). */}
      <BlurVeil side="top" height={HEADER_SPACE_PX + bubbleHeight + 40} />
      {/* ⚠️ 아래 장막은 없습니다. 입력창 띠가 자기 흐림(2px)을 들고 있고,
          여기에 장막(최대 16px)을 겹치면 시안보다 여덟 배 흐려집니다 —
          뒤에 칩이 비쳐야 한다는 시안 메모와 정반대가 됩니다. */}

      {/* ── 위층: 말풍선 ──────────────────────────────────────────────
          ⚠️ 말풍선은 내용이 아닙니다. "지금 무엇을 하는 자리인지" 일러주는
             페이지 안내라, 칩보다 위층에 붙박여 있습니다. 칩과 함께
             흘려보냈더니 스크롤할 때 안내가 사라졌습니다.

          ⚠️ 손이 통과하지 않게 둡니다(pointer-events 를 끄지 않습니다).
             흐려서 읽을 수 없는 칩이 눌리면 엉뚱한 질문으로 넘어갑니다. */}
      <div className="absolute inset-x-0 top-0 z-30" style={{ paddingTop: HEADER_SPACE_PX }}>
        <div className="mx-auto w-full max-w-site px-6 sm:px-8">
          <ReadingCharacterBubble
            placement="top"
            message={
              topic
                ? topicContent[topic].reactionLine
                : "잘 왔다냥. 때로는 가볍게 던진 질문이 큰 울림을 준다네. 궁금한 것이 있으면 이 몸에게 물어보게냥."
            }
            onHeightChange={setBubbleHeight}
          />
        </div>
      </div>

      {/* ── 위층: 입력창 ──────────────────────────────────────────────
          키보드가 올라오면 그 높이만큼 위로 올려 키보드에 딱 붙입니다
          (h-dvh 는 키보드를 계산에 넣지 않아 그대로 두면 가려집니다).

          ⚠️ **흐림 띠는 입력창 아래에만 있습니다.** 이 감싸개에는 흐림도
             색도 걸지 않습니다. 예전에는 여기에 걸어서 흐림이 입력창
             **위에서부터** 시작했고, 입력창 위 빈 자리에 가로선이 하나
             그어진 것처럼 보였습니다 (시안 지적: "텍스트 상자 위에부터
             블러가 시작되는게 아니라"). 입력창 뒤가 흐린 것은 입력창 자신의
             backdrop-filter(8px)가 내는 것이고, 그 위는 그대로 또렷합니다.

          ⚠️ backdrop-filter 를 쓰면서 marginBottom 으로 움직입니다.
             transform 으로 바꾸지 마세요 — 조상에 transform 이 생기면
             자식(입력창·아래 띠)의 backdrop-filter 가 통째로 죽습니다. */}
      <div
        ref={setInputBar}
        className="absolute inset-x-0 bottom-0 z-30 transition-[margin] duration-150"
        style={{ marginBottom: keyboardInset }}
      >
        <div className="mx-auto w-full max-w-site px-6 sm:px-8">
          <ChatInput
            value={question}
            onChange={(next) => {
              trackerRef.current.typing(next.length)
              setQuestion(next)
            }}
            onSubmit={() => submit(question)}
            disabled={planning}
            placeholder={planning ? "샨티가 카드를 고르는 중..." : "무엇이든 물어보세요."}
            ariaLabel="질문 입력"
            // 흰 질문 칩이 깔린 화면이라 입력창은 회색으로 눌러둡니다
            tone="muted"
            className="mt-4"
          />
        </div>

        {/* ── 아래 띠 — 흐림은 여기서만 ────────────────────────────────
            ┌─ 시안 실측 (2026-08) ────────────────────────────────────
            │ background : linear-gradient(180deg,
            │                rgba(197,195,187,0.00) 0%,
            │                rgba(197,195,187,0.40) 100%)
            │ backdrop-filter : blur(2px)
            └──────────────────────────────────────────────────────────

            ⚠️ 윗변이 입력창 **아래변에 딱 붙습니다**. 입력창을 감싸지
               않습니다 — 감싸면 흐림이 입력창 위에서부터 시작해서
               시안이 X 표시한 모양이 됩니다.

            ⚠️ 화면 폭 전체입니다. 입력창을 담은 칸(max-w-site · px-6)
               안에 넣으면 좌우 여백이 흐림 밖으로 남아, 띠가 가운데만
               잘린 조각처럼 보입니다.

            ⚠️ **뒤가 비쳐야 합니다.** 시안 메모: "살짝 뒤에 뎁스 (칩이나
               내용들이 보임)". 예전에 from-background(불투명)를 깔았더니
               아래쪽 칩이 통째로 사라져 화면이 거기서 끝난 것처럼
               보였습니다. 제일 진한 곳도 40% 입니다.

            ⚠️ 흐림도 2px 하나뿐입니다. 아래쪽 BlurVeil(최대 16px)을 함께
               깔면 시안보다 여덟 배 흐려져서 40% 로 낮춰도 뒤가 안 보입니다.
               그래서 아래 장막은 걷어냈습니다 (위쪽 헤더 장막은 그대로). */}
        <div
          className={`pt-2 ${
            // 키보드가 올라와 있으면 아래 여백을 10px 로 줄여 바짝 붙입니다.
            // 시안: AI 표기 아래 18. 홈 인디케이터가 있는 기기에서는 그
            // 높이를 씁니다 — 18 로 고정하면 표기가 인디케이터에 깔립니다.
            keyboardInset > 0 ? "pb-2.5" : "pb-[max(18px,env(safe-area-inset-bottom))]"
          }`}
          style={{
            background:
              "linear-gradient(180deg, rgba(197,195,187,0.00) 0%, rgba(197,195,187,0.40) 100%)",
            WebkitBackdropFilter: "blur(2px)",
            backdropFilter: "blur(2px)",
          }}
        >
          {/* 사전 고지 — 묻기 "전에" 알립니다.
              법이 요구합니다: 생성형 AI 를 쓰는 서비스는 처음 이용하는
              시점에 그 사실을 알려야 합니다 (components/ai-badge.tsx 머리말).
              결과에 붙는 표시(AiBadge)와 짝입니다 — 하나는 묻기 전,
              하나는 답을 받은 뒤.

              ⚠️ 상자로 만들지 않습니다. 물으려는 사람 앞에 상자를 놓으면
                 그것부터 치워야 합니다. 입력창 아래 한 줄이면 읽힙니다.

              ⚠️ 시안(2026-08)대로 한 줄로 줄였습니다 — "샨티의 리딩 [AI]".
                 입력창 아래 8, 가운데 정렬입니다.
                 예전 문장("재미와 자기성찰로 봐주세요")은 여기서 뺐습니다.
                 물으려는 사람에게 미리 하는 당부라 읽히지 않았고, 같은 말이
                 결과 화면과 이용약관에 이미 있습니다. */}
          {/* 입력창 아래 8 은 이 띠의 pt-2 가, 아래 18 은 pb 가 냅니다 */}
          <div className="flex justify-center">
            <AiBadge />
          </div>
        </div>
      </div>
    </div>
  )
}
