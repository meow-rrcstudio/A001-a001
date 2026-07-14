// lib/reading-topics.ts
export const readingTopics = [
  { number: "01", slug: "self", label: "나 자신", enLabel: "Self" },
  { number: "02", slug: "love", label: "연애", enLabel: "Love" },
  { number: "03", slug: "career", label: "직업", enLabel: "Career" },
  { number: "04", slug: "money", label: "금전", enLabel: "Money" },
] as const

export type ReadingTopicSlug = (typeof readingTopics)[number]["slug"]