// app/tarot/reading/[topic]/page.tsx
// 주제(Self/Love/Career/Money)를 고른 직후, 샨티가 먼저 반응하고
// 세부 질문(32개 중 이 주제에 해당하는 것들)을 고르는 중간 화면입니다.
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { readingTopics } from "@/lib/reading-topics"
import { getTopicConfig } from "@/lib/reading-prompt-templates"
import { ScatteredCardsBackground } from "@/components/scattered-cards-bg"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"

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
    <div className="relative flex min-h-screen flex-col">
      <PageBackground variant="aurora" />
      <ScatteredCardsBackground />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-10 pb-48 sm:px-8">
  <PageHeader backHref="/tarot/reading" className="mb-8" />
  <nav className="flex flex-col">
    {config.questions.map((q) => (
      <Link
        key={q.slug}
        href={`/tarot/reading/${matchedTopic.slug}/${q.slug}`}
        className="group flex items-center justify-between border-t border-border py-5 first:border-t-0 last:border-b"
      >
        <span className="text-pretty text-base leading-snug sm:text-lg">{q.label}</span>
      </Link>
    ))}
  </nav>
</main>

<ReadingCharacterBubble message={config.reactionLine} />
    </div>
  )
}