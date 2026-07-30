// components/reading-result-view.tsx
// 사이트 내 해석 결과 + 이어서 대화하기 화면 (시안의 "결과보기" · "대화하기").
//
// 이어지는 물음은 lib/use-reading-chat.ts 가 맡습니다. 샨티가 카드를 더
// 봐야겠다고 하면 두 갈래입니다 — 이 몸이 대신 뽑거나(카드가 말 아래에
// 깔리고 곧바로 이어 읽어줍니다), 묻는 이가 직접 뽑거나(onDrawRequest 로
// 카드 고르기 화면에 넘깁니다).
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 사용자 말풍선 : bg-secondary(연라임) · 오른쪽 정렬
// │ · 샨티 답변     : 말풍선 없이 본문 그대로 (시안과 동일)
// │ · 답변 액션     : 복사 · 좋아요 · 싫어요 · 새로고침
// │ · 입력창        : 화면 하단 고정
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check, Layers } from "lucide-react"
import { spreadLayouts, type LayoutKey } from "@/lib/spread-layouts"
import { CardSpread } from "@/components/card-spread"
import { BlinkingShanti } from "@/components/pixel-sprite"
import { PageHeader } from "@/components/page-header"
import { ChatInput } from "@/components/chat-input"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { HEADER_SPACE } from "@/lib/layout"
import { type ReadingResult } from "@/lib/mock-reading"
import { ChatErrorBox } from "@/components/chat-error-box"
import type { ChatErrorInfo } from "@/lib/chat-errors"
import { useReadingChat, type ChatTurn } from "@/lib/use-reading-chat"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"
import {
  FOLLOWUPS_PER_CREDIT,
  FOLLOWUP_WARN_AT,
  FOLLOWUP_NEARLY_DONE_AT,
} from "@/lib/reading-entitlement"
import { useAccount } from "@/lib/use-account"
import { ACTIVE_CHARACTER } from "@/lib/character"

type Turn = ChatTurn

/** 좋아요 · 싫어요 · 아직 안 누름 */
type Rating = "up" | "down" | null

/** 서버가 쓰는 숫자(1 / -1)와 화면이 쓰는 말 사이를 옮깁니다 */
function toRating(value: number | null | undefined): Rating {
  return value === 1 ? "up" : value === -1 ? "down" : null
}

/**
 * 답변 아래 붙는 액션 줄 — 복사 · 좋아요 · 싫어요 · 새로고침.
 *
 * 좋아요/싫어요는 서버에 남습니다. 답변 문체를 고칠 때 쓸 유일한
 * 단서라, 화면에서만 켜지고 사라지면 안 됩니다.
 *
 * 새로고침은 마지막 답에만 붙습니다 — 중간 답을 다시 만들면 그 뒤에
 * 이어진 대화와 앞뒤가 안 맞기 때문입니다.
 */
function AnswerActions({
  text,
  initialRating = null,
  onRate,
  onRegenerate,
}: {
  text: string
  initialRating?: Rating
  /** 1 좋아요 · -1 싫어요 · 0 취소 */
  onRate?: (rating: number) => void
  onRegenerate?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState<Rating>(initialRating)

  // 기록에서 다시 열면 평가가 늦게 도착합니다 (서버에서 받아오므로).
  // 그때 켜둔 상태를 반영해 줍니다.
  useEffect(() => setRating(initialRating), [initialRating])

  // 같은 값을 다시 누르면 끕니다 (0 = 취소)
  function rate(next: Exclude<Rating, null>) {
    const value = rating === next ? null : next
    setRating(value)
    onRate?.(value === "up" ? 1 : value === "down" ? -1 : 0)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 클립보드가 막힌 환경 — 조용히 무시
    }
  }

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  const btnOn = "inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground"

  return (
    <div className="mt-2 flex items-center gap-1">
      <button type="button" onClick={copy} aria-label="복사" className={btn}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => rate("up")}
        aria-label="좋아요"
        aria-pressed={rating === "up"}
        className={rating === "up" ? btnOn : btn}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => rate("down")}
        aria-label="싫어요"
        aria-pressed={rating === "down"}
        className={rating === "down" ? btnOn : btn}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
      {onRegenerate && (
        <button type="button" onClick={onRegenerate} aria-label="새로고침" className={btn}>
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/**
 * 샨티 표식 — 화면에 딱 하나뿐입니다.
 *
 * 헤더에 있던 픽셀 고양이가 여기로 내려왔습니다. 말 한 마디마다 붙이지
 * 않습니다 — 대화가 길어지면 고양이가 줄줄이 늘어서서 표식이 아니라
 * 무늬가 됩니다. 가장 최근에 만들어진 말의 아래, 즉 대화의 맨 끝에만
 * 놓아 "지금 여기까지 왔다"를 가리키게 합니다.
 *
 * 눈은 늘 깜빡이고, 글이 만들어지는 중에는 통통 뜁니다.
 */
function ShantiMark({ busy = false, elapsed }: { busy?: boolean; elapsed?: string }) {
  return (
    <div className="mt-6 flex items-center gap-2 text-foreground">
      <BlinkingShanti className="h-5" title="샨티" busy={busy} />
      {elapsed && <span className="text-xs text-muted-foreground">{elapsed}</span>}
    </div>
  )
}

/** 기다린 시간을 "1m 20s" 처럼 보여줍니다 (클로드와 같은 표기) */
function useElapsed(running: boolean) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) {
      setSeconds(0)
      return
    }
    const startedAt = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [running])

  if (!running) return undefined
  const m = Math.floor(seconds / 60)
  return m > 0 ? `${m}m ${seconds % 60}s` : `${seconds}s`
}

/** 아직 글이 오는 중임을 보여주는 깜빡이는 커서 */
function Cursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-foreground/60"
    />
  )
}

/** 아직 아무것도 안 왔을 때 자리를 잡아두는 회색 막대 */
function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-muted ${className}`} />
}

export type PickedCard = { name: string; reversed: boolean; imageUrl: string }

/** 카드 한 장 — 미니 배열 안에 놓이는 작은 그림 */
function MiniCard({ card, className = "", style }: { card: PickedCard; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      title={`${card.name}${card.reversed ? " (역방향)" : ""}`}
      style={style}
      className={`block overflow-hidden rounded-[3px] bg-card outline outline-[0.5px] outline-black/20 ${className}`}
    >
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt={card.name}
          className={`h-full w-full object-cover ${card.reversed ? "rotate-180" : ""}`}
        />
      )}
    </span>
  )
}

/**
 * 뽑은 카드 미니 배열 — 해석 제목 위에 놓입니다.
 *
 * layoutKey 를 주면 뽑을 때 본 배열 모양 그대로 놓입니다 (십자면 십자).
 * 좌표는 CardSpread 한 곳에서 오므로 lib/spread-layouts.ts 를 고치면
 * 카드 고르기 화면·스타일가이드와 함께 바뀝니다.
 *
 * layoutKey 가 없거나 자리 수가 안 맞으면 뽑힌 순서대로 1열입니다 —
 * 면담 중 더 뽑은 카드처럼 배열이랄 게 없을 때가 그렇습니다.
 */
function MiniSpread({ cards, layoutKey }: { cards: PickedCard[]; layoutKey?: string }) {
  if (cards.length === 0) return null

  const slots = layoutKey ? spreadLayouts[layoutKey as LayoutKey] : undefined

  if (!slots || slots.length !== cards.length) {
    return (
      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted/60 p-2">
        {cards.map((c, i) => (
          <MiniCard key={`${c.name}-${i}`} card={c} className="h-[46px] w-[26px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-[240px] max-w-full rounded-xl bg-muted/60 p-3">
      <CardSpread
        layout={layoutKey as LayoutKey}
        cards={cards}
        aspectClassName="aspect-[16/13]"
        cardWidthClassName={cards.length >= 7 ? "w-[13%]" : "w-[16%]"}
      />
    </div>
  )
}

export function ReadingResultView({
  question,
  // ⚠️ null 이 들어올 수 있습니다. 해석을 못 받고 끝난 판(기록에 result 가
  //    비어 있는 판)을 열면 예전에는 result.title 에서 터져 브라우저가
  //    "This page couldn't load" 를 띄웠습니다. 빈 객체로 받아 넘깁니다 —
  //    화면은 이미 "아직 안 온 조각"을 그릴 줄 압니다(streaming 용).
  result: incomingResult,
  cards = [],
  positions,
  layoutKey,
  readingId,
  resultRating,
  streaming = false,
  error = null,
  backHref = "/tarot/ask",
  initialTurns = [],
  onTurn,
  onTurnsReplace,
  onDrawRequest,
  onRegenerate,
}: {
  question: string
  /** 아직 만들어지는 중이면 조각이 비어 있을 수 있습니다 */
  result: Partial<ReadingResult> | null
  cards?: PickedCard[]
  /** 뽑은 카드들의 자리 이름 (샨티가 고른 배열). 면담에 함께 넘깁니다 */
  positions?: string[]
  /** 그 배열의 이름 (예: "six-cross"). 주면 뽑을 때 본 모양 그대로 놓입니다 */
  layoutKey?: string
  /** 어느 판인지. 서버가 주인과 이어묻기 횟수를 확인합니다 */
  readingId?: string
  /** 해석에 이미 매긴 평가 (1 좋아요 · -1 싫어요). 다시 열었을 때 켜둡니다 */
  resultRating?: number | null
  /** 해석이 아직 흘러들어오는 중인지. 커서를 깜빡여 살아있음을 보여줍니다 */
  streaming?: boolean
  /** 해석을 못 받았을 때의 사유 */
  error?: ChatErrorInfo | null
  /** 뒤로가기가 갈 곳. 기록에서 다시 열었을 때는 /my 로 돌아갑니다 */
  backHref?: string
  /** 예전에 나눈 대화 — 기록에서 다시 열면 그때 대화가 그대로 이어집니다 */
  initialTurns?: Turn[]
  /** 새 대화 한 마디가 오갈 때마다 불립니다 (보관용) */
  onTurn?: (turn: Turn) => void
  /** 새로고침으로 마지막 답을 물렀을 때 — 보관본도 그만큼 되돌립니다 */
  onTurnsReplace?: (turns: Turn[]) => void
  /**
   * 샨티가 "네가 직접 뽑아라"라고 할 때 불립니다. 카드 고르기 화면으로
   * 넘겼다가 뽑은 카드를 done 으로 돌려주면 면담이 이어집니다.
   * 넘기지 않으면 직접 뽑기를 청하지 않고 답만 나옵니다 (기록 화면 등).
   */
  onDrawRequest?: (draw: ChatDrawRequest, done: (picked: PickedCard[]) => void) => void
  /** 해석을 다시 받고 싶을 때 (새로고침). 없으면 그 버튼이 안 나옵니다 */
  onRegenerate?: () => void
}) {
  const result = incomingResult ?? {}

  const [draft, setDraft] = useState("")
  const {
    turns,
    streamingText,
    busy,
    error: chatError,
    pendingDraw,
    suggestions,
    drawDeclined,
    send,
    retryLast,
    submitDrawnCards,
  } = useReadingChat({
    question,
    cards,
    positions,
    reading: result,
    priorTurns: initialTurns,
    readingId,
    onTurn,
    onTurnsReplace,
  })

  // 기다리는 동안 흐른 시간 (해석 · 면담 따로)
  const readingElapsed = useElapsed(streaming)
  const chatElapsed = useElapsed(streamingText !== null)
  // 지금 글이 만들어지는 중인가 — 이때만 샨티가 뜁니다
  const busyNow = streaming || streamingText !== null
  // 키보드가 가린 높이 — 입력창을 그만큼 올려 키보드에 붙입니다
  const keyboardInset = useKeyboardInset()

  // 샨티 답이 몇 번째인지 미리 세어둡니다.
  // 평가를 남길 때 이 번호로 "어느 답인지"를 가리킵니다 — 대화는 뒤에
  // 붙기만 하므로 번호가 흔들리지 않습니다.
  const shantiIndexOf: number[] = []
  let shantiSeen = -1
  for (const [i, turn] of turns.entries()) {
    shantiIndexOf[i] = turn.role === "shanti" ? ++shantiSeen : -1
  }

  // ── 한 장 몫을 얼마나 썼는지 ──────────────────────────────────────
  //
  // 크레딧 한 장에 이어묻기 FOLLOWUPS_PER_CREDIT 번이 딸려옵니다. 다 쓰면
  // 대화를 끊지 않고 "한 장 더 쓰고 이어가기"를 권합니다.
  //
  // ⚠️ 이 셈은 브라우저에만 있습니다. 크레딧과 마찬가지로, 로그인이
  //    붙으면 서버가 다시 세야 합니다 (지금은 새로고침하면 초기화됩니다).
  const [extraCredits, setExtraCredits] = useState(0)
  const { account, ready: accountReady, refresh: refreshAccount } = useAccount()
  const credits = accountReady ? account.credits : null

  const asked = turns.filter((t) => t.role === "user").length
  const allowance = FOLLOWUPS_PER_CREDIT * (1 + extraCredits)
  const leftToAsk = allowance - asked
  const outOfAsks = leftToAsk <= 0

  /**
   * 좋아요/싫어요를 서버에 남깁니다.
   * shantiTurnIndex 를 빼면 해석 자체에 대한 평가입니다.
   */
  function sendRating(rating: number, shantiTurnIndex?: number) {
    if (!readingId) return
    // 실패해도 화면은 그대로 둡니다 — 평가 하나 때문에 흐름을 끊을 이유가
    // 없고, 다시 누르면 또 보냅니다.
    void fetch("/api/reading/rate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ readingId, rating, shantiTurnIndex }),
    }).catch(() => {})
  }

  /** 한 장 더 써서 계속 묻기 */
  async function spendAnotherCredit() {
    if ((credits ?? 0) <= 0) return
    // 깎는 것도 늘리는 것도 서버가 합니다. 화면에서 늘리면 새로고침
    // 한 번으로 얼마든지 늘릴 수 있습니다.
    try {
      const response = await fetch("/api/reading/extend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ readingId }),
      })
      if (!response.ok) return
    } catch {
      return
    }
    setExtraCredits((n) => n + 1)
    void refreshAccount()
  }

  // ── 샨티가 직접 뽑으라고 하면 화면 밖(페이지)에 카드 고르기를 부탁합니다 ──
  //
  // ⚠️ 이 effect 가 보는 것은 pendingDraw 하나뿐입니다. 손잡이(onDrawRequest ·
  //    submitDrawnCards)를 의존성에 넣으면 안 됩니다.
  //
  //    두 손잡이는 렌더마다 새로 만들어집니다 — 부르는 쪽이 넘기는 onTurn 이
  //    그 자리에서 만든 함수라, pushTurn → ask → submitDrawnCards 가 줄줄이
  //    새 함수가 됩니다. 그것들을 의존성에 두면 렌더마다 effect 가 다시
  //    돌고, onDrawRequest 는 페이지의 상태를 새 객체로 바꾸고, 그 때문에
  //    또 렌더되어 끝없이 돕니다. 실제로 카드 고르기 화면이 뜬 채로 먹통이
  //    됐습니다.
  //
  //    그래서 손잡이는 ref 로 들고 최신 것만 씁니다. 이러면 "뽑아달라는
  //    요청이 새로 생겼을 때"만 정확히 한 번 불립니다.
  const drawRequestRef = useRef(onDrawRequest)
  const submitDrawnRef = useRef(submitDrawnCards)
  // ⚠️ 아래 effect 보다 먼저 놓여야 합니다 (effect 는 적힌 순서대로 돕니다).
  useEffect(() => {
    drawRequestRef.current = onDrawRequest
    submitDrawnRef.current = submitDrawnCards
  })

  useEffect(() => {
    if (!pendingDraw) return
    drawRequestRef.current?.(pendingDraw, (picked) => {
      void submitDrawnRef.current(picked)
    })
  }, [pendingDraw])

  function handleSend() {
    const text = draft.trim()
    if (!text || busy) return
    setDraft("")
    void send(text)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-site flex-1 flex-col px-6 pb-32 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref={backHref} title={question} />

        {/* 내가 던진 질문 */}
        <div className="mt-1 flex justify-end">
          <p className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-reading text-foreground">
            {question}
          </p>
        </div>

        {/* 해석 본문 */}
        <article className="mt-6">
          <MiniSpread cards={cards} layoutKey={layoutKey} />

          {/* 해석이 막혔을 때 — 대화 쪽과 같은 상자를 씁니다.
              여기서 다시 하기는 "해석을 다시 받기"(onRegenerate)입니다.
              같은 판이라 크레딧은 더 나가지 않습니다. */}
          {error && (
            <ChatErrorBox
              info={error}
              onRetry={onRegenerate}
              busy={streaming}
              className="mt-4"
            />
          )}

          {result.title ? (
            <h1 className="mt-4 text-reading-xl font-bold leading-snug tracking-tight text-foreground">
              {result.title}
              {streaming && !result.summary && <Cursor />}
            </h1>
          ) : (
            streaming && <Skeleton className="mt-4 h-6 w-3/4" />
          )}

          {result.summary && (
            <p className="mt-4 text-reading leading-relaxed text-foreground/90">
              {result.summary}
              {streaming && !result.keywords?.length && <Cursor />}
            </p>
          )}

          {!!result.keywords?.length && (
            <>
              <h2 className="mt-6 text-reading-lg font-semibold text-foreground">핵심 키워드</h2>
              <ul className="mt-2 space-y-1">
                {result.keywords.map((k, i) => (
                  <li key={`${k}-${i}`} className="flex gap-2 text-reading text-foreground/90">
                    <span aria-hidden="true" className="text-muted-foreground">
                      ·
                    </span>
                    {k}
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.sections?.map((s, i) => (
            <section key={`${s.heading}-${i}`} className="mt-6">
              <h2 className="text-reading-lg font-semibold text-foreground">{s.heading}</h2>
              <p className="mt-1.5 whitespace-pre-line text-reading leading-relaxed text-foreground/90">
                {s.body}
                {streaming && i === (result.sections?.length ?? 0) - 1 && <Cursor />}
              </p>
            </section>
          ))}

          {/* 다 받은 뒤에만 — 반쪽짜리 글을 복사하지 않도록 */}
          {!streaming && result.title && (
            <AnswerActions
              text={`${result.title}\n\n${result.summary ?? ""}\n\n${(result.sections ?? [])
                .map((s) => `${s.heading}\n${s.body}`)
                .join("\n\n")}`}
              // 이어지는 대화가 시작되면 해석만 다시 만들 수 없습니다
              // (뒤 이야기가 앞의 해석을 딛고 있으니까요)
              initialRating={toRating(resultRating)}
              onRate={(rating) => sendRating(rating)}
              onRegenerate={turns.length === 0 ? onRegenerate : undefined}
            />
          )}
        </article>

        {/* 이어지는 대화 */}
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="mt-6 flex flex-col items-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl bg-muted px-4 py-2.5 text-reading text-foreground">
                {turn.text}
              </p>
              {/* 직접 뽑은 카드는 말 아래에 깔아 보여줍니다 — 이름만 적힌
                  줄로 남으면 "내가 뭘 뽑았더라"가 대화에서 사라집니다. */}
              {!!turn.cards?.length && (
                <div className="mt-3 w-full max-w-[85%]">
                  <MiniSpread cards={turn.cards} />
                </div>
              )}
            </div>
          ) : (
            <div key={i} className="mt-5">
              <p className="whitespace-pre-line text-reading leading-relaxed text-foreground/90">
                {turn.text}
              </p>
              {/* 이 마디에서 카드를 더 뽑았으면 말 아래에 깔아 보여줍니다 */}
              {!!turn.cards?.length && (
                <div className="mt-3">
                  <MiniSpread cards={turn.cards} />
                </div>
              )}
              <AnswerActions
                text={turn.text}
                initialRating={toRating(turn.rating)}
                onRate={(rating) => sendRating(rating, shantiIndexOf[i])}
                // 새로고침은 마지막 답에만. 중간 답을 다시 만들면 그 뒤에
                // 이어진 대화와 앞뒤가 안 맞습니다.
                onRegenerate={i === turns.length - 1 && !busy ? retryLast : undefined}
              />
            </div>
          )
        )}

        {/* 지금 흘러들어오는 중인 답 */}
        {streamingText !== null && (
          <div className="mt-5">
            {streamingText ? (
              <p className="whitespace-pre-line text-reading leading-relaxed text-foreground/90">
                {streamingText}
                <Cursor />
              </p>
            ) : (
              <p className="text-reading text-muted-foreground">샨티가 카드를 다시 들여다보는 중...</p>
            )}
          </div>
        )}

        {/* 대화가 막혔을 때 — 해석 쪽과 같은 상자입니다.
            여기서 다시 하기는 "마지막 물음을 다시 던지기"(retryLast)입니다. */}
        {chatError && (
          <ChatErrorBox
            info={chatError}
            onRetry={() => void retryLast()}
            busy={busy}
            className="mt-5"
          />
        )}

        {/* 샨티는 여기 하나뿐입니다 — 대화의 맨 끝, 입력창 바로 위.
            클로드가 마지막 답 아래·입력창 위에 표식을 하나만 두는 자리와
            같습니다. 대화가 길어져도 늘어나지 않고 끝을 따라 내려옵니다. */}
        <ShantiMark busy={busyNow} elapsed={busyNow ? chatElapsed ?? readingElapsed : undefined} />
      </main>

      {/* 입력창 — 해석을 다 받은 뒤에만 (읽는 중엔 물어볼 수 없습니다) */}
      {!streaming && (
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 transition-transform duration-150"
        // 키보드가 올라오면 그만큼 위로 올려 키보드에 딱 붙입니다.
        // (아이폰 사파리는 키보드가 화면을 덮을 뿐 크기를 줄이지 않아서,
        //  bottom-0 에 두면 키보드 뒤로 숨습니다)
        style={{ transform: `translateY(-${keyboardInset}px)` }}
      >
        {/* 시안: 화면 위에 떠 있는 둥근 흰 카드. 본문이 그 아래로 흘러 지나갑니다.
            테두리 줄 없이 그림자로만 띄웁니다. */}
        {/* 키보드가 올라와 있을 때는 아래 여백을 10px 로 줄여 키보드에
            바짝 붙입니다. 키보드가 없을 때는 홈 인디케이터를 피해야 하므로
            원래대로 넉넉히 둡니다. */}
        <div
          className={`mx-auto w-full max-w-site px-4 pt-10 sm:px-8 ${
            keyboardInset > 0 ? "pb-2.5" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {outOfAsks ? (
            // 한 장 몫을 다 썼습니다. 막지 않고 한 장 더 쓰길 권합니다.
            <div className="pointer-events-auto rounded-2xl bg-card p-4 shadow-raised">
              <p className="text-reading leading-relaxed text-foreground">
                흐음, 이 한 판으로는 여기까지구먼. 더 묻고 싶으면 한 장 더 쓰면 된다냥.
              </p>
              {credits !== null && credits > 0 ? (
                <button
                  type="button"
                  onClick={() => void spendAnotherCredit()}
                  className="mt-3 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {CREDIT_UNIT.one} 한 {CREDIT_UNIT.counter} 더 쓰고 이어서 묻기 (남은 {countCredits(credits)})
                </button>
              ) : (
                <Link
                  href="/my/credits"
                  className="mt-3 block rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {CREDIT_UNIT.one} 사러 가기
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* ── 끝이 가까울 때 ──────────────────────────────────────
                  두 단계로 알립니다.
                  · 5번 남으면 — 작은 글씨로 세어만 줍니다 (평소엔 미터기처럼
                    보이면 안 되니까요)
                  · 2번 남으면 — 한 장 더 쓸 수 있는 버튼을 미리 내줍니다.
                    ⚠️ 예전에는 이 버튼이 "다 쓴 뒤"에만 나왔습니다. 그러면
                       한창 이야기하다 벽에 부딪히고, 그 자리에서 흐름이
                       끊깁니다. 끝나기 전에 내주면 벽을 만나지 않습니다. */}
              {leftToAsk <= FOLLOWUP_NEARLY_DONE_AT && credits !== null && credits > 0 ? (
                <div className="pointer-events-auto mb-2 rounded-2xl bg-card p-3 shadow-raised">
                  <p className="text-center text-sm leading-relaxed text-foreground">
                    이 판으로는 {leftToAsk}번 더 물어볼 수 있다냥. 더 이어가고 싶으면 한{" "}
                    {CREDIT_UNIT.counter} 더 쓰면 된다네.
                  </p>
                  <button
                    type="button"
                    onClick={() => void spendAnotherCredit()}
                    className="mt-2 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    미리 한 {CREDIT_UNIT.counter} 더 쓰기 (남은 {countCredits(credits)})
                  </button>
                </div>
              ) : (
                leftToAsk <= FOLLOWUP_WARN_AT && (
                  <p className="pointer-events-auto mb-2 text-center text-xs text-muted-foreground">
                    이 판으로 {leftToAsk}번 더 물어볼 수 있어냥
                  </p>
                )
              )}

              {/* ── 이어서 물을 만한 것 ─────────────────────────────────
                  샨티의 답과 "같은 요청"에서 함께 온 것입니다 — 따로 부르지
                  않으니 요청 수가 늘지 않습니다 (하루 한도가 곧 요청 수입니다).
                  타로를 처음 보는 사람은 해석을 받고도 무엇을 더 물어야 할지
                  몰라 그대로 나갑니다. 그때 대화가 끊기지 않게 하는 자리입니다. */}
              {suggestions.length > 0 && !busy && (
                <div className="pointer-events-auto mb-2 flex flex-wrap justify-center gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full bg-card px-3.5 py-2 text-xs text-foreground shadow-raised transition-colors hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── 뽑기를 무르고 나왔을 때 ────────────────────────────
                  카드 고르기 화면에서 빈손으로 돌아온 직후에만 뜹니다.

                  ⚠️ 여기 "직접 뽑기" 버튼을 상시로 두지 않습니다. 예전에는
                     두었는데, 그러면 뽑기가 대화에서 나오지 않고 손이 먼저
                     나가는 기능이 됩니다. 무엇을 더 봐야 하는지는 이야기를
                     들은 샨티가 정합니다 (lib/use-reading-chat.ts 주석 참고).

                  확인창 대신 이 칩 하나로 되묻습니다. 잘못 눌렀으면 누르면
                  되고, 지금은 안 뽑고 싶으면 그냥 말을 이어가면 됩니다. */}
              {drawDeclined && !busy && (
                <div className="pointer-events-auto mb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void send("그건 네가 대신 뽑아줘")}
                    className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs text-foreground shadow-raised transition-colors hover:bg-muted"
                  >
                    <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                    샨티가 대신 뽑아줘
                  </button>
                </div>
              )}
              <ChatInput
                value={draft}
                onChange={setDraft}
                onSubmit={handleSend}
                disabled={busy}
                placeholder={busy ? "샨티가 생각하는 중..." : `${ACTIVE_CHARACTER.name}에게 응답하기`}
                ariaLabel="샨티에게 응답하기"
                className="pointer-events-auto"
              />
            </>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
