// lib/mock-reading.ts
// ⚠️ [임시 데이터] AI 연동 전, 화면 느낌을 보기 위한 가짜 해석·답변입니다.
//
// 연동할 때 할 일:
//   1) buildMockReading / buildMockReply 를 실제 API 호출로 교체
//   2) 이 파일은 통째로 삭제
// 화면(components·app)은 아래 타입만 보고 그리므로, 타입만 맞추면
// 화면 코드를 고칠 필요가 없습니다.

/** 사이트 내 해석 결과 한 건 */
export interface ReadingResult {
  /** 뽑은 카드 이름을 이어붙인 제목 (예: "컵의 에이스 · 절제 — 연애운") */
  title: string
  /** 첫 문단 — 전체 흐름 요약 */
  summary: string
  /** 핵심 키워드 목록 */
  keywords: string[]
  /** 소제목 + 본문으로 이어지는 상세 해석 */
  sections: { heading: string; body: string }[]
}

const MOCK_KEYWORDS = [
  "새로운 시작",
  "자연스러운 교류",
  "신뢰 회복",
  "진솔한 대화",
  "우연한 연결",
  "균형 찾기",
]

/** 뽑은 카드와 질문으로 임시 해석을 만듭니다. (실제 해석 아님) */
export function buildMockReading(
  question: string,
  cards: { name: string; reversed: boolean }[]
): ReadingResult {
  const cardLine = cards
    .map((c) => `${c.name}${c.reversed ? "(역)" : ""}`)
    .join(" · ")

  return {
    title: `${cardLine} — ${question.slice(0, 14)}${question.length > 14 ? "…" : ""}`,
    summary:
      "새로운 인연의 문은 이미 조금씩 열리고 있구나. 핵심 메시지는 '억지로 찾을수록 늦어지고, 자연스럽게 연결될수록 빨라진다'는 것이다. 이 몸이 보기엔 지금은 운이 쉬는 시기가 아니라, 새로운 감정을 받아들일 준비가 차곡차곡 완성되는 과정이네.",
    keywords: MOCK_KEYWORDS,
    sections: [
      {
        heading: "지금의 흐름",
        body: "첫 번째 카드는 마음이 다시 살아나는 카드다. 누군가를 만나야 한다는 조급함보다, '이 사람과 더 이야기해 보고 싶다'는 작은 호기심이 먼저 피어나는 흐름이 보이는구나.",
      },
      {
        heading: "조심할 것",
        body: "그다음 카드는 그 감정을 천천히 익혀 가는 카드다. 번개처럼 시작되는 인연이라기보다, 몇 번의 대화와 반복된 만남 속에서 만들어지는 온기라고 보면 된다.",
      },
      {
        heading: "샨티의 조언",
        body: "서두르지 말고, 지금 눈앞의 대화 하나에 마음을 담아보라냥. 그게 쌓이면 네가 바라던 방향으로 저절로 굴러간다.",
      },
    ],
  }
}

/** 후속 질문에 대한 임시 답변. (실제 답변 아님) */
export function buildMockReply(userMessage: string): string {
  return [
    `"${userMessage}"에 대해서라면,`,
    "지금 뽑힌 카드들의 흐름을 보면 답을 서두를 이유는 없어 보인다냥.",
    "이 몸이 보기엔 상황을 바꾸려 애쓰기보다, 지금 오가는 말들 속에서 네 마음이 어디로 기우는지를 먼저 살피는 게 순서다.",
    "조금 더 궁금한 게 있으면 계속 물어보라냥.",
  ].join(" ")
}

/** 질문 입력 화면에 보여줄 예시 질문 (시안의 "제안") */
export const SUGGESTED_QUESTIONS = [
  "그 사람이 지금 무슨 생각중일까?",
  "오늘 하루 어떨까?",
  "그냥 내 금전운이 궁금해",
] as const
