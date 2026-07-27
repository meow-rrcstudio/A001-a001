// lib/credit-packs.ts
// [단일 진실 소스] 파는 단위의 이름과 가격입니다.
//
// ⚠️ 화면 어디에도 "크레딧"이나 "2,000원"을 직접 쓰지 마세요. 전부 여기서
//    가져다 씁니다. 그래야 나중에 이름과 가격을 여기 한 곳만 고치면
//    사이트 전체가 함께 바뀝니다.
//
// ┌─ 이름을 바꾸고 싶을 때 ───────────────────────────────────────────
// │ CREDIT_UNIT 만 고치면 됩니다. 예를 들어 세계관에 맞춰
// │   { one: "별", counter: "개", ... }  →  "별 3개 남음"
// │   { one: "부적", counter: "장", ... } →  "부적 3장 남음"
// │ 한국어는 세는 말(개·장·번)이 물건마다 달라서 따로 둡니다.
// └──────────────────────────────────────────────────────────────────

/** 파는 단위를 부르는 말 */
export const CREDIT_UNIT = {
  /** 단위 이름 — "크레딧이 부족해요" */
  one: "크레딧",
  /** 세는 말 — "3장 남음"의 '장' */
  counter: "장",
} as const

/** "3장" 처럼 세어 부릅니다 */
export function countCredits(n: number): string {
  return `${n}${CREDIT_UNIT.counter}`
}

/** "크레딧 3장" 처럼 이름까지 붙여 부릅니다 */
export function nameCredits(n: number): string {
  return `${CREDIT_UNIT.one} ${countCredits(n)}`
}

export interface CreditPack {
  /** 결제 기록에 남는 이름. 값을 바꾸면 예전 결제와 대조가 안 되니 두세요 */
  key: string
  credits: number
  /** 원 단위 */
  priceKrw: number
  /** 목록에서 눈에 띄게 할 것 하나 */
  featured?: boolean
}

/**
 * 파는 묶음.
 *
 * 많이 살수록 싸집니다 — 큰 묶음을 사게 만드는 흔한 방식입니다.
 * ⚠️ 아직 정해진 값이 아닙니다. 결제를 붙이기 전에 확정해야 합니다.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { key: "single", credits: 1, priceKrw: 2000 },
  { key: "five", credits: 5, priceKrw: 8000, featured: true },
  { key: "twelve", credits: 12, priceKrw: 15000 },
]

/** 한 장에 얼마인지 (묶음 비교용) */
export function pricePerCredit(pack: CreditPack): number {
  return Math.round(pack.priceKrw / pack.credits)
}

/** "8,000원" */
export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`
}

export function findPack(key: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.key === key)
}
