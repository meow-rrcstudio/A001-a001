// app/tarot/reading/[topic]/[subtopic]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { readingTopics } from "@/lib/reading-topics"
import { getTopicConfig } from "@/lib/reading-prompt-templates"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"

export default async function TarotReadingResultPage({
  params,
}: {
  params: Promise<{ topic: string; subtopic: string }>
}) {
  const { topic, subtopic } = await params
  const matchedTopic = readingTopics.find((t) => t.slug === topic)
  if (!matchedTopic) notFound()

  const config = getTopicConfig(matchedTopic.slug)
  const question = config.questions.find((q) => q.slug === subtopic)
  if (!question) notFound()

  const isGeneral = question.slug === "general"
  const introMessage = isGeneral
    ? `${matchedTopic.label}에 대해 마음을 담아 섞어보라냥.`
    : config.confirmLine(question.label)

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <PageBackground variant="aurora" />

      {/* 헤더(뒤로 · 더보기)는 시안의 Top Bar처럼 카드 위에 "떠" 있습니다.
          흐름에서 자리를 차지하지 않아야 아래 무대(부채·컨트롤러·스프레드)가
          화면 안에 다 들어옵니다. 항상 최상단 레이어. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] mx-auto w-full max-w-3xl px-6 pt-4 sm:px-8">
        <div className="pointer-events-auto">
          <PageHeader backHref={`/tarot/reading/${matchedTopic.slug}`} />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8">
        <CardReadingFlow
          topicLabel={matchedTopic.label}
          topicSlug={matchedTopic.slug}
          question={question}
          introMessage={introMessage}
        />
      </main>
    </div>
  )
}