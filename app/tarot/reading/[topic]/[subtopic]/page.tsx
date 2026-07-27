// app/tarot/reading/[topic]/[subtopic]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { readingTopics } from "@/lib/reading-topics"
import { getTopicConfig } from "@/lib/reading-prompt-templates"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
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
    // 카드 고르기 화면은 딱 한 화면입니다 (모바일 주소창 때문에 dvh)
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <PageBackground variant="aurora" />
      <main
        className={`relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
      >
        <PageHeader variant="reading" backHref={`/tarot/reading/${matchedTopic.slug}`} />

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