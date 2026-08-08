// lib/onboarding.ts
// [단일 진실 소스] 샨티를 깨우는 첫 화면 — 무엇을 묻고, 답을 무엇으로 옮기는가.
//
// ┌─ 세 번 묻습니다 ──────────────────────────────────────────────────
// │ 1  마음이 머무는 키워드 3~5개    (끌림)   → 세 갈래에 표를 던집니다
// │ 2  마음이 움츠러드는 키워드 3~5개 (두려움) → 화면에 안 나옵니다. 대하는 법으로만
// │ 3  메이저 아르카나 22장 중 한 장  (끌림)   → 같은 갈래에 두 표
// │
// │ 표를 세면 결 · 빛 · 때 가 정해지고, 그 셋이 여덟 사람 중 하나가 됩니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 두려움으로 고른 것은 화면에 절대 되돌려 보여주지 않습니다.
//    "당신은 잊혀지는 것을 무서워하는 사람"은 우리가 할 말이 아닙니다.
//    이것은 care(대하는 법)로만 쓰이고, 그 갈래는 lib/character.ts 의
//    @memory_use 에서 "입 밖에 내지 않는다"로 못박혀 있습니다.
//
// ⚠️ 두려움 목록에 죽음·자해 계열을 넣지 마세요. 민감한 물음은 들어왔을
//    때 받아주는 것이지(lib/question-safety.ts), 우리가 먼저 차려 놓고
//    고르라고 할 것이 아닙니다.
//
// 표를 고치면 검사를 돌리세요:
//   node --experimental-strip-types scripts/check-onboarding.mjs

import { allTarotCards, type TarotCardInfo } from "@/lib/tarot-cards"
import type { ChatMemo } from "@/lib/ai/reading-chat"
import {
  AXES,
  TRAITS,
  comboOf,
  type AxisKey,
  type Combo,
  type TraitCode,
  type TraitProfile,
} from "@/lib/content/traits"

// ═══════════════════════════════════════════════════════════════════
// 1. 무엇으로 나누는가 — lib/content/traits.ts 가 정합니다
// ═══════════════════════════════════════════════════════════════════
//
// ┌─ 왜 여기서 갈래를 새로 만들지 않는가 ─────────────────────────────
// │ 준비된 질문 80개와 스프레드 158개에 이미 성향 표가 붙어 있습니다
// │ (resonatesWith). 그 표가 쓰는 말이 flower·stone·candle·moon·root·
// │ wind 여섯입니다.
// │
// │ 온보딩이 다른 말로 사람을 나누면 그 158개는 영영 안 깨어납니다.
// │ 여기는 "무엇으로 나누는가"를 정하는 자리가 아니라, 저쪽이 정해둔
// │ 갈래로 **사람을 나누는 문답**을 놓는 자리입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 별자리 이름도 여기서 짓지 않습니다. 여덟 이름은 traits.ts 의 COMBOS
//    에 손으로 적혀 있습니다 ("혼자 피는 밤꽃" 이 그중 하나입니다).
//    셈해서 지은 이름은 어색하다는 것이 그쪽의 결론이고, 그 결론을 여기서
//    뒤집으면 같은 사람이 화면마다 다른 이름으로 불립니다.

/**
 * 성향 한 조각마다의 한 줄 — 프롬프트의 trait 로 들어갑니다.
 *
 * "이 사람은 ~" 으로 시작합니다. lib/server/user-memory.ts 에 쌓이는
 * 다른 줄들과 같은 모양이어야 프롬프트에서 한 덩어리로 읽힙니다.
 *
 * ⚠️ 조합 이름("혼자 피는 밤꽃")은 넣지 않습니다 — 아래 answersToMemos
 *    주석 참고. 넣으면 샨티가 사람을 규정하게 됩니다.
 */
const TRAIT_SENTENCE: Record<TraitCode, string> = {
  flower: "이 사람은 따져보기 전에 마음이 먼저 움직이는 편이다",
  stone: "이 사람은 마음보다 까닭을 먼저 짚는 편이다",
  candle: "이 사람은 사람의 기척 속에서 편안해진다",
  moon: "이 사람은 혼자 있는 시간에 마음이 개는 편이다",
  root: "이 사람은 지나온 것을 오래 품고 되짚는 편이다",
  wind: "이 사람은 아직 오지 않은 것 쪽으로 마음이 기운다",
}

// ═══════════════════════════════════════════════════════════════════
// 2. 첫째 물음 — 마음이 머무는 것
// ═══════════════════════════════════════════════════════════════════

export interface DrawnKeyword {
  /** 화면에 보이는 말. 두세 글자로 맞춥니다 — 칩 그리드가 들쭉날쭉해집니다 */
  label: string
  /**
   * 이 말이 기우는 쪽. 하나 또는 둘.
   *
   * ⚠️ 같은 갈래의 양쪽을 함께 적지 마세요 (flower 와 stone 을 같이).
   *    서로 상쇄되어 그 낱말은 아무 말도 안 한 것이 됩니다.
   *    scripts/check-onboarding.mjs 가 잡습니다.
   */
  traits: readonly TraitCode[]
}

/**
 * 마음이 머무는 것 — 36개.
 *
 * ┌─ 고를 때의 기준 ──────────────────────────────────────────────────
 * │ · 두세 글자 (네 글자까지). 길면 칩이 두 줄로 접히고 그리드가 깨집니다
 * │ · 좋고 나쁨이 없는 말. "성공"처럼 누구나 고를 말은 변별력이 0입니다
 * │ · 여섯 쪽이 고르게. 한쪽에 말이 몰리면 모두가 그쪽으로 쏠립니다
 * │ · 같은 갈래의 양쪽을 한 낱말에 함께 달지 않습니다 — 서로 지웁니다
 * └──────────────────────────────────────────────────────────────────
 *
 * 아래 묶음 주석은 "그 낱말이 가장 세게 기우는 쪽"으로 나눈 것입니다.
 * 낱말마다 둘째 표가 따로 있으니 묶음이 곧 전부는 아닙니다.
 */
export const DRAWN_KEYWORDS: readonly DrawnKeyword[] = [
  // ── 결 🌸 꽃결 (마음이 먼저) ──────────────────────────────────────
  { label: "온기", traits: ["flower", "candle"] },
  { label: "포옹", traits: ["flower", "candle"] },
  { label: "웃음", traits: ["flower", "candle"] },
  { label: "눈물", traits: ["flower", "moon"] },
  { label: "예감", traits: ["flower", "wind"] },
  { label: "떨림", traits: ["flower", "wind"] },
  { label: "노래", traits: ["flower", "candle"] },
  { label: "꿈", traits: ["flower", "moon"] },

  // ── 결 🪨 돌결 (까닭이 먼저) ──────────────────────────────────────
  { label: "지도", traits: ["stone", "wind"] },
  { label: "저울", traits: ["stone", "candle"] },
  { label: "기록", traits: ["stone", "root"] },
  { label: "약속", traits: ["stone", "root"] },
  { label: "설계", traits: ["stone", "wind"] },
  { label: "정리", traits: ["stone", "root"] },
  { label: "규칙", traits: ["stone", "candle"] },
  { label: "연장", traits: ["stone", "root"] },

  // ── 빛 🕯️ 불빛 (기척 속에서) ──────────────────────────────────────
  { label: "잔치", traits: ["candle", "wind"] },
  { label: "밥상", traits: ["candle", "root"] },
  { label: "마중", traits: ["candle", "flower"] },
  { label: "장터", traits: ["candle", "wind"] },
  { label: "손편지", traits: ["candle", "root"] },
  { label: "모닥불", traits: ["candle", "root"] },

  // ── 빛 🌙 달빛 (혼자일 때) ────────────────────────────────────────
  { label: "새벽", traits: ["moon", "wind"] },
  { label: "빗소리", traits: ["moon", "flower"] },
  { label: "혼자", traits: ["moon", "stone"] },
  { label: "안개", traits: ["moon", "flower"] },
  { label: "헌책", traits: ["moon", "root"] },
  { label: "낮잠", traits: ["moon", "root"] },

  // ── 때 🌳 뿌리 (지나온 것) ────────────────────────────────────────
  { label: "손때", traits: ["root", "stone"] },
  { label: "고향", traits: ["root", "flower"] },
  { label: "나이테", traits: ["root", "stone"] },
  { label: "옛사진", traits: ["root", "moon"] },

  // ── 때 🍃 바람 (아직 안 온 것) ────────────────────────────────────
  { label: "첫차", traits: ["wind", "stone"] },
  { label: "여행", traits: ["wind", "flower"] },
  { label: "문", traits: ["wind", "moon"] },
  { label: "처음", traits: ["wind", "candle"] },
] as const

// ═══════════════════════════════════════════════════════════════════
// 3. 둘째 물음 — 마음이 움츠러드는 것
// ═══════════════════════════════════════════════════════════════════

export interface FearKeyword {
  label: string
  /**
   * 이 두려움을 고른 사람을 **대하는 법**. 두려움 자체가 아닙니다.
   *
   * ⚠️ "이 사람은 ~를 무서워한다"로 적지 마세요. 그건 사람을 규정하는
   *    문장이고(character.ts 의 no_fate), 프롬프트에 들어가면 샨티가
   *    그걸 그대로 입 밖에 냅니다. care 는 "그래서 어떻게 말할 것인가"
   *    까지 적어야 쓸모가 있습니다.
   */
  care: string
}

/**
 * 마음이 움츠러드는 것 — 28개.
 *
 * 결과 화면에 나오지 않습니다. 샨티가 말하는 결을 고르는 데만 쓰입니다.
 */
export const FEAR_KEYWORDS: readonly FearKeyword[] = [
  { label: "잊혀짐", care: "이 사람에게는 지난 이야기를 한 마디로 짚어주면 편해한다" },
  { label: "혼자 남음", care: "이 사람에게는 혼자 해내라는 투의 말을 앞세우지 않는다" },
  { label: "늦어버림", care: "이 사람에게는 시기를 다그치듯 말하지 않는다" },
  { label: "실패", care: "이 사람에게는 잘잘못을 가리기보다 지금 할 수 있는 것을 먼저 말한다" },
  { label: "미움받음", care: "이 사람에게는 관계를 단정 짓는 말을 피한다" },
  { label: "들킴", care: "이 사람에게는 속을 캐묻지 않고 말한 만큼만 받는다" },
  { label: "비교", care: "이 사람에게는 남들과 견주는 말을 쓰지 않는다" },
  { label: "재촉", care: "이 사람에게는 서두르라는 조언을 얹지 않는다" },
  { label: "참견", care: "이 사람에게는 묻지 않은 조언을 덧붙이지 않는다" },
  { label: "무관심", care: "이 사람에게는 짧게 끊지 말고 한 마디라도 받아준다" },
  { label: "시끄러움", care: "이 사람에게는 말수를 줄이고 담백하게 말한다" },
  { label: "어긋남", care: "이 사람에게는 어긋난 일을 탓하지 않고 흐름으로 설명한다" },
  { label: "오해", care: "이 사람에게는 에두르지 말고 뜻을 또렷하게 말한다" },
  { label: "거절", care: "이 사람에게는 단정적으로 안 된다고 말하지 않는다" },
  { label: "짐", care: "이 사람에게는 부담을 지우는 권유를 하지 않는다" },
  { label: "헛됨", care: "이 사람에게는 지나온 시간을 헛되다고 말하지 않는다" },
  { label: "제자리", care: "이 사람에게는 변화가 없어 보이는 때도 흐름으로 읽어준다" },
  { label: "멈춤", care: "이 사람에게는 쉬어도 된다고 먼저 말해준다" },
  { label: "흔들림", care: "이 사람에게는 마음이 오락가락하는 것을 흠으로 말하지 않는다" },
  { label: "뒤처짐", care: "이 사람에게는 속도를 두고 재는 말을 쓰지 않는다" },
  { label: "어색함", care: "이 사람에게는 농담을 섞어 문턱을 낮춘다" },
  { label: "갈림길", care: "이 사람에게는 고르라고 몰지 말고 갈래를 나란히 놓아준다" },
  { label: "끊김", care: "이 사람에게는 관계가 끝났다고 못박지 않는다" },
  { label: "평가", care: "이 사람에게는 잘한다·못한다는 말을 쓰지 않는다" },
  { label: "부담", care: "이 사람에게는 할 일을 여러 개 늘어놓지 않는다" },
  { label: "변덕", care: "이 사람에게는 마음이 바뀌는 것을 자연스러운 일로 받는다" },
  { label: "낯섦", care: "이 사람에게는 새로운 것을 권할 때 작은 것부터 말한다" },
  { label: "빈자리", care: "이 사람에게는 없는 것보다 있는 것을 먼저 짚는다" },
] as const

// ═══════════════════════════════════════════════════════════════════
// 4. 셋째 물음 — 메이저 아르카나 22장
// ═══════════════════════════════════════════════════════════════════

/**
 * 온보딩에서 보여줄 카드 — 메이저 아르카나 22장.
 *
 * ┌─ 왜 78장이 아니라 22장인가 ───────────────────────────────────────
 * │ 78장은 스크롤이 길어서 아래쪽 카드가 사실상 안 뽑힙니다. 22장은
 * │ 한 화면에서 두어 번 넘기면 다 보이고, 그림의 결이 서로 뚜렷하게
 * │ 달라서 "끌리는 것"이 실제로 갈립니다.
 * │
 * │ 무작위로 추리지 않습니다 — 매번 다른 22장이면 같은 사람이 다시 해도
 * │ 다른 결과가 나오고, 아래 성향표를 22장에만 적어두면 되는 이점도
 * │ 사라집니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 앞면을 보여줍니다. 뒷면을 고르게 하면 그건 정보가 없는 제비뽑기이고,
 *    바로 뒤에 오는 진짜 카드 뽑기와 하는 일이 겹칩니다. 여기서 묻는 것은
 *    점이 아니라 "어느 그림에 눈이 가는가"입니다.
 */
export const ONBOARDING_CARDS: readonly TarotCardInfo[] = allTarotCards.filter(
  (card) => card.arcana === "Major Arcana"
)

/**
 * 카드마다 기우는 쪽.
 *
 * ┌─ 왜 카드에도 성향을 붙이는가 ─────────────────────────────────────
 * │ 안 붙이면 카드 고르기가 결과에 아무 영향이 없습니다. 사람은 한 판만
 * │ 해보면 그걸 알아채고, 다음부터 아무 카드나 누릅니다.
 * │
 * │ 그리고 여기가 갈래를 가르는 마지막 손입니다 — 키워드에서 5:5 로
 * │ 갈린 갈래를 카드 한 장이 기울입니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * 열쇠는 카드 번호(0~21)입니다 — 슬러그(universal-major-00)가 바뀌어도
 * 번호는 그대로라, 이 표가 조용히 어긋나지 않습니다.
 *
 * ⚠️ 카드의 "정통 해석"을 옮긴 것이 아닙니다. 그림을 보고 마음이 기우는
 *    쪽입니다 — 여기서 묻는 것은 점이 아니라 취향이기 때문입니다.
 */
const MAJOR_TRAITS: Record<number, readonly TraitCode[]> = {
  0: ["wind", "flower"],    // 바보 — 첫 걸음
  1: ["wind", "candle"],    // 마법사
  2: ["moon", "stone"],     // 여사제
  3: ["flower", "candle"],  // 여황제
  4: ["stone", "root"],     // 황제
  5: ["root", "candle"],    // 교황
  6: ["flower", "candle"],  // 연인
  7: ["wind", "stone"],     // 전차
  8: ["flower", "root"],    // 힘
  9: ["moon", "root"],      // 은둔자
  10: ["wind", "moon"],     // 운명의 수레바퀴
  11: ["stone", "candle"],  // 정의
  12: ["moon", "flower"],   // 매달린 사람
  13: ["wind", "stone"],    // 죽음 — 지나간 자리를 비우는 쪽
  14: ["root", "flower"],   // 절제
  15: ["root", "stone"],    // 악마
  16: ["wind", "moon"],     // 탑
  17: ["moon", "wind"],     // 별
  18: ["moon", "flower"],   // 달
  19: ["candle", "flower"], // 태양
  20: ["root", "candle"],   // 심판
  21: ["root", "stone"],    // 세계
}

/** 카드 한 장이 갖는 무게. 키워드 한 개보다 조금 셉니다 */
const CARD_WEIGHT = 2

// ═══════════════════════════════════════════════════════════════════
// 5. 답 → 결과
// ═══════════════════════════════════════════════════════════════════

/** 한 물음에서 고를 수 있는 개수. "정확히 5개"가 아니라 폭입니다 */
export const PICK_MIN = 3
export const PICK_MAX = 5

/** 사람이 고른 것. 이 모양 그대로 브라우저에 저장됩니다 */
export interface OnboardingAnswers {
  /** DrawnKeyword.label 들 */
  drawn: string[]
  /** FearKeyword.label 들 */
  fears: string[]
  /** TarotCardInfo.slug */
  cardSlug: string | null
}

export const EMPTY_ANSWERS: OnboardingAnswers = { drawn: [], fears: [], cardSlug: null }

export interface OnboardingResult {
  /** 나뉜 성향. 아직 다 안 골랐으면 null */
  profile: TraitProfile | null
  /** 별자리 이름과 친구 — traits.ts 의 COMBOS 에서 옵니다 */
  combo: Combo | null
  /** 화면에 보이는 태그 셋 — "🌸 꽃결" 처럼 */
  tags: { code: TraitCode; emoji: string; name: string }[]
  /** 이름 아래 두 줄 */
  lines: string[]
  /** 고른 카드 (결과 화면이 그림을 함께 보여줄 때) */
  card: TarotCardInfo | null
}

/** 어느 쪽이 몇 표인가 */
type Tally = Record<TraitCode, number>

const EMPTY_TALLY = (): Tally => ({
  flower: 0,
  stone: 0,
  candle: 0,
  moon: 0,
  root: 0,
  wind: 0,
})

/**
 * 고른 것에서 표를 셉니다 — 키워드 한 표, 카드 두 표.
 */
function tally(answers: OnboardingAnswers): Tally {
  const score = EMPTY_TALLY()

  for (const label of answers.drawn) {
    const keyword = DRAWN_KEYWORDS.find((k) => k.label === label)
    if (!keyword) continue
    for (const code of keyword.traits) score[code] += 1
  }

  const card = answers.cardSlug
    ? ONBOARDING_CARDS.find((c) => c.slug === answers.cardSlug)
    : undefined
  if (card) {
    for (const code of MAJOR_TRAITS[card.number] ?? []) score[code] += CARD_WEIGHT
  }

  return score
}

/**
 * 표를 세 갈래의 승자로 옮깁니다.
 *
 * ⚠️ 동점이면 AXES 에 먼저 적힌 쪽입니다. 정해두지 않으면 같은 답으로
 *    새로고침할 때마다 다른 사람이 됩니다 — 이 값은 프롬프트에까지
 *    실리므로 흔들리면 안 됩니다.
 *
 * ⚠️ 양쪽 다 0 표여도(아무것도 안 고른 갈래) 한쪽을 고릅니다. 갈래를
 *    비워두면 TraitProfile 이 성립하지 않고, 콘텐츠 쪽은 셋이 다 있는
 *    것을 전제로 짜여 있습니다.
 */
function decide(score: Tally): TraitProfile {
  const win = (axis: AxisKey): TraitCode => {
    const [a, b] = AXES[axis].pair
    return score[b] > score[a] ? b : a
  }
  return {
    grain: win("grain") as TraitProfile["grain"],
    light: win("light") as TraitProfile["light"],
    time: win("time") as TraitProfile["time"],
  }
}

/** 고른 답에서 성향을 얻습니다. 아직 덜 골랐으면 null */
export function profileOf(answers: OnboardingAnswers): TraitProfile | null {
  if (!isComplete(answers)) return null
  return decide(tally(answers))
}

/**
 * 답을 결과로 옮깁니다.
 *
 * 답이 모자라도(아직 고르는 중) 터지지 않습니다 — 결과 화면을 미리
 * 그려보는 자리(app/design-1859)에서 쓰려면 그래야 합니다.
 */
export function buildResult(answers: OnboardingAnswers): OnboardingResult {
  const profile = profileOf(answers)
  const card = answers.cardSlug
    ? (ONBOARDING_CARDS.find((c) => c.slug === answers.cardSlug) ?? null)
    : null

  if (!profile) {
    return { profile: null, combo: null, tags: [], lines: [], card }
  }

  const codes = [profile.grain, profile.light, profile.time]

  return {
    profile,
    combo: comboOf(profile),
    tags: codes.map((code) => ({
      code,
      emoji: TRAITS[code].emoji,
      name: TRAITS[code].name,
    })),
    // 결 · 빛 두 줄만 냅니다. 셋을 다 늘어놓으면 카드가 설명문이 됩니다.
    lines: [profile.grain, profile.light].map((code) =>
      TRAIT_SENTENCE[code].replace(/^이 사람은 /, "")
    ),
    card,
  }
}

// ═══════════════════════════════════════════════════════════════════
// 6. 답 → 기억 (샨티가 실제로 읽는 것)
// ═══════════════════════════════════════════════════════════════════

/**
 * 답을 user_memories 에 쌓을 줄들로 옮깁니다.
 *
 * ┌─ 왜 별자리 이름을 넣지 않는가 ────────────────────────────────────
 * │ 넣으면 샨티가 "너는 혼자 피는 밤꽃이구나"라고 말합니다. 그건
 * │ lib/character.ts 가 금지선으로 못박아 둔 것입니다 —
 * │   no_fate = 운명론_금지 | 사람을_규정하지_않는다
 * │   금지 = 기억을_모아_사람을_규정하기
 * │
 * │ 이름은 **사람에게 보여주는 것**이고, 샨티에게 넘기는 것은 **재료**
 * │ 입니다. 재료만 넘기면 규정하지 않으면서도 그 결에 맞게 말합니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ trait 는 결·빛 둘까지만 넣습니다. 셋을 다 넣으면 프롬프트에 실리는
 *    열다섯 줄(USER_MEMORY_PROMPT_MAX)을 온보딩이 너무 많이 차지해서,
 *    정작 대화에서 알게 된 것이 밀려납니다.
 */
export function answersToMemos(answers: OnboardingAnswers): ChatMemo[] {
  const memos: ChatMemo[] = []

  const profile = profileOf(answers)
  if (profile) {
    for (const code of [profile.grain, profile.light]) {
      memos.push({ kind: "trait", fact: TRAIT_SENTENCE[code] })
    }
  }

  // 두려움은 고른 만큼 다 넣지 않습니다. care 는 말투를 고르는 손잡이라
  // 셋을 넘기면 서로 당겨서 아무 말도 못 하게 됩니다 (character.ts 의
  // "조심스러움을 너무 세게 걸면 답을 안 합니다" 참고).
  for (const label of answers.fears.slice(0, 3)) {
    const fear = FEAR_KEYWORDS.find((f) => f.label === label)
    if (fear) memos.push({ kind: "care", fact: fear.care })
  }

  return memos
}

/** 세 물음에 다 답했는지 */
export function isComplete(answers: OnboardingAnswers): boolean {
  return (
    answers.drawn.length >= PICK_MIN &&
    answers.fears.length >= PICK_MIN &&
    answers.cardSlug !== null
  )
}
