// components/reading-result-view.tsx
// 사이트 내 해석 결과 + 이어서 대화하기 화면 (시안의 "결과보기" · "대화하기").
//
// ⚠️ 답변은 아직 AI 에 연결되어 있지 않습니다 — lib/mock-reading.ts 의
//    임시 함수를 씁니다. 연동 시 handleSend 안의 buildMockReply 만 바꾸면 됩니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 사용자 말풍선 : bg-secondary(연라임) · 오른쪽 정렬
// │ · 샨티 답변     : 말풍선 없이 본문 그대로 (시안과 동일)
// │ · 답변 액션     : 복사 · 읽어주기 · 좋아요 · 공유
// │ · 입력창        : 화면 하단 고정
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import { Copy, Volume2, ThumbsUp, Share2, Check, RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { buildMockReply, type ReadingResult } from "@/lib/mock-reading"

type Turn = { role: "user" | "shanti"; text: string }

/** 답변 아래 붙는 액션 줄 (복사·읽어주기·좋아요·공유) */
function AnswerActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 클립보드가 막힌 환경 — 조용히 무시
    }
  }

  function speak() {
    // 브라우저 내장 음성 합성. 지원하지 않으면 아무 일도 하지 않습니다.
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = "ko-KR"
    synth.speak(u)
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // 사용자가 취소 — 무시
      }
    } else {
      void copy()
    }
  }

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

  return (
    <div className="mt-2 flex items-center gap-1">
      <button type="button" onClick={copy} aria-label="복사" className={btn}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <button type="button" onClick={speak} aria-label="읽어주기" className={btn}>
        <Volume2 className="h-4 w-4" />
      </button>
      <button type="button" aria-label="좋아요" className={btn}>
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={share} aria-label="공유" className={btn}>
        <Share2 className="h-4 w-4" />
      </button>
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

/** 뽑은 카드 미니 배열 — 시안에서 해석 제목 위에 놓이는 작은 스프레드 */
function MiniSpread({ cards }: { cards: PickedCard[] }) {
  if (cards.length === 0) return null
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted/60 p-2">
      {cards.map((c, i) => (
        <span
          key={`${c.name}-${i}`}
          title={`${c.name}${c.reversed ? " (역방향)" : ""}`}
          className="relative block h-[46px] w-[26px] overflow-hidden rounded-[3px] bg-card outline outline-[0.5px] outline-black/20"
        >
          {c.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.imageUrl}
              alt={c.name}
              className={`h-full w-full object-cover ${c.reversed ? "rotate-180" : ""}`}
            />
          )}
        </span>
      ))}
    </div>
  )
}

export function ReadingResultView({
  question,
  result,
  cards = [],
  streaming = false,
  error = null,
  backHref = "/tarot/ask",
  initialTurns = [],
  onTurn,
  onRestart,
}: {
  question: string
  /** 아직 만들어지는 중이면 조각이 비어 있을 수 있습니다 */
  result: Partial<ReadingResult>
  cards?: PickedCard[]
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
  /** 새 질문하기. 넘기지 않으면 버튼이 나오지 않습니다 (기록에서 열었을 때) */
  onRestart?: () => void
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns)
  const [draft, setDraft] = useState("")

  function addTurn(turn: Turn) {
    setTurns((t) => [...t, turn])
    onTurn?.(turn)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft("")
    addTurn({ role: "user", text })
    // ⚠️ 임시 답변 — 연동 시 이 줄을 실제 API 호출로 교체하세요
    setTimeout(() => {
      addTurn({ role: "shanti", text: buildMockReply(text) })
    }, 400)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-32 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref={backHref} showShare />

        {/* 내가 던진 질문 */}
        <div className="mt-1 flex justify-end">
          <p className="max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-[15px] text-secondary-foreground">
            {question}
          </p>
        </div>

        {/* 해석 본문 */}
        <article className="mt-6">
          <MiniSpread cards={cards} />

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
            />
          )}
        </article>

        {/* 이어지는 대화 */}
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="mt-6 flex justify-end">
              <p className="max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-[15px] text-secondary-foreground">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="mt-5">
              <p className="text-[15px] leading-relaxed text-foreground/90">{turn.text}</p>
              <AnswerActions text={turn.text} />
            </div>
          )
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
      <form
        onSubmit={handleSend}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-glass backdrop-blur-[var(--glass-blur)]"
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-3 sm:px-8">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Shānti에게 응답하기"
            aria-label="샨티에게 응답하기"
            className="h-12 w-full rounded-full border border-input bg-card px-5 font-script text-lg text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
          />
        </div>
      </form>
      )}
    </div>
  )
}
