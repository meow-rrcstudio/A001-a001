// app/tarot/reading/page.tsx
// 주제 고르기 — 무엇에 대해 물을지 정하는 화면.
//
// 시안(첨부 "무료회원, 프롬프트 작성" 첫 장)의 구성입니다.
//   샨티 말풍선 → "주제 선택하기" → 주제 알약 6개 → 로그인 하고 직접 질문하기
//
// ┌─ 왜 이 화면이 필요한가 ───────────────────────────────────────────
// │ 예전에는 주제 목록이 홈에만 있었습니다. 그래서 "타로 보러 가기" 나
// │ "Shānti-에게 물어보기" 를 누르면 갈 곳이 홈밖에 없었는데, 물어보려고
// │ 눌렀다가 홈에 떨어지면 "뒤로 간" 것처럼 읽힙니다.
// │ 같은 목록에 제 주소를 줘서 타로를 보러 들어가는 길을 따로 만들었습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 주제 목록은 lib/reading-topics.ts 한 곳에서 옵니다 — 홈 카드도 같은
//    목록을 봅니다. 여기에 배열을 새로 적으면 언젠가 반드시 어긋납니다.
"use client"

import Link from "next/link"
import { useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { readingTopics } from "@/lib/reading-topics"
import { resetReadingDeck } from "@/lib/reading-session"
import { useAccount } from "@/lib/use-account"

export default function ReadingTopicsPage() {
  const { account, ready } = useAccount()

  // 새 판을 시작하는 자리라 덱을 새로 섞어둡니다.
  // (안 하면 앞 판에서 쓰던 순서가 그대로 이어집니다)
  useEffect(() => {
    resetReadingDeck()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-site flex-1 flex-col px-6 pb-12 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref="/" />

        <ReadingCharacterBubble
          placement="top"
          message="잘 왔다냥. 때로는 가볍게 던진 질문이 큰 울림을 줄 수 있다네. 궁금한 점이 있다면 이 몸에게 물어보게냥"
        />

        <p className="mt-9 text-center text-sm text-muted-foreground">주제 선택하기</p>

        {/* 주제 알약 — 시안대로 가운데 정렬 세로 목록입니다.
            누르면 그 주제의 세부 질문 화면으로 갑니다. */}
        <div className="mt-4 flex flex-col items-center gap-2.5">
          {readingTopics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/tarot/reading/${topic.slug}`}
              className="flex h-11 min-w-[92px] items-center justify-center rounded-full bg-card px-6 text-[15px] text-foreground shadow-raised transition-colors hover:bg-muted"
            >
              {topic.label}
            </Link>
          ))}
        </div>

        {/* 아래 버튼은 상황에 따라 말이 갈립니다.
            · 크레딧이 남은 회원 → 바로 자유 질문
            · 로그인 전         → 로그인하면 직접 물어볼 수 있다는 안내 (시안 문구)
            ⚠️ 확인이 끝나기 전에는 그리지 않습니다. 잘못된 말이 스쳤다
               바뀌면 "방금 뭐라고 했지?" 가 됩니다. */}
        {ready && (
          <div className="mt-10 flex justify-center">
            {account.isLoggedIn && account.credits > 0 ? (
              <Link
                href="/tarot/ask"
                className="flex h-12 items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                직접 질문하기
              </Link>
            ) : (
              <Link
                href={account.isLoggedIn ? "/my/credits" : "/login?next=/tarot/ask"}
                className="flex h-12 items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                {account.isLoggedIn ? "크레딧으로 직접 질문하기" : "로그인 하고 직접 질문하기"}
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
