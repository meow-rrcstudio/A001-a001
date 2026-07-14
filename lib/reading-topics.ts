// lib/reading-topics.ts
// -----------------------------------------------------------------------------
// [단일 진실 소스] 리딩 주제의 목록과 타입은 "여기에서만" 정의합니다.
// 주제를 추가/변경할 때: 이 배열에 추가 → lib/reading-content.ts 의
// topicContent 에 같은 slug 로 콘텐츠를 추가하면 타입이 강제로 맞춰줍니다.
// -----------------------------------------------------------------------------
export const readingTopics = [
  { number: "01", slug: "self", label: "나 자신", enLabel: "Self" },
  { number: "02", slug: "love", label: "연애", enLabel: "Love" },
  { number: "03", slug: "career", label: "직업", enLabel: "Career" },
  { number: "04", slug: "money", label: "금전", enLabel: "Money" },
] as const

export type ReadingTopicSlug = (typeof readingTopics)[number]["slug"]
