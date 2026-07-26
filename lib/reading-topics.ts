// lib/reading-topics.ts
// -----------------------------------------------------------------------------
// [단일 진실 소스] 리딩 주제의 목록과 타입은 "여기에서만" 정의합니다.
// 주제를 추가/변경할 때: 이 배열에 추가 → lib/reading-content.ts 의
// topicContent 에 같은 slug 로 콘텐츠를 추가하면 타입이 강제로 맞춰줍니다.
//
// 순서는 홈 화면 카드 순서와 같습니다 (lib/home-categories.ts 가 이 순서를 씁니다).
// -----------------------------------------------------------------------------
export const readingTopics = [
  { number: "01", slug: "self", label: "나", enLabel: "Self" },
  { number: "02", slug: "daily", label: "일상", enLabel: "Daily" },
  { number: "03", slug: "love", label: "사랑", enLabel: "Love" },
  { number: "04", slug: "friend", label: "친구", enLabel: "Friend" },
  { number: "05", slug: "career", label: "생산적인 일", enLabel: "Work" },
  { number: "06", slug: "money", label: "그저 돈", enLabel: "Money" },
] as const

export type ReadingTopicSlug = (typeof readingTopics)[number]["slug"]
