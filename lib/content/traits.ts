// lib/content/traits.ts
// [단일 진실 소스] 온보딩「별조각 고르기」가 나누는 성향.
//
// ┌─ 세 갈래로 나눕니다 ──────────────────────────────────────────────
// │   결   🌸 꽃결   ↔  🪨 돌결     이유보다 마음이냐, 마음보다 이유냐
// │   빛   🕯️ 불빛   ↔  🌙 달빛     기척에 놓이느냐, 혼자일 때 개느냐
// │   때   🌳 뿌리   ↔  🍃 바람     지나간 것이냐, 아직 안 온 것이냐
// │
// │ 2 × 2 × 2 = 여덟 사람. 여덟에는 저마다 이름이 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 이모지를 열쇠로 쓰지 않습니다. 콘텐츠에는 언제나 코드값(flower·candle
//    …)만 적습니다. 이모지는 여기서 한 번만 잇습니다.
//
//    까닭이 셋입니다. ① 이모지는 기기마다 다르게 그려지고 ② 눈으로는
//    🌳 와 🌲 를 구별하기 어려워 오타가 그대로 배포되며 ③ 코드에서 찾을
//    수가 없습니다("🍃 를 쓰는 질문 전부"를 검색할 수 없습니다).
//
// ⚠️ 온보딩이 사람을 나누는 자리는 여기가 아닙니다. 여기는 "무엇으로
//    나뉘는가"만 정하고, 문답과 판정은 온보딩 쪽에 있습니다. 이 파일은
//    나뉜 결과를 콘텐츠와 잇는 사전입니다.

/** 성향 한 조각. 콘텐츠에는 이 값만 적습니다 */
export type TraitCode = "flower" | "stone" | "candle" | "moon" | "root" | "wind"

/** 갈래 이름 */
export type AxisKey = "grain" | "light" | "time"

export interface Trait {
  emoji: string
  /** 사람에게 보이는 이름 */
  name: string
  axis: AxisKey
}

export const TRAITS: Record<TraitCode, Trait> = {
  flower: { emoji: "🌸", name: "꽃결", axis: "grain" },
  stone: { emoji: "🪨", name: "돌결", axis: "grain" },
  candle: { emoji: "🕯️", name: "불빛", axis: "light" },
  moon: { emoji: "🌙", name: "달빛", axis: "light" },
  root: { emoji: "🌳", name: "뿌리", axis: "time" },
  wind: { emoji: "🍃", name: "바람", axis: "time" },
}

export const AXES: Record<AxisKey, { name: string; pair: [TraitCode, TraitCode] }> = {
  grain: { name: "결", pair: ["flower", "stone"] },
  light: { name: "빛", pair: ["candle", "moon"] },
  time: { name: "때", pair: ["root", "wind"] },
}

/**
 * 한 사람의 성향 — 갈래마다 한쪽씩, 반드시 셋입니다.
 *
 * ⚠️ 배열이 아니라 갈래별 칸으로 둡니다. 배열이면 ["flower","stone"] 처럼
 *    같은 갈래의 양쪽을 다 가진 사람이 만들어질 수 있는데, 그런 사람은
 *    없습니다. 있을 수 없는 값은 만들 수 없게 두는 편이 낫습니다.
 */
export interface TraitProfile {
  grain: "flower" | "stone"
  light: "candle" | "moon"
  time: "root" | "wind"
}

/** 견주기 편하게 셋을 늘어놓습니다 */
export function traitsOf(profile: TraitProfile): TraitCode[] {
  return [profile.grain, profile.light, profile.time]
}

// ═══════════════════════════════════════════════════════════════════
// 여덟 사람
//
// ⚠️ 친구(character)는 빛 × 때 로 정해집니다 — 결은 이름만 가릅니다.
//    그래서 "우리 둘 다 모루인데 나는 등불이고 너는 주춧돌이네"가 됩니다.
//
//              🌳 뿌리      🍃 바람
//    🌙 달빛    샨티         포포
//    🕯️ 불빛    모루         꼬미
//
// ⚠️ 이름은 셈해서 짓지 않고 여덟 개를 그대로 적어둡니다. 사람들이
//    기억하고 옮기는 것이 이름이라, 규칙으로 만들어낸 이름은 어색합니다.
// ═══════════════════════════════════════════════════════════════════

export type CharacterKey = "shanti" | "moru" | "popo" | "kkomi"

export interface Combo {
  /** 조합 이름 — "난 꽃결이래"가 아니라 "난 봄바람이래"가 되도록 */
  name: string
  character: CharacterKey
}

/** 열쇠는 `결-빛-때` 입니다 (comboKeyOf 로 만듭니다) */
export const COMBOS: Record<string, Combo> = {
  "flower-candle-root": { name: "오래 켜두는 등불", character: "moru" },
  "flower-candle-wind": { name: "먼저 손 내미는 봄바람", character: "kkomi" },
  "flower-moon-root": { name: "혼자 피는 밤꽃", character: "shanti" },
  "flower-moon-wind": { name: "떠도는 꽃씨", character: "popo" },
  "stone-candle-root": { name: "자리를 지키는 주춧돌", character: "moru" },
  "stone-candle-wind": { name: "길을 내는 디딤돌", character: "kkomi" },
  "stone-moon-root": { name: "말 없는 옛돌", character: "shanti" },
  "stone-moon-wind": { name: "바람에 닳는 조약돌", character: "popo" },
}

export function comboKeyOf(profile: TraitProfile): string {
  return `${profile.grain}-${profile.light}-${profile.time}`
}

export function comboOf(profile: TraitProfile): Combo {
  // 여덟이 다 적혀 있으므로 못 찾는 일은 없습니다. 타입이 막고 있고,
  // scripts/check-content.mjs 가 한 번 더 셉니다.
  return COMBOS[comboKeyOf(profile)]
}

/** "🌸 🕯️ 🍃" — 화면에 성향을 늘어놓을 때 */
export function emojiOf(profile: TraitProfile): string {
  return traitsOf(profile)
    .map((t) => TRAITS[t].emoji)
    .join(" ")
}
