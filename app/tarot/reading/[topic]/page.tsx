// app/tarot/reading/[topic]/page.tsx
// 홈에서 카테고리를 고른 뒤 나오는 화면입니다.
//
// 권한에 따라 갈립니다 (판단은 lib/reading-entitlement.ts 한 곳):
//   · 유료 회원 · 체험 잔여  → 자유 질문 입력(/tarot/ask)으로 보냅니다
//   · 그 외(비회원 포함)     → 이 화면 — 세부 질문을 골라 프롬프트를 받아갑니다
//
// ※ 예전에 있던 "대주제 고르기" 화면은 홈으로 흡수되어 삭제됐습니다.
import { notFound } from "next/navigation"
import { readingTopics } from "@/lib/reading-topics"
import { getTopicConfig } from "@/lib/reading-prompt-templates"
import { TopicQuestionList } from "@/components/topic-question-list"

export default async function TopicSubQuestionPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic } = await params
  const matchedTopic = readingTopics.find((t) => t.slug === topic)
  if (!matchedTopic) notFound()

  const config = getTopicConfig(matchedTopic.slug)

  return (
    <TopicQuestionList
      topicSlug={matchedTopic.slug}
      topicLabel={matchedTopic.label}
      reactionLine={config.reactionLine}
      questions={config.questions.map((q) => ({ slug: q.slug, label: q.label }))}
    />
  )
}
