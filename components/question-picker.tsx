// components/question-picker.tsx
// 타로보기 진입 화면의 "제안" 영역 — 주제 칩과 질문 칩.
//
// ┌─ 어떻게 움직이는가 ───────────────────────────────────────────────
// │ 처음      검정 칩 6개(주제) + 흰 칩 몇 개(전체에서 고른 추천 질문)
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
  /** 주제를 안 골랐을 때 보여줄 추천 질문 (문구만 있는 자유 질문입니다) */
  suggestions,
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
  suggestions: readonly string[]
  disabled?: boolean
}) {
  const chosen = topic ? readingTopics.find((t) => t.slug === topic) : null
  const questions = topic ? topicContent[topic].questions : null

  const topicChip =
    "rounded-full bg-brand-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
  const askChip =
    "rounded-full bg-card px-4 py-2.5 text-left text-sm text-foreground shadow-raised transition-colors hover:bg-muted disabled:opacity-50"

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">제안</p>

      {/* ── 주제 ──────────────────────────────────────────────────── */}
      {chosen ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
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
        <div className="mb-2 flex flex-wrap gap-2">
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
      <div key={topic ?? "all"} className="flex animate-in flex-col items-start gap-2 fade-in duration-200">
        {questions
          ? questions.map((q) => (
              <button
                key={q.slug}
                type="button"
                onClick={() => onPick(q.label, q, topic ?? undefined)}
                disabled={disabled}
                className={askChip}
              >
                {q.label}
              </button>
            ))
          : suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                disabled={disabled}
                className={askChip}
              >
                {q}
              </button>
            ))}
      </div>
    </div>
  )
}
