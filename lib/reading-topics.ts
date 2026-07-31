// lib/reading-topics.ts
// -----------------------------------------------------------------------------
// [단일 진실 소스] 리딩 주제의 목록과 타입은 "여기에서만" 정의합니다.
// 주제를 추가/변경할 때: 이 배열에 추가 → lib/reading-content.ts 의
// topicContent 에 같은 slug 로 콘텐츠를 추가하면 타입이 강제로 맞춰줍니다.
//
// 순서는 홈 화면 카드 순서와 같습니다 (lib/home-categories.ts 가 이 순서를 씁니다).
// -----------------------------------------------------------------------------
// ┌─ label 과 chipLabel 을 나눠 둔 까닭 ──────────────────────────────
// │ 홈 카드는 넓어서 무드를 낼 수 있습니다 — "생산적인 일"·"그저 돈".
// │ 타로보기 진입 화면의 칩은 한 줄에 여섯 개가 들어가야 해서 짧아야
// │ 합니다 — "직업"·"돈".
// │
// │ 한 벌로 쓰면 둘 중 하나가 반드시 손해를 봅니다. 홈이 밋밋해지거나,
// │ 칩이 두 줄로 밀리거나.
// │
// │ chipLabel 이 없으면 label 을 씁니다. 짧은 이름(나·일상·사랑·친구)은
// │ 따로 적을 것이 없습니다.
// └──────────────────────────────────────────────────────────────────
export const readingTopics = [
  { number: "01", slug: "self", label: "나", chipLabel: "나 자신", enLabel: "Self" },
  { number: "02", slug: "daily", label: "일상", enLabel: "Daily" },
  { number: "03", slug: "love", label: "사랑", enLabel: "Love" },
  { number: "04", slug: "friend", label: "친구", enLabel: "Friend" },
  { number: "05", slug: "career", label: "생산적인 일", chipLabel: "직업", enLabel: "Work" },
  { number: "06", slug: "money", label: "그저 돈", chipLabel: "돈", enLabel: "Money" },
] as const

/** 칩에 쓸 짧은 이름 (없으면 원래 이름) */
export function topicChipLabel(topic: (typeof readingTopics)[number]): string {
  return "chipLabel" in topic ? topic.chipLabel : topic.label
}

export type ReadingTopicSlug = (typeof readingTopics)[number]["slug"]
