// components/free-reading-preview.tsx
// 로그인 전에 보는 맛보기 해석 — 카드를 다 뒤집은 자리에 바로 이어집니다.
//
// ┌─ 왜 있는가 ───────────────────────────────────────────────────────
// │ 예전에는 무료로 온 사람이 카드만 뽑고, 프롬프트를 복사해 밖으로
// │ 나갔습니다. 우리 사이트에서 얻은 것은 카드 여섯 장뿐이고, 해석은
// │ 남의 AI 가 해줬습니다. 그러면 "샨티가 어떻게 읽는지"를 한 번도 못
// │ 보고 갑니다 — 가입할 이유를 만들 자리가 없습니다.
// │
// │ 여기서 한 판을 실제로 읽어줍니다. 짧고 얕지만 샨티의 목소리입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 회원 해석과 눈에 띄게 달라야 합니다. 같은 것을 공짜로 주면 가입할
//    이유가 없어집니다. 서버가 낮은 등급 모델에 생각을 꺼서 부르고
//    (lib/ai/gemini.ts 의 GEMINI_FREE_MODEL), 이어서 묻는 길은 없습니다.
//    그 차이가 곧 "가입하면 이렇게 달라진다"입니다.
//
// ⚠️ 프롬프트 복사를 없애지 않았습니다. 밖의 AI 로 가져가 보려던 사람의
//    길을 막을 이유가 없습니다 — 맛보기가 그 위에 얹힐 뿐입니다.
"use client"

import { useEffect, useRef } from "react"
import { ChatErrorBox } from "@/components/chat-error-box"
import { useReadingStream } from "@/lib/use-reading-stream"
import type { PickedCard } from "@/components/reading-result-view"
import type { ReadingQuestion } from "@/lib/reading-content"

/** 아직 글자가 오는 중임을 알리는 깜빡이 */
function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-foreground/60" />
  )
}

export function FreeReadingPreview({
  topicSlug,
  question,
  cards,
}: {
  topicSlug: string
  question: ReadingQuestion
  cards: PickedCard[]
}) {
  const { reading, streaming, error, run } = useReadingStream()

  // 카드를 다 뒤집는 것은 판마다 한 번뿐이라 그 신호만 봅니다.
  // ⚠️ 개발 모드에서 effect 가 두 번 도는데, 그대로 두면 맛보기 몫을
  //    한 판에 두 번 꺼내 씁니다.
  const startedRef = useRef(false)

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

  // 문이 내려갔거나 막힌 경우 — 무엇 때문인지와 갈 곳을 함께 보여줍니다.
  // ⚠️ 다시 하기는 내주지 않습니다(onRetry 없음). 맛보기를 다시 부르면
  //    총량에서 한 판을 또 꺼내 씁니다.
  if (error) return <ChatErrorBox info={error} className="mt-4" />

  if (!reading && streaming) {
    return (
      <p className="mt-4 text-reading text-muted-foreground">
        이 몸이 카드를 들여다보는 중이다냥...
      </p>
    )
  }

  if (!reading) return null

  return (
    <article className="mt-4">
      {reading.title && (
        <h2 className="text-reading-xl font-bold leading-snug tracking-tight text-foreground">
          {reading.title}
          {streaming && !reading.summary && <Cursor />}
        </h2>
      )}

      {reading.summary && (
        <p className="mt-3 text-reading leading-relaxed text-foreground/90">
          {reading.summary}
          {streaming && !reading.sections?.length && <Cursor />}
        </p>
      )}

      {reading.sections?.map((s, i) => (
        <section key={`${s.heading}-${i}`} className="mt-5">
          <h3 className="text-reading-lg font-semibold text-foreground">{s.heading}</h3>
          <p className="mt-1.5 whitespace-pre-line text-reading leading-relaxed text-foreground/90">
            {s.body}
            {streaming && i === (reading.sections?.length ?? 0) - 1 && <Cursor />}
          </p>
        </section>
      ))}
    </article>
  )
}
