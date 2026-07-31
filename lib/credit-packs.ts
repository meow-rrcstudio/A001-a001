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
 *
 * ┌─ 이 값이 어떻게 나왔는가 (2026-07-30) ────────────────────────────
 * │ 한 판 원가는 이어묻기 상한(FOLLOWUPS_PER_CREDIT)이 정합니다.
 * │ 10회 기준으로 해석 좋은 모델 + 대화 싼 모델이면 116원 안쪽입니다.
 * │ 888원에서 부가세(81원)와 결제수수료(약 27원)를 빼도 660원쯤 남습니다.
 * │
 * │ 할인 기울기를 0 → 10% → 23% 로 벌려 10장으로 유도합니다.
 * │ 10장을 6,880원으로 둔 것은 "칠천 원 아래"가 "만 원 아래"보다
 * │ 훨씬 세게 걸리기 때문입니다.
 * │
 * │ ⚠️ 낱장 값을 내릴 때는 묶음도 반드시 함께 내려야 합니다. 낱장이
 * │    묶음보다 싸지면 묶음을 살 이유가 사라집니다 — 예전 값(2,000 /
 * │    1,600 / 1,250)에 888 을 그대로 얹었다면 그렇게 됐을 겁니다.
 * └──────────────────────────────────────────────────────────────────
 */
export const CREDIT_PACKS: CreditPack[] = [
  { key: "single", credits: 1, priceKrw: 888 },
  { key: "three", credits: 3, priceKrw: 2400 },
  { key: "ten", credits: 10, priceKrw: 6880, featured: true },
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
