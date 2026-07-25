// app/tarot/reading/page.tsx
// 리딩 주제 선택 화면 — 시안 기준입니다.
//
// ┌─ 시안 구성 ───────────────────────────────────────────────────────
// │ 1) 상단바 (뒤로 · 샨티 · 더보기)
// │ 2) 샨티 말풍선 — 상단바 바로 아래 흰 말풍선
// │ 3) 주제 목록   — 손글씨 큰 글씨 + 초록 화살표. 번호는 붙이지 않습니다
// │                  (구분선은 항목 사이에만, 첫 줄 위에는 없음)
// │ ※ 배경은 단색입니다. 카드를 흩뿌리는 연출은 시안에 없어 뺐습니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { readingTopics } from "@/lib/reading-topics"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { resetReadingDeck } from "@/lib/reading-session"
import { PageHeader } from "@/components/page-header"

export default function TarotReadingPage() {
  useEffect(() => {
    resetReadingDeck()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-8">
        <PageHeader backHref="/" />

        {/* 샨티 말풍선 — 시안에서는 상단바 바로 아래에 놓입니다 */}
        <ReadingCharacterBubble
          placement="top"
          message="샨티! 너의 타로점을 봐줄 Shanti라고 해. 크게 한번 숨을 쉬고 네 마음에 집중해봐, 그리고 끌리는 주제를 골라보라냥!"
        />

        {/* 주제 목록 — 시안처럼 화면 아래쪽에 모아둡니다 */}
        <nav className="mt-auto flex flex-col pb-24">
          {readingTopics.map((topic, i) => (
            <Link
              key={topic.slug}
              href={`/tarot/reading/${topic.slug}`}
              className={`group flex items-center justify-between py-3 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="font-script text-5xl leading-none text-foreground sm:text-6xl">
                {topic.enLabel}
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
