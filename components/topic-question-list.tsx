// components/topic-question-list.tsx
// 세부 질문 고르기 화면 (무료 흐름).
//
// 유료 회원이거나 체험이 남았으면 이 화면 대신 자유 질문 입력으로 보냅니다.
// 판단은 lib/reading-entitlement.ts 한 곳에서만 합니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 말풍선   : 상단바 바로 아래 (시안의 리딩 화면 구성)
// │ · 질문 행  : 구분선은 항목 사이에만, py-4
// │ · 하단 버튼: 로그인하면 직접 질문할 수 있다는 안내 겸 전환 동선
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHeader, HEADER_SPACE } from "@/components/page-header"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { Button } from "@/components/ui/button"
import { resetReadingDeck } from "@/lib/reading-session"
import { canUseInsiteReading, getEntitlement } from "@/lib/reading-entitlement"

export function TopicQuestionList({
  topicSlug,
  topicLabel,
  reactionLine,
  questions,
}: {
  topicSlug: string
  topicLabel: string
  reactionLine: string
  questions: { slug: string; label: string }[]
}) {
  const router = useRouter()
  // 권한 확인 전에는 그리지 않습니다 (무료 화면이 잠깐 스쳤다 바뀌는 걸 방지)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    resetReadingDeck()
    if (canUseInsiteReading(getEntitlement())) {
      const as = new URLSearchParams(window.location.search).get("as")
      router.replace(as ? `/tarot/ask?as=${as}` : "/tarot/ask")
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) return <div className="min-h-screen bg-background" />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref="/" />

        <ReadingCharacterBubble placement="top" message={reactionLine} />

        <p className="mt-6 text-sm text-muted-foreground">{topicLabel}에 대한 질문</p>

        <nav className="mt-2 flex flex-col">
          {questions.map((q, i) => (
            <Link
              key={q.slug}
              href={`/tarot/reading/${topicSlug}/${q.slug}`}
              className={`text-pretty py-4 text-base leading-snug transition-colors hover:text-accent ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              {q.label}
            </Link>
          ))}
        </nav>

        {/* 유료 전환 동선 — 직접 질문하고 사이트 안에서 바로 해석받는 길 */}
        <Button
          variant="solid"
          size="pill"
          className="mt-8 w-full"
          render={<Link href="/login" />}
        >
          로그인하고 직접 질문하기
        </Button>
      </main>
    </div>
  )
}
