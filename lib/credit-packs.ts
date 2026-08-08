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

import { withJosa, type JosaPair } from "@/lib/korean-josa"

/** 파는 단위를 부르는 말 */
export const CREDIT_UNIT = {
  /** 단위 이름 — "별조각이 부족해요" */
  one: "별조각",
  /** 세는 말 — "3개 남음"의 '개' */
  counter: "개",
} as const

/** "3개" 처럼 세어 부릅니다 */
export function countCredits(n: number): string {
  return `${n}${CREDIT_UNIT.counter}`
}

/** "별조각 3개" 처럼 이름까지 붙여 부릅니다 */
export function nameCredits(n: number): string {
  return `${CREDIT_UNIT.one} ${countCredits(n)}`
}

/**
 * 앞말의 받침에 맞는 조사를 붙입니다 — "별조각을" · "3개를".
 *
 * ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
 * │ 이 파일은 "이름을 바꾸면 사이트 전체가 따라온다"가 약속입니다.
 * │ 그런데 한국어는 앞말의 받침에 따라 조사가 갈립니다 —
 * │
 * │   장 → "1장이 듭니다"   개 → "1개가 듭니다"
 * │   장 → "3장을 썼다면"   개 → "3개를 썼다면"
 * │
 * │ 그래서 문장에 조사를 손으로 박아두면, 이름을 바꾸는 순간 사이트
 * │ 곳곳이 "1개이 듭니다"가 됩니다.
 * │ (크레딧 → 별조각으로 바꾸면서 실제로 환불·약관 화면이 그렇게 됐습니다)
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 셈은 lib/korean-josa.ts 에 있습니다 — 사용자가 친 물음을 되읽는
 *    자리도 같은 규칙을 쓰기 때문입니다. 여기서는 이름만 이어 둡니다.
 */
export { withJosa }

/** "3개를" 처럼 세면서 조사까지 (세는 말이 바뀌어도 조사가 따라옵니다) */
export function countCreditsWith(n: number, pair: JosaPair): string {
  return withJosa(countCredits(n), pair)
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

/**
 * 환불할 때 "이미 쓴 것"을 쳐서 빼는 단가 — 낱개로 살 때의 값입니다.
 *
 * ┌─ 왜 묶음 단가가 아니라 낱개 값인가 ───────────────────────────────
 * │ 묶음 할인은 "열 개를 한꺼번에 사는" 값입니다. 네 개만 쓰고 무르면
 * │ 그 사람이 실제로 산 것은 묶음이 아니라 낱개 넷입니다. 그래서 쓴
 * │ 만큼은 낱개 값으로 치고 나머지를 돌려줍니다 — 할인만 챙기고 무르는
 * │ 일을 막는, 묶음 상품에서 흔한 방식입니다.
 * │
 * │ ⚠️ 이 방식은 반드시 환불정책에 미리 적혀 있어야 합니다. 안 적고
 * │    깎으면 부당한 공제가 됩니다 (app/refund/page.tsx 제4조).
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 숫자를 직접 쓰지 않고 낱개 묶음에서 가져옵니다. 값을 바꿀 때
 *    환불정책만 옛 숫자로 남는 일을 막습니다 — 실제로 한 번 그랬습니다.
 */
export function refundUnitPrice(): number {
  const single = CREDIT_PACKS.find((p) => p.credits === 1)
  // 낱개 묶음이 사라지면 가장 비싼 단가로 칩니다 (없는 값을 지어내지 않도록)
  return single ? single.priceKrw : Math.max(...CREDIT_PACKS.map(pricePerCredit))
}

/**
 * 환불 금액을 셉니다. 제4조가 하는 말을 그대로 옮긴 것입니다.
 *
 * @param paidKrw    그 결제로 실제로 낸 금액
 * @param paidUsed   그 결제분에서 쓴 개수 (무상분을 먼저 뺀 뒤의 수)
 *
 * ⚠️ 0 아래로는 내려가지 않습니다. 낱개 값으로 치면 쓴 값의 합이 낸 돈을
 *    넘어설 수 있는데(10개 묶음에서 8개를 쓰면 그렇습니다), 그때 돈을
 *    더 받아낼 수는 없습니다.
 */
export function refundAmount(paidKrw: number, paidUsed: number): number {
  return Math.max(0, paidKrw - paidUsed * refundUnitPrice())
}

/** "8,000원" */
export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`
}

export function findPack(key: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.key === key)
}
