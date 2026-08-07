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
import { ASK_CHIP, CHIP_GAP, TOPIC_CHIP } from "@/lib/chip-styles"
import { preparedFor, resolvePrepared, type ResolvedQuestion } from "@/lib/content/resolve"
import { matchCount } from "@/lib/content/pick"
import { useTraitProfile } from "@/lib/content/profile"
import type { PreparedQuestion } from "@/lib/content/questions"

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
  onPick: (label: string, question?: ResolvedQuestion, topicSlug?: ReadingTopicSlug) => void
  disabled?: boolean
}) {
  const chosen = topic ? readingTopics.find((t) => t.slug === topic) : null
  const profile = useTraitProfile()

  // 주제를 고르기 전에는 주제마다 대표 질문 하나씩을 내놓습니다.
  //
  // ┌─ 어느 하나를 내놓는가 ───────────────────────────────────────────
  // │ · 여섯 주제가 고르게 한 번씩 나와서, 무엇을 물을 수 있는 곳인지가
  // │   목록만 봐도 읽힙니다
  // │ · 성향에 가장 맞는 것으로 고릅니다 (PICK_MODE.question = "best").
  // │   준비된 질문은 별조각이 없는 사람이 받을 수 있는 전부라, 그
  // │   사람에게는 이 한 판이 첫인상이자 마지막일 수 있습니다
  // │ · 준비된 질문이라 배열(몇 장·어떤 자리)이 딸려 있습니다. 직접 친
  // │   질문은 맛보기에서 기본 여섯 장으로 가지만, 이건 그 질문에 맞는
  // │   배열로 뽑습니다
  // │
  // │ ⚠️ "그냥 요즘 ~ 궁금해"(general)는 후보에서 뺍니다. 말투는 진입
  // │    화면에 맞지만 여섯 줄이 전부 "그냥 요즘"으로 시작할 수 있어서,
  // │    읽으면 한 덩어리로 뭉개지고 무엇이 다른지가 안 보입니다.
  // │
  // │ ⚠️ 여기서는 랜덤을 쓰지 않습니다. 동점이면 **앞엣것**입니다.
  // │
  // │    두 까닭입니다. 하나는 이 화면이 서버에서 한 번 그려져 오는데,
  // │    서버가 고른 줄과 브라우저가 고른 줄이 다르면 글자가 한 번 튑니다.
  // │    또 하나는 목록의 앞쪽이 그 주제에서 가장 많이 묻는 것이라,
  // │    아무 신호가 없을 때 앞엣것을 내미는 것이 그대로 맞습니다.
  // └──────────────────────────────────────────────────────────────────
  const openers = readingTopics
    .map((t) => {
      const candidates = preparedFor(t.slug).filter((q) => q.slug !== "general")
      if (candidates.length === 0) return null
      const top = Math.max(...candidates.map((q) => matchCount(q, profile)))
      const question = candidates.find((q) => matchCount(q, profile) === top)!
      return { topic: t.slug, question }
    })
    .filter((x): x is { topic: ReadingTopicSlug; question: PreparedQuestion } => x !== null)

  const shown = topic ? preparedFor(topic).map((q) => ({ topic, question: q })) : openers

  // 칩 모양은 lib/chip-styles.ts 한 곳에서 옵니다 — 스타일가이드
  // (app/design-1859)도 같은 값을 가져다 씁니다. 여기에 다시 적지 마세요.
  const topicChip = TOPIC_CHIP
  const askChip = ASK_CHIP

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">제안</p>

      {/* ── 주제 ──────────────────────────────────────────────────── */}
      {chosen ? (
        <div className={`mb-2.5 flex flex-wrap items-center ${CHIP_GAP}`}>
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
        <div className={`mb-2.5 flex flex-wrap ${CHIP_GAP}`}>
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
      <div key={topic ?? "all"} className={`flex animate-in flex-col items-start ${CHIP_GAP} fade-in duration-200`}>
        {shown.map(({ topic: slug, question }) => (
          <button
            key={`${slug}-${question.slug}`}
            type="button"
            // ⚠️ 배열은 **여기서 한 번만** 고릅니다. 고른 결과(spreadId)를
            //    들고 다니고, 서버는 그 id 로 다시 고르지 않고 찾습니다.
            //    양쪽이 따로 굴리면 사람은 「마음의 거울」을 보는데 샨티는
            //    「감정의 파도」를 읽습니다.
            onClick={() => {
              const resolved = resolvePrepared(question, null, profile)
              if (resolved) onPick(question.label, resolved, slug)
            }}
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
