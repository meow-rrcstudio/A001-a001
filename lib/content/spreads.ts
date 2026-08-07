// lib/content/spreads.ts
// 주제별 스프레드를 한자리에 모읍니다. 여기에는 내용이 없습니다.
//
// ┌─ 열쇠(id)와 layoutKey 는 다릅니다 ────────────────────────────────
// │ id        이 스프레드만의 이름 — "mirror-now-5"
// │ layoutKey 카드가 놓이는 좌표 — "five-grid" (15종, 여럿이 나눠 씀)
// │
// │ 한동안 둘을 같은 것으로 쓰려던 안이 있었는데, 그러면 five-grid 를
// │ 쓰는 스프레드가 사이트 전체에 하나뿐이게 됩니다. 이름 붙인 배열은
// │ 계속 늘어나는데 좌표는 열다섯 개뿐입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ id 가 주제를 넘어 겹치면 뒤엣것이 앞엣것을 덮어씁니다. 검사
//    스크립트가 그걸 잡습니다 (scripts/check-content.mjs).
import type { Spread, SpreadId } from "@/lib/content/spread-type"
import { SELF_SPREADS } from "@/lib/content/spreads/self"
import { LOVE_SPREADS } from "@/lib/content/spreads/love"
import { CAREER_SPREADS } from "@/lib/content/spreads/career"
import { MONEY_SPREADS } from "@/lib/content/spreads/money"
import { DAILY_SPREADS } from "@/lib/content/spreads/daily"
import { FRIEND_SPREADS } from "@/lib/content/spreads/friend"

export type { Spread, SpreadPosition, SpreadId } from "@/lib/content/spread-type"

/** 주제별로 나눠 적었지만, 쓸 때는 한 사전입니다 (질문이 id 로만 가리킵니다) */
export const SPREADS: Record<SpreadId, Spread> = {
  ...SELF_SPREADS,
  ...LOVE_SPREADS,
  ...CAREER_SPREADS,
  ...MONEY_SPREADS,
  ...DAILY_SPREADS,
  ...FRIEND_SPREADS,
}

/** 주제마다 몇 개씩인지 — 겹친 id 를 세어보려고 따로 둡니다 */
export const SPREADS_BY_TOPIC = {
  self: SELF_SPREADS,
  love: LOVE_SPREADS,
  career: CAREER_SPREADS,
  money: MONEY_SPREADS,
  daily: DAILY_SPREADS,
  friend: FRIEND_SPREADS,
}
