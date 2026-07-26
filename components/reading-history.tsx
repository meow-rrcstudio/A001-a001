// components/reading-history.tsx
// 마이 히스토리 — 월 단위로 내 리딩 기록을 돌아보는 화면입니다.
//
// ⚠️ 기록을 저장하는 곳이 아직 없어서 lib/mock-reading-history.ts 의
//    임시 데이터를 씁니다. 연동 시 getHistory() 만 실제 조회로 바꾸면 됩니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 월 이동 줄 : 위아래 검정 선 (border-y border-foreground)
// │ · 날짜 숫자  : 왼쪽 고정 폭 w-10, 첫 기록에만 표시
// │ · 주제 이름  : font-myeongjo text-xl font-bold (홈 카드와 같은 명조)
// │ · 카드 썸네일: h-14 w-9, 이미지가 없으면 회색 자리로 그립니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getHistory } from "@/lib/mock-reading-history"

export function ReadingHistory({ userName }: { userName: string }) {
  // 보고 있는 달 (1일로 고정해두고 달만 옮깁니다)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const days = getHistory(cursor.getFullYear(), cursor.getMonth())

  function moveMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <>
      <h1 className="px-6 pb-5 pt-2 font-myeongjo text-2xl font-bold text-foreground">
        안녕, {userName}
      </h1>

      {/* 월 이동 */}
      <div className="flex items-center justify-between border-y border-foreground px-6 py-3">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          aria-label="이전 달"
          className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold text-foreground">
          {cursor.getFullYear()}년, {cursor.getMonth() + 1}월
        </p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          aria-label="다음 달"
          className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {days.length === 0 ? (
        <p className="px-6 py-20 text-center text-sm text-muted-foreground">
          이 달에는 아직 리딩 기록이 없어요.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {days.map((group) => (
            <div key={group.day} className="flex gap-3 px-6 py-6">
              {/* 날짜는 그 날의 첫 기록 옆에만 */}
              <span className="w-8 shrink-0 pt-1 text-lg text-muted-foreground">{group.day}</span>

              <div className="min-w-0 flex-1 space-y-7">
                {group.records.map((record) => (
                  <article key={record.id}>
                    <h2 className="font-myeongjo text-xl font-bold text-foreground">
                      {record.topicLabel}
                    </h2>
                    <p className="mt-0.5 text-pretty text-sm text-muted-foreground">
                      {record.summary}
                    </p>

                    {/* 뽑은 카드 — 가로로 넘치면 스크롤됩니다 */}
                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                      {record.cardImages.map((src, i) => (
                        <span
                          key={i}
                          className="h-14 w-9 shrink-0 overflow-hidden rounded-[3px] bg-muted"
                        >
                          {src && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
