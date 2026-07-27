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

import { useEffect, useState } from "react"
import Link from "next/link"
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check, RotateCcw } from "lucide-react"
import { spreadLayouts, type LayoutKey } from "@/lib/spread-layouts"
import { CardSpread } from "@/components/card-spread"
import { PageHeader } from "@/components/page-header"
import { ChatInput } from "@/components/chat-input"
import { HEADER_SPACE } from "@/lib/layout"
import { type ReadingResult } from "@/lib/mock-reading"
import { useReadingChat, type ChatTurn } from "@/lib/use-reading-chat"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"
import {
  consumeCredit,
  getEntitlement,
  FOLLOWUPS_PER_CREDIT,
  FOLLOWUP_WARN_AT,
} from "@/lib/reading-entitlement"

type Turn = ChatTurn

/**
 * 답변 아래 붙는 액션 줄 — 복사 · 좋아요 · 싫어요 · 새로고침.
 *
 * ⚠️ 좋아요/싫어요는 아직 화면에만 남습니다. 보낼 곳(서버)이 생기면
 *    onRate 를 실제 호출로 이으면 됩니다.
 * 새로고침은 마지막 답에만 붙습니다 — 중간 답을 다시 만들면 그 뒤에
 * 이어진 대화와 앞뒤가 안 맞기 때문입니다.
 */
function AnswerActions({ text, onRegenerate }: { text: string; onRegenerate?: () => void }) {
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState<"up" | "down" | null>(null)

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
        onClick={() => setRating((r) => (r === "up" ? null : "up"))}
        aria-label="좋아요"
        aria-pressed={rating === "up"}
        className={rating === "up" ? btnOn : btn}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setRating((r) => (r === "down" ? null : "down"))}
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
  result,
  cards = [],
  positions,
  layoutKey,
  streaming = false,
  error = null,
  backHref = "/tarot/ask",
  initialTurns = [],
  onTurn,
  onTurnsReplace,
  onRestart,
  onDrawRequest,
  onRegenerate,
}: {
  question: string
  /** 아직 만들어지는 중이면 조각이 비어 있을 수 있습니다 */
  result: Partial<ReadingResult>
  cards?: PickedCard[]
  /** 뽑은 카드들의 자리 이름 (샨티가 고른 배열). 면담에 함께 넘깁니다 */
  positions?: string[]
  /** 그 배열의 이름 (예: "six-cross"). 주면 뽑을 때 본 모양 그대로 놓입니다 */
  layoutKey?: string
  /** 해석이 아직 흘러들어오는 중인지. 커서를 깜빡여 살아있음을 보여줍니다 */
  streaming?: boolean
  /** 해석을 못 받았을 때의 사유 */
  error?: string | null
  /** 뒤로가기가 갈 곳. 기록에서 다시 열었을 때는 /my 로 돌아갑니다 */
  backHref?: string
  /** 예전에 나눈 대화 — 기록에서 다시 열면 그때 대화가 그대로 이어집니다 */
  initialTurns?: Turn[]
  /** 새 대화 한 마디가 오갈 때마다 불립니다 (보관용) */
  onTurn?: (turn: Turn) => void
  /** 새로고침으로 마지막 답을 물렀을 때 — 보관본도 그만큼 되돌립니다 */
  onTurnsReplace?: (turns: Turn[]) => void
  /** 새 질문하기. 넘기지 않으면 버튼이 나오지 않습니다 (기록에서 열었을 때) */
  onRestart?: () => void
  /**
   * 샨티가 "네가 직접 뽑아라"라고 할 때 불립니다. 카드 고르기 화면으로
   * 넘겼다가 뽑은 카드를 done 으로 돌려주면 면담이 이어집니다.
   * 넘기지 않으면 직접 뽑기를 청하지 않고 답만 나옵니다 (기록 화면 등).
   */
  onDrawRequest?: (draw: ChatDrawRequest, done: (picked: PickedCard[]) => void) => void
  /** 해석을 다시 받고 싶을 때 (새로고침). 없으면 그 버튼이 안 나옵니다 */
  onRegenerate?: () => void
}) {
  const [draft, setDraft] = useState("")
  const {
    turns,
    streamingText,
    busy,
    error: chatError,
    pendingDraw,
    send,
    retryLast,
    submitDrawnCards,
  } = useReadingChat({
    question,
    cards,
    positions,
    reading: result,
    priorTurns: initialTurns,
    onTurn,
    onTurnsReplace,
  })

  // ── 한 장 몫을 얼마나 썼는지 ──────────────────────────────────────
  //
  // 크레딧 한 장에 이어묻기 FOLLOWUPS_PER_CREDIT 번이 딸려옵니다. 다 쓰면
  // 대화를 끊지 않고 "한 장 더 쓰고 이어가기"를 권합니다.
  //
  // ⚠️ 이 셈은 브라우저에만 있습니다. 크레딧과 마찬가지로, 로그인이
  //    붙으면 서버가 다시 세야 합니다 (지금은 새로고침하면 초기화됩니다).
  const [extraCredits, setExtraCredits] = useState(0)
  const [credits, setCredits] = useState<number | null>(null)
  useEffect(() => setCredits(getEntitlement().credits), [extraCredits])

  const asked = turns.filter((t) => t.role === "user").length
  const allowance = FOLLOWUPS_PER_CREDIT * (1 + extraCredits)
  const leftToAsk = allowance - asked
  const outOfAsks = leftToAsk <= 0

  /** 한 장 더 써서 계속 묻기 */
  function spendAnotherCredit() {
    if ((credits ?? 0) <= 0) return
    consumeCredit()
    setExtraCredits((n) => n + 1)
  }

  // 샨티가 직접 뽑으라고 하면 화면 밖(페이지)에 카드 고르기를 부탁합니다.
  useEffect(() => {
    if (!pendingDraw || !onDrawRequest) return
    onDrawRequest(pendingDraw, (picked) => {
      void submitDrawnCards(picked)
    })
  }, [pendingDraw, onDrawRequest, submitDrawnCards])

  function handleSend() {
    const text = draft.trim()
    if (!text || busy) return
    setDraft("")
    void send(text)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-32 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref={backHref} showShare />

        {/* 내가 던진 질문 */}
        <div className="mt-1 flex justify-end">
          <p className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] text-foreground">
            {question}
          </p>
        </div>

        {/* 해석 본문 */}
        <article className="mt-6">
          <MiniSpread cards={cards} layoutKey={layoutKey} />

          {error && (
            <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-4">
              <p className="text-[15px] text-foreground">
                흐음... 카드를 읽다가 막혔구먼. 잠시 뒤에 다시 청해보라냥.
              </p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{error}</p>
            </div>
          )}

          {result.title ? (
            <h1 className="mt-4 text-xl font-bold leading-snug tracking-tight text-foreground">
              {result.title}
              {streaming && !result.summary && <Cursor />}
            </h1>
          ) : (
            streaming && <Skeleton className="mt-4 h-6 w-3/4" />
          )}

          {result.summary && (
            <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
              {result.summary}
              {streaming && !result.keywords?.length && <Cursor />}
            </p>
          )}

          {!!result.keywords?.length && (
            <>
              <h2 className="mt-6 text-base font-semibold text-foreground">핵심 키워드</h2>
              <ul className="mt-2 space-y-1">
                {result.keywords.map((k, i) => (
                  <li key={`${k}-${i}`} className="flex gap-2 text-[15px] text-foreground/90">
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
              <h2 className="text-base font-semibold text-foreground">{s.heading}</h2>
              <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
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
              onRegenerate={turns.length === 0 ? onRegenerate : undefined}
            />
          )}
        </article>

        {/* 이어지는 대화 */}
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="mt-6 flex justify-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl bg-muted px-4 py-2.5 text-[15px] text-foreground">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="mt-5">
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
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
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
                {streamingText}
                <Cursor />
              </p>
            ) : (
              <p className="text-[15px] text-muted-foreground">샨티가 카드를 다시 들여다보는 중...</p>
            )}
          </div>
        )}

        {chatError && (
          <div className="mt-5 rounded-xl border border-border bg-muted px-4 py-4">
            <p className="text-[15px] text-foreground">흐음... 말이 막혔구먼. 다시 물어보라냥.</p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{chatError}</p>
          </div>
        )}

        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="mt-10 inline-flex items-center justify-center gap-2 self-start text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            새 질문하기
          </button>
        )}
      </main>

      {/* 입력창 — 해석을 다 받은 뒤에만 (읽는 중엔 물어볼 수 없습니다) */}
      {!streaming && (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
        {/* 시안: 화면 위에 떠 있는 둥근 흰 카드. 본문이 그 아래로 흘러 지나갑니다.
            테두리 줄 없이 그림자로만 띄웁니다. */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 sm:px-8">
          {outOfAsks ? (
            // 한 장 몫을 다 썼습니다. 막지 않고 한 장 더 쓰길 권합니다.
            <div className="pointer-events-auto rounded-2xl bg-card p-4 shadow-raised">
              <p className="text-[15px] leading-relaxed text-foreground">
                흐음, 이 한 판으로는 여기까지구먼. 더 묻고 싶으면 한 장 더 쓰면 된다냥.
              </p>
              {credits !== null && credits > 0 ? (
                <button
                  type="button"
                  onClick={spendAnotherCredit}
                  className="mt-3 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {CREDIT_UNIT.one} 한 {CREDIT_UNIT.counter} 더 쓰고 이어서 묻기 (남은 {countCredits(credits)})
                </button>
              ) : (
                <Link
                  href="/my/settings"
                  className="mt-3 block rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {CREDIT_UNIT.one} 사러 가기
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* 남은 횟수는 끝이 가까울 때만 — 평소엔 세는 느낌이 나면 안 됩니다 */}
              {leftToAsk <= FOLLOWUP_WARN_AT && (
                <p className="pointer-events-auto mb-2 text-center text-xs text-muted-foreground">
                  이 판으로 {leftToAsk}번 더 물어볼 수 있어냥
                </p>
              )}
              <ChatInput
                value={draft}
                onChange={setDraft}
                onSubmit={handleSend}
                disabled={busy}
                placeholder={busy ? "샨티가 생각하는 중..." : "Shānti-에게 응답하기"}
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
