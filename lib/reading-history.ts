// lib/reading-history.ts
// MY 의 월별 기록 목록을 만듭니다.
//
// 예전 lib/mock-reading-history.ts 를 대신합니다. 그 파일에는 화면 느낌을
// 보려고 넣어둔 가짜 기록이 섞여 있어서, 갓 가입한 사람에게도 남의 것 같은
// 타로점 목록이 보였습니다. 가짜는 전부 걷어냈습니다.
//
// 기록의 출처는 두 곳입니다.
//   · 로그인했으면 → 서버 (/api/readings)
//   · 연결 전이면  → 브라우저 보관함 (lib/reading-archive.ts)
"use client"

import { listAll } from "@/lib/reading-archive"

/** 리딩 한 건 */
export interface ReadingRecord {
  id: string
  date: Date
  /** 목록에 크게 보이는 제목 — 그때 던진 질문 */
  topicLabel: string
  /** 한 줄 요약 — 해석의 첫 문단 */
  summary: string
  /** 뽑은 카드 이미지 주소. 없으면 회색 자리로 그립니다 */
  cardImages: string[]
}

/** 같은 날짜끼리 묶은 덩어리 */
export interface HistoryDay {
  day: number
  records: ReadingRecord[]
}

/** 브라우저 보관함에서 (연결 전 · 비로그인) */
function fromBrowser(): ReadingRecord[] {
  return listAll().map((r) => ({
    id: r.id,
    date: new Date(r.at),
    topicLabel: r.question || r.topicLabel,
    summary: r.result?.summary ?? "",
    cardImages: r.cards.map((c) => c.imageUrl),
  }))
}

/**
 * 그 달의 기록을 날짜별로 묶어 돌려줍니다.
 *
 * 서버가 null 을 주면 "아직 연결 전"이라는 뜻이라 브라우저 보관함을 봅니다.
 */
export async function getHistory(year: number, month: number): Promise<HistoryDay[]> {
  let records: ReadingRecord[]

  try {
    const response = await fetch("/api/readings", { cache: "no-store" })
    const data = (await response.json()) as {
      readings: { id: string; at: string; question: string; summary: string; cardImages: string[] }[] | null
    }
    records = data.readings
      ? data.readings.map((r) => ({
          id: r.id,
          date: new Date(r.at),
          topicLabel: r.question,
          summary: r.summary,
          cardImages: r.cardImages,
        }))
      : fromBrowser()
  } catch {
    records = fromBrowser()
  }

  const inMonth = records.filter(
    (r) => r.date.getFullYear() === year && r.date.getMonth() === month
  )

  const byDay = new Map<number, ReadingRecord[]>()
  for (const record of inMonth) {
    const day = record.date.getDate()
    byDay.set(day, [...(byDay.get(day) ?? []), record])
  }

  return [...byDay.entries()]
    .map(([day, list]) => ({
      day,
      records: list.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }))
    .sort((a, b) => b.day - a.day)
}
