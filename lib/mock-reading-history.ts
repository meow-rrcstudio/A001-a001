// lib/mock-reading-history.ts
// ⚠️ [임시 데이터] 리딩 기록을 저장하는 곳이 아직 없어서 목업으로 채웁니다.
//
// 연동할 때 할 일:
//   1) getHistory() 를 실제 조회(로그인 사용자 + 해당 월)로 교체
//   2) 이 파일의 SAMPLE 배열 삭제
// 화면은 아래 타입만 보고 그리므로, 타입만 맞추면 화면 코드는 그대로 둡니다.

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

/** 해당 연·월의 기록을 날짜별로 묶어 최신순으로 돌려줍니다. */
export function getHistory(year: number, month: number): HistoryDay[] {
  const inMonth = SAMPLE.filter(
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
