// components/question-picker.tsx
// 타로보기 진입 화면의 "제안" 영역 — 주제 칩과 질문 칩.
//
// ┌─ 어떻게 움직이는가 ───────────────────────────────────────────────
// │ 처음      검정 칩 6개(주제) + 주제마다 "그냥 ~ 궁금해" 한 줄씩
// │ 주제 고름 검정 칩이 고른 것 하나로 접히고(✕ 로 되돌림),
// │           흰 칩이 그 주제의 질문들로 갈립니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 고른 주제를 지우고 "주제 다시 고르기"만 남기지 않습니다. 질문이 길어
//    스크롤해서 내려갔다 온 사람이 지금 무슨 주제였는지 잊습니다. 고른 칩을
//    그대로 두고 옆에 ✕ 를 붙이면, 되돌리는 길과 지금 상태를 한 자리에서
//    보여줍니다.
//
// ⚠️ 여기서 화면을 옮기지 않습니다. 주제를 고르는 것은 아직 질문을 정한
//    것이 아니라서, 주소가 바뀌면 뒤로가기가 어중간해집니다. 질문을 실제로
//    고른 순간에만 다음 화면으로 갑니다 (부르는 쪽이 정합니다).
"use client"

import { X } from "lucide-react"
import { readingTopics, topicChipLabel, type ReadingTopicSlug } from "@/lib/reading-topics"
import { topicContent } from "@/lib/reading-content"
import type { ReadingQuestion } from "@/lib/reading-content"

export function QuestionPicker({
  topic,
  onTopicChange,
  onPick,
  disabled = false,
}: {
  topic: ReadingTopicSlug | null
  onTopicChange: (topic: ReadingTopicSlug | null) => void
  /**
   * 질문을 골랐습니다.
   *
   * 준비된 질문이면 question 이 함께 옵니다 — 배열(몇 장·어떤 자리)이
   * 이미 정해져 있어서, 무료 흐름은 샨티에게 배열을 묻지 않아도 됩니다.
   */
  onPick: (label: string, question?: ReadingQuestion, topicSlug?: ReadingTopicSlug) => void
  disabled?: boolean
}) {
  const chosen = topic ? readingTopics.find((t) => t.slug === topic) : null

  // 주제를 고르기 전에는 주제마다 대표 질문 하나씩을 내놓습니다.
  //
  // ┌─ 왜 각 주제의 첫 질문인가 ───────────────────────────────────────
  // │ · 여섯 주제가 고르게 한 번씩 나와서, 무엇을 물을 수 있는 곳인지가
  // │   목록만 봐도 읽힙니다
  // │ · 목록의 첫 줄은 그 주제에서 가장 많이 묻는 것입니다 (lib/reading-
  // │   content.ts 의 차례가 그렇게 짜여 있습니다)
  // │ · 준비된 질문이라 배열(몇 장·어떤 자리)이 딸려 있습니다. 직접 친
  // │   질문은 맛보기에서 기본 여섯 장으로 가지만, 이건 그 질문에 맞는
  // │   배열로 뽑습니다
  // │
  // │ ⚠️ 주제마다 있는 "그냥 요즘 ~ 궁금해"(general)로 채우지 않습니다.
  // │    말투는 진입 화면에 맞지만 여섯 줄이 전부 "그냥 요즘"으로 시작해서,
  // │    읽으면 한 덩어리로 뭉개지고 무엇이 다른지가 안 보입니다.
  // └──────────────────────────────────────────────────────────────────
  const openers = readingTopics
    .map((t) => {
      const q = topicContent[t.slug].questions[0]
      return q ? { topic: t.slug, question: q } : null
    })
    .filter((x): x is { topic: ReadingTopicSlug; question: ReadingQuestion } => x !== null)

  const shown = topic
    ? topicContent[topic].questions.map((q) => ({ topic, question: q }))
    : openers

  // ┌─ 시안 실측 (PDF 를 150dpi 로 펴서 픽셀을 직접 읽은 값) ──────────
  // │ 알약 높이  78px ÷ 2.083 = 37.4 CSS px   ← 검정칩도 같은 높이입니다
  // │ 세로 피치  100px → 48 CSS px, 따라서 칩 사이 10.6 CSS px (gap-2.5)
  // │ 테두리     2px → 1 CSS px, 흰 칩과 검정 칩 모두에 둘러져 있습니다
  // │ 글자       잉크 높이 12.5 CSS px → 15px 글자
  // │ 좌우 여백  오른쪽 끝에서 20 CSS px (px-5)
  // └──────────────────────────────────────────────────────────────────
  //
  // ⚠️ 높이를 py-3(≒46px)으로 두었더니 시안보다 한 줄에 9px씩 커져서,
  //    같은 화면에 아홉 개 들어갈 것이 여섯 개 반만 들어갔습니다. 그래서
  //    마지막 칩이 늘 반쯤 잘린 채로 보였습니다.
  //
  // ⚠️ leading 을 반드시 적습니다. text-[15px] 는 글자 크기만 정하고
  //    줄높이는 물려받아서, 물려받는 값이 바뀌면 알약 높이가 같이 흔들립니다.
  //    6 + 23 + 6 + 테두리 2 = 37px.
  const chipBase = "rounded-full border px-5 py-1.5 text-[15px] leading-[23px] disabled:opacity-50"

  // ⚠️ 눌리는 자리는 44px 로 넓힙니다.
  //    시안의 알약은 37px 이라 손가락 최소 크기(44px)에 못 미칩니다. 알약을
  //    키우면 시안이 틀어지므로, 보이는 크기는 그대로 두고 안 보이는 판만
  //    위아래로 3.5px씩 넓혔습니다. 칩 사이가 10.6px 이라 옆 칩의 판과
  //    겹치지도 않습니다.
  const touch =
    "relative after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']"

  const topicChip = `${chipBase} ${touch} border-chip-line bg-brand-ink font-medium text-white transition-opacity hover:opacity-90`
  const askChip = `${chipBase} ${touch} border-chip-line bg-chip text-left text-foreground transition-colors hover:bg-muted`

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">제안</p>

      {/* ── 주제 ──────────────────────────────────────────────────── */}
      {chosen ? (
        <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onTopicChange(null)}
            disabled={disabled}
            className={`${topicChip} inline-flex items-center gap-1.5`}
            aria-label={`주제 ${topicChipLabel(chosen)} — 눌러서 다시 고르기`}
          >
            {topicChipLabel(chosen)}
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mb-2.5 flex flex-wrap gap-2.5">
          {readingTopics.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => onTopicChange(t.slug)}
              disabled={disabled}
              className={topicChip}
            >
              {topicChipLabel(t)}
            </button>
          ))}
        </div>
      )}

      {/* ── 질문 ──────────────────────────────────────────────────────
          주제가 바뀌면 통째로 갈리므로 key 를 주제로 둡니다. 리액트가
          같은 자리를 고쳐 쓰지 않고 새로 그려서, 살짝 떠오르는 것으로
          "목록이 바뀌었다"가 읽힙니다. */}
      <div key={topic ?? "all"} className="flex animate-in flex-col items-start gap-2.5 fade-in duration-200">
        {shown.map(({ topic: slug, question }) => (
          <button
            key={`${slug}-${question.slug}`}
            type="button"
            onClick={() => onPick(question.label, question, slug)}
            disabled={disabled}
            className={askChip}
          >
            {question.label}
          </button>
        ))}
      </div>
    </div>
  )
}
