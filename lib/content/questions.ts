// lib/content/questions.ts
// 주제별 질문을 한자리에 모읍니다. 여기에는 내용이 없습니다.
//
// ┌─ 왜 주제마다 파일을 나눴는가 ─────────────────────────────────────
// │ 주제 6 × 질문 10 = 60개이고, 질문마다 확정 멘트가 여럿 딸립니다.
// │ 한 파일에 다 넣으면 천 줄이 넘어가고, 문구를 고치러 들어갈 때마다
// │ 그 덩어리를 헤집게 됩니다 — 문구는 앞으로 계속 손볼 자리입니다.
// │
// │ 나눠두면 「연애 문구를 손본다」가 love.ts 하나만 여는 일이 되고,
// │ 두 사람이 다른 주제를 동시에 고쳐도 부딪히지 않습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 타입은 lib/content/question-type.ts 에 있습니다. 주제 파일들이 이
//    파일을 보면 서로 물고 도는 참조가 되기 때문입니다.
import type { ReadingTopicSlug } from "@/lib/reading-topics"
import type { PreparedQuestion } from "@/lib/content/question-type"
import { SELF_QUESTIONS } from "@/lib/content/questions/self"
import { LOVE_QUESTIONS } from "@/lib/content/questions/love"
import { CAREER_QUESTIONS } from "@/lib/content/questions/career"
import { MONEY_QUESTIONS } from "@/lib/content/questions/money"
import { DAILY_QUESTIONS } from "@/lib/content/questions/daily"
import { FRIEND_QUESTIONS } from "@/lib/content/questions/friend"

export type { PreparedQuestion }

export const PREPARED: Record<ReadingTopicSlug, PreparedQuestion[]> = {
  self: SELF_QUESTIONS,
  love: LOVE_QUESTIONS,
  career: CAREER_QUESTIONS,
  money: MONEY_QUESTIONS,
  daily: DAILY_QUESTIONS,
  friend: FRIEND_QUESTIONS,
}
