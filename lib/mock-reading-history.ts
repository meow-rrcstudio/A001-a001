// lib/mock-reading-history.ts
// MY 의 월별 기록 목록입니다.
//
// 내가 실제로 본 타로점(lib/reading-archive.ts 에 보관된 것)과
// 화면 느낌을 보기 위한 임시 샘플을 함께 보여줍니다.
// 목록의 한 건을 누르면 /my/[id] 로 그때 대화가 그대로 열립니다.
//
// ⚠️ 연동할 때 할 일:
//   1) getHistory() 안에서 SAMPLE 을 빼고 서버 조회 결과만 쓰기
//   2) 이 파일의 SAMPLE 배열과 sampleReading() 삭제
// 화면은 아래 타입만 보고 그리므로, 타입만 맞추면 화면 코드는 그대로 둡니다.
"use client"

import { listAll, type SavedReading } from "@/lib/reading-archive"

/** 리딩 한 건 */
export interface ReadingRecord {
  id: string
  /** 언제 봤는지 */
  date: Date
  /** 주제 이름 (홈 카테고리와 같은 표기) */
  topicLabel: string
  /** 한 줄 요약 — 해석의 첫 문장이나 핵심 메시지 */
  summary: string
  /** 뽑은 카드 이미지 주소. 없으면 회색 자리로 그립니다 */
  cardImages: string[]
}

/** 같은 날짜끼리 묶은 덩어리 */
export interface HistoryDay {
  /** 그 달의 며칠인지 */
  day: number
  records: ReadingRecord[]
}

// 검토용이라 "이번 달"에 기록이 보이도록 현재 월을 기준으로 만듭니다.
// (실제 연동 시에는 서버에서 조회한 날짜를 그대로 씁니다)
const NOW = new Date()
const d = (day: number) => new Date(NOW.getFullYear(), NOW.getMonth(), day)

const SAMPLE: ReadingRecord[] = [
  {
    id: "r1",
    date: d(21),
    topicLabel: "일상",
    summary: "당신이 당신다워진다는 건 정말 멋진 일",
    cardImages: Array(5).fill(""),
  },
  {
    id: "r2",
    date: d(21),
    topicLabel: "친구",
    summary: "먼저 손을 내미는 쪽이 관계를 쥔다",
    cardImages: Array(3).fill(""),
  },
  {
    id: "r3",
    date: d(19),
    topicLabel: "생산적인 일.",
    summary: "속도를 줄이면 오히려 멀리 간다",
    cardImages: Array(9).fill(""),
  },
  {
    id: "r4",
    date: d(8),
    topicLabel: "사랑",
    summary: "억지로 찾을수록 늦어지고, 자연스러울수록 빨라진다",
    cardImages: Array(5).fill(""),
  },
  {
    id: "r5",
    date: d(8),
    topicLabel: "나",
    summary: "지금은 쉬는 시기가 아니라 준비가 완성되는 과정",
    cardImages: Array(5).fill(""),
  },
]

/** 보관된 타로점 한 건을 목록에 띄울 모양으로 바꿉니다 */
function toRecord(r: SavedReading): ReadingRecord {
  return {
    id: r.id,
    date: new Date(r.at),
    // 목록 제목은 내가 던진 질문 그대로 — 무엇을 물었는지가 제일 잘 기억나서입니다
    topicLabel: r.question,
    summary: r.result.summary,
    cardImages: r.cards.map((c) => c.imageUrl),
  }
}

/**
 * 샘플 기록을 열었을 때 보여줄 내용.
 * ⚠️ 임시 — 실제로 본 타로점은 reading-archive 에 그대로 남아 있습니다.
 */
export function sampleReading(id: string) {
  const found = SAMPLE.find((r) => r.id === id)
  if (!found) return null
  return {
    id: found.id,
    question: found.topicLabel,
    topicLabel: found.topicLabel,
    at: found.date.toISOString(),
    cards: found.cardImages.map((imageUrl) => ({ name: "", reversed: false, imageUrl })),
    result: {
      title: found.summary,
      summary: found.summary,
      keywords: [],
      sections: [],
    },
    turns: [],
  }
}

/** 해당 연·월의 기록을 날짜별로 묶어 최신순으로 돌려줍니다. */
export function getHistory(year: number, month: number): HistoryDay[] {
  const saved = listAll().map(toRecord)
  const inMonth = [...saved, ...SAMPLE].filter(
    (r) => r.date.getFullYear() === year && r.date.getMonth() === month
  )

  const byDay = new Map<number, ReadingRecord[]>()
  for (const record of inMonth) {
    const day = record.date.getDate()
    byDay.set(day, [...(byDay.get(day) ?? []), record])
  }

  return [...byDay.entries()]
    .map(([day, records]) => ({ day, records }))
    .sort((a, b) => b.day - a.day)
}
