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
 * │ 곳곳이 "1개이 듭니다"가 됩니다. 오류도 안 나고 빌드도 통과해서,
 * │ 누가 읽다가 발견할 때까지 그대로 남습니다.
 * │ (크레딧 → 별조각으로 바꾸면서 실제로 환불·약관 화면이 그렇게 됐습니다)
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 받침이 없는 글자로 끝나면 뒤엣것, 있으면 앞엣것입니다.
 *    "으로/로" 만 예외로 ㄹ 받침도 뒤엣것을 씁니다 ("별로"·"쌀로").
 */
export function withJosa(word: string, pair: "을를" | "이가" | "은는" | "와과" | "으로로"): string {
  const last = word.trim().slice(-1)
  const code = last.charCodeAt(0)

  // 한글 음절이 아니면(숫자·영문) 받침 없는 것으로 봅니다.
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const finalConsonant = isHangul ? (code - 0xac00) % 28 : 0

  if (pair === "으로로") {
    // 8 = ㄹ. "별로"처럼 ㄹ 뒤에는 "로"가 붙습니다.
    return `${word}${finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로"}`
  }

  const [withFinal, withoutFinal] = [pair.slice(0, 1), pair.slice(1)]
  return `${word}${finalConsonant ? withFinal : withoutFinal}`
}

/** "3개를" 처럼 세면서 조사까지 (세는 말이 바뀌어도 조사가 따라옵니다) */
export function countCreditsWith(n: number, pair: Parameters<typeof withJosa>[1]): string {
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

/** "8,000원" */
export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`
}

export function findPack(key: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.key === key)
}
