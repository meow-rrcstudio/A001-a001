// lib/mock-reading.ts
// 해석 한 건의 모양(ReadingResult)과 진입 화면의 제안 질문입니다.
//
// 이름에 mock 이 남아 있지만 가짜 데이터는 모두 걷어냈습니다.
// 해석은 /api/reading, 이어지는 면담은 /api/reading/chat 이 만듭니다.
// (예전의 buildMockReading·buildMockReply 는 실제 답과 구별이 안 돼
//  화면을 보고 "AI 가 이렇게만 답하나?" 오해하게 만들어 지웠습니다.)

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

/** 질문 입력 화면에 보여줄 예시 질문 (시안의 "제안") */
export const SUGGESTED_QUESTIONS = [
  "그 사람이 지금 무슨 생각중일까?",
  "오늘 하루 어떨까?",
  "그냥 내 금전운이 궁금해",
] as const
