// app/tarot/reading/page.tsx
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { readingTopics } from "@/lib/reading-topics"
import { ScatteredCardsBackground } from "@/components/scattered-cards-bg"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { resetReadingDeck } from "@/lib/reading-session"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"

export default function TarotReadingPage() {
  useEffect(() => {
    resetReadingDeck()
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col">
      <PageBackground variant="aurora" />
      <ScatteredCardsBackground />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-10 sm:px-8">
        <PageHeader backHref="/tarot" className="mb-8" />

        <nav className="flex flex-col">
          {readingTopics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/tarot/reading/${topic.slug}`}
              className="group flex items-center justify-between border-t border-border py-5 last:border-b"
            >
              <span className="flex items-baseline gap-4">
                <span className="w-6 text-xs text-muted-foreground">{topic.number}</span>
                <span className="font-serif text-4xl tracking-tight sm:text-5xl">{topic.enLabel}</span>
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        <div className="mt-10 pb-[env(safe-area-inset-bottom)]">
          <ReadingCharacterBubble message="샨티! 너의 타로점을 봐줄 Shanti라고 해. 먼저 크게 숨을 마시고 뱉었다가, 끌리는 궁금한 주제를 골라보라냥." />
        </div>
      </main>
    </div>
  )
}