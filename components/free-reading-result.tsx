// components/free-reading-result.tsx
// 맛보기 해석 화면 — 별조각 없이 본 사람이 카드를 다 뽑으면 여기로 옵니다.
//
// ┌─ 유료 해석 화면(ReadingResultView)과 무엇이 다른가 ───────────────
// │ 같은 것  뽑은 카드 · 제목 · 요약 · 섹션. 읽는 모양은 같습니다.
// │ 다른 것  이어서 물을 수 없습니다. 입력창은 보이되 잠겨 있고,
// │          누르면 위의 안내 카드로 데려갑니다.
// │
// │ 입력창을 아예 없애지 않는 이유: "여기서 대화가 이어진다"를 본 사람만
// │ 그걸 갖고 싶어집니다. 없으면 그런 기능이 있는 줄도 모르고 나갑니다.
// │
// │ 잠긴 입력창을 눌렀을 때 로그인 화면으로 바로 옮기지 않습니다. 방금
// │ 받은 해석을 두고 나가는 셈이라 아깝습니다. 안내 카드의 버튼을 직접
// │ 눌렀을 때만 옮깁니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 해석 글은 브라우저 기록에도 남깁니다. 안 남기면 새로고침 한 번에
//    사라지고, 기록에서 열어도 "프롬프트로 본 타로점"으로만 뜹니다.
//    로그인하러 갔다 돌아온 사람이 방금 읽던 글을 못 찾으면, 우리가
//    권해놓고 우리가 뺏는 꼴입니다.
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Copy } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ChatErrorBox } from "@/components/chat-error-box"
import { MiniSpread, type PickedCard } from "@/components/reading-result-view"
import { useReadingStream } from "@/lib/use-reading-stream"
import { buildReadingPrompt, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { saveFreeReading } from "@/lib/save-free-reading"
import { CREDIT_UNIT } from "@/lib/credit-packs"
import type { ReadingQuestion } from "@/lib/reading-content"

/** 아직 글자가 오는 중임을 알리는 깜빡이 */
function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-foreground/60" />
  )
}

export function FreeReadingResult({
  topicSlug,
  question,
  cards,
  isLoggedIn,
  onBack,
}: {
  topicSlug: ReadingTopicKey
  question: ReadingQuestion
  cards: PickedCard[]
  isLoggedIn: boolean
  onBack: () => void
}) {
  const { reading, streaming, error, run } = useReadingStream()
  const [copied, setCopied] = useState(false)
  // 잠긴 입력창을 눌렀을 때 안내 카드를 잠깐 도드라지게 합니다
  const [nudged, setNudged] = useState(false)
  const nudgeRef = useRef<HTMLDivElement>(null)

  // 카드를 다 뽑는 것은 판마다 한 번뿐이라 그 신호만 봅니다.
  // ⚠️ 개발 모드에서 effect 가 두 번 도는데, 그대로 두면 맛보기 몫을
  //    한 판에 두 번 꺼내 씁니다 (사이트 전체 총량에서 나갑니다).
  const startedRef = useRef(false)
  const savedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void run({
      topicKey: topicSlug,
      questionSlug: question.slug,
      questionLabel: question.label,
      cards,
      free: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const promptText = buildReadingPrompt({
    topicKey: topicSlug,
    question,
    cards: cards.map((c) => ({ name: c.name, orientation: c.reversed ? "역방향" : "정방향" })),
  })

  // 다 받으면 기록에 남깁니다 (해석 글까지 함께).
  useEffect(() => {
    if (savedRef.current || streaming) return
    if (!reading?.title || !reading.sections?.length) return
    savedRef.current = true
    // ⚠️ savePromptReading(브라우저) 이 아니라 saveFreeReading 입니다.
    //    로그인한 사람의 기록 화면은 서버만 봅니다 — 브라우저에만 담으면
    //    맛보기로 본 판이 기록에서 통째로 사라집니다.
    void saveFreeReading({
      question: question.label,
      topicLabel: question.label,
      cards,
      layoutKey: question.layoutKey,
      positions: question.positions.map((p) => p.label),
      promptText,
      result: reading,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, reading])

  async function copy() {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 클립보드가 막힌 환경 — 아래 글을 직접 골라 복사할 수 있습니다
    }
  }

  function bumpNudge() {
    setNudged(true)
    nudgeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    setTimeout(() => setNudged(false), 1400)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto w-full max-w-site flex-1 px-6 pb-32 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" onBack={onBack} title={question.label} />

        {/* 내가 던진 질문 — 유료 화면과 같은 자리, 같은 모양입니다 */}
        <div className="mt-1 flex justify-end">
          <p className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-reading text-foreground">
            {question.label}
          </p>
        </div>

        <article className="mt-6">
          <MiniSpread cards={cards} layoutKey={question.layoutKey} />

          {/* ⚠️ 다시 하기를 내주지 않습니다. 한 번 더 부르면 사이트 전체
              맛보기 총량에서 한 판을 또 꺼내 씁니다. */}
          {error && <ChatErrorBox info={error} className="mt-4" />}

          {!reading && streaming && (
            <p className="mt-4 text-reading text-muted-foreground">
              이 몸이 카드를 들여다보는 중이다냥...
            </p>
          )}

          {reading?.title && (
            <h1 className="mt-4 text-reading-xl font-bold leading-snug tracking-tight text-foreground">
              {reading.title}
              {streaming && !reading.summary && <Cursor />}
            </h1>
          )}

          {reading?.summary && (
            <p className="mt-4 text-reading leading-relaxed text-foreground/90">
              {reading.summary}
              {streaming && !reading.sections?.length && <Cursor />}
            </p>
          )}

          {reading?.sections?.map((s, i) => (
            <section key={`${s.heading}-${i}`} className="mt-6">
              <h2 className="text-reading-lg font-semibold text-foreground">{s.heading}</h2>
              <p className="mt-1.5 whitespace-pre-line text-reading leading-relaxed text-foreground/90">
                {s.body}
                {streaming && i === (reading.sections?.length ?? 0) - 1 && <Cursor />}
              </p>
            </section>
          ))}
        </article>

        {/* ── 다음 걸음 ─────────────────────────────────────────────
            해석을 다 읽은 자리입니다. 여기서 권하는 말은 근거가 있습니다 —
            방금 읽은 것과 무엇이 다른지를 말하면 되니까요. */}
        {!streaming && reading?.title && (
          <div
            ref={nudgeRef}
            className={`mt-8 rounded-2xl bg-card p-4 shadow-raised transition-shadow duration-300 ${
              nudged ? "ring-2 ring-primary" : ""
            }`}
          >
            {isLoggedIn ? (
              <>
                <p className="text-reading leading-relaxed text-foreground">
                  여기까지가 맛보기라네. {CREDIT_UNIT.one}을 쓰면 이 몸이 더 오래 들여다보고,
                  궁금한 걸 이어서 물을 수도 있다냥.
                </p>
                <Link
                  href="/my/credits"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {CREDIT_UNIT.one} 받으러 가기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-reading leading-relaxed text-foreground">
                  로그인하면 이 몸과 직접 대화를 이어갈 수 있다냥. 뽑은 카드도 기록으로 남아서,
                  다른 기기에서도 다시 볼 수 있다네.
                </p>
                <Link
                  href="/login?next=/my"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  로그인하기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        )}

        {/* 밖의 AI 로 가져가려던 사람의 길 — 없애지 않았습니다.
            맛보기가 생겼다고 막을 이유가 없어서, 아래에 조용히 둡니다. */}
        {!streaming && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4">
              다른 AI에게 물어볼 프롬프트
            </summary>
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => void copy()}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "복사했어냥!" : "복사"}
              </button>
            </div>
            {/* 클립보드가 막힌 환경에서는 길게 눌러 직접 고를 수 있어야 합니다 */}
            <div className="max-h-72 select-all overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {promptText}
            </div>
          </details>
        )}
      </main>

      {/* ── 잠긴 입력창 ──────────────────────────────────────────────
          유료 화면의 입력창과 같은 자리에 같은 모양으로 둡니다. 눌러도
          키보드가 올라오지 않고, 위의 안내 카드로 데려갑니다.

          ⚠️ 해석을 못 받았으면 내지 않습니다. 이어갈 이야기가 없는데
             "대화를 이어가세요"를 내밀면 말이 안 되고, 눌러도 데려갈
             안내 카드가 없어서 아무 일도 안 일어납니다 — 고장으로 보입니다. */}
      {reading?.title && (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto mx-auto w-full max-w-site px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 sm:px-8">
          <button
            type="button"
            onClick={bumpNudge}
            className="flex w-full items-center justify-between rounded-full bg-card px-5 py-3.5 text-left shadow-raised transition-opacity hover:opacity-90"
          >
            <span className="text-sm text-muted-foreground">
              {isLoggedIn
                ? `${CREDIT_UNIT.one}으로 이어서 물어보기`
                : "로그인 후에 직접 대화를 이어가세요"}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
