// components/reading-history.tsx
// 마이 히스토리 — 월 단위로 내 리딩 기록을 돌아보는 화면입니다.
//
// 기록은 서버에서 옵니다 (lib/reading-history.ts → /api/readings).
// 연결 전이거나 비로그인이면 브라우저 보관함을 봅니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 월 이동 줄 : 위아래 검정 선 (border-y border-foreground)
// │ · 날짜 숫자  : 왼쪽 고정 폭 w-10, 첫 기록에만 표시
// │ · 질문 제목  : font-myeongjo text-xl font-bold (홈 카드와 같은 명조)
// │ · 카드 썸네일: h-14 w-9, 이미지가 없으면 회색 자리로 그립니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getHistory, type HistoryDay } from "@/lib/reading-history"

export function ReadingHistory({ userName }: { userName?: string | null }) {
  // 보고 있는 달 (1일로 고정해두고 달만 옮깁니다)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // 기록이 브라우저에 있어서 화면이 뜬 뒤에 읽습니다
  // (서버에서 미리 그리면 빈 목록이라 화면이 한 번 튑니다)
  const [days, setDays] = useState<HistoryDay[]>([])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    setReady(false)
    void getHistory(cursor.getFullYear(), cursor.getMonth()).then((list) => {
      // 달을 빠르게 넘기면 늦게 온 응답이 화면을 덮을 수 있습니다
      if (!alive) return
      setDays(list)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [cursor])

  function moveMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <>
      <h1 className="px-6 pb-5 pt-2 font-myeongjo text-2xl font-bold text-foreground">
        {userName ? `안녕, ${userName}님` : "안녕"}
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

      {!ready ? (
        <div className="py-20" />
      ) : days.length === 0 ? (
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
                  // 한 건을 누르면 그때 나눈 대화가 그대로 열립니다
                  <Link
                    key={record.id}
                    href={`/my/${record.id}`}
                    className="block transition-opacity hover:opacity-70"
                  >
                    <h2 className="font-myeongjo text-xl font-bold text-foreground">
                      {record.topicLabel}
                    </h2>
                    {/* 요약은 두 줄까지 — 목록에서는 훑어보는 게 먼저입니다 */}
                    <p className="mt-0.5 line-clamp-2 text-pretty text-sm text-muted-foreground">
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
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
