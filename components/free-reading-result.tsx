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
import { ArrowRight, RotateCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ChatErrorBox } from "@/components/chat-error-box"
import { AiBadge } from "@/components/ai-badge"
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
  signals,
  onBack,
}: {
  topicSlug: ReadingTopicKey
  question: ReadingQuestion
  cards: PickedCard[]
  isLoggedIn: boolean
  /** 이 판을 어떻게 뽑았는지 (재서 남기기만 합니다) */
  signals?: unknown
  onBack: () => void
}) {
  const { reading, streaming, error, run } = useReadingStream()
  // 잠긴 입력창을 눌렀을 때 안내 카드를 잠깐 도드라지게 합니다
  const [nudged, setNudged] = useState(false)
  const nudgeRef = useRef<HTMLDivElement>(null)

  /**
   * 이 판이 기록에 남은 주소(id).
   *
   * 로그인 넛지가 이 값을 씁니다 — 로그인을 마치고 "방금 읽던 그 판"으로
   * 돌아가려면 어디로 갈지 알아야 합니다. 저장이 끝나기 전에는 null 이고,
   * 그동안 넛지는 기록 목록으로 보냅니다.
   */
  const [savedId, setSavedId] = useState<string | null>(null)

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
      signals,
    }).then((saved) => {
      // 남은 주소를 붙잡아 둡니다. 로그인 넛지가 이걸로 돌아올 길을 만듭니다.
      if (saved) setSavedId(saved.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, reading])

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

          {/* ── 못 받았을 때 ────────────────────────────────────────────
              ⚠️ 예전에는 다시 하기를 안 내줬습니다 — 한 번 더 부르면 사이트
                 전체 맛보기 총량에서 한 판을 또 꺼내 쓰기 때문입니다.
                 하지만 그 셈이 사람보다 앞설 수는 없습니다. 카드를 다 뽑고
                 아무것도 못 받은 사람에게 나갈 길조차 없으면, 아낀 한 판보다
                 잃는 것이 큽니다. 실패했을 때만 내줍니다 — 잘 받은 판에는
                 여전히 안 내주므로 총량이 두 배로 나가지는 않습니다. */}
          {error && (
            <>
              <ChatErrorBox info={error} className="mt-4" />
              {error.canRetry !== false && (
                <button
                  type="button"
                  onClick={() => void run({
                    topicKey: topicSlug,
                    questionSlug: question.slug,
                    questionLabel: question.label,
                    cards,
                    free: true,
                  })}
                  disabled={streaming}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  {streaming ? "다시 들여다보는 중..." : "다시 청해보기"}
                </button>
              )}
            </>
          )}

          {!reading && streaming && (
            <p className="mt-4 text-reading text-muted-foreground">
              이 몸이 카드를 들여다보는 중이다냥...
            </p>
          )}

          {reading?.title && <AiBadge className="mt-4" />}

          {reading?.title && (
            <h1 className="mt-2 text-reading-xl font-bold leading-snug tracking-tight text-foreground">
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
        {/* ⚠️ 해석을 못 받았을 때도 냅니다. 예전에는 성공했을 때만 냈는데,
               그러면 실패한 사람 화면에는 안내도 잠긴 입력창도 없어서 아무
               길이 없는 화면이 됩니다 (아리님 폰에서 실제로 그랬습니다). */}
        {!streaming && (reading?.title || error) && (
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
                  href="/my/credits/buy"
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
                {/* ⚠️ 돌아올 곳을 기록 목록(/my)으로 두지 않습니다.
                       방금 읽던 판을 두고 남의 목록 같은 화면으로 떨어지면
                       "이어서 대화하자"던 말이 끊깁니다 — 실제로 그랬습니다.
                       저장된 주소가 있으면 그 판으로 되돌립니다. 로그인하는
                       사이 브라우저 기록은 서버로 옮겨지므로(lib/claim-readings.ts)
                       돌아온 자리에는 방금 읽은 글이 그대로 있습니다. */}
                <Link
                  href={`/login?next=${encodeURIComponent(savedId ? `/my/${savedId}` : "/my")}`}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  로그인하기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        )}

        {/* ⚠️ "다른 AI에게 물어볼 프롬프트"를 내지 않습니다.
               맛보기 해석을 우리가 직접 내주기 시작한 뒤로, 이 자리는 방금
               읽은 사람을 밖으로 내보내는 문이 됐습니다. 프롬프트 글 자체는
               계속 만들어 기록에 함께 남깁니다(saveFreeReading) — 나중에
               쓸 데가 있고, 만드는 데 드는 것도 없습니다. */}
      </main>

      {/* ── 잠긴 입력창 ──────────────────────────────────────────────
          유료 화면의 입력창과 같은 자리에 같은 모양으로 둡니다. 눌러도
          키보드가 올라오지 않고, 위의 안내 카드로 데려갑니다.

          ⚠️ 해석을 못 받았을 때도 냅니다. 예전에는 성공한 판에만 냈는데,
             그러면 실패한 사람 화면에는 입력창이 통째로 사라져서 "여기서
             대화가 이어진다"는 것조차 안 보입니다. 눌렀을 때 데려갈 안내
             카드도 이제 실패한 판에 함께 나오므로, 헛도는 버튼이 아닙니다. */}
      {!streaming && (
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
