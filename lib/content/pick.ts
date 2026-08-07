// lib/content/pick.ts
// 여러 개 중에서 이 사람에게 내밀 하나를 고릅니다.
//
// ┌─ 왜 함수가 하나뿐인가 ────────────────────────────────────────────
// │ 고르는 자리가 여럿입니다 — 진입 인사말, 질문, 스프레드, 섞기 멘트.
// │ 자리마다 다르게 짜두면 나중에 규칙을 손볼 때 네 군데를 고쳐야 하고,
// │ 한 군데를 빠뜨리면 거기만 옛 규칙으로 남습니다.
// │
// │ 그래서 규칙은 여기 하나입니다. 고를 수 있는 것에 성향 표(traits)를
// │ 달아두기만 하면 전부 같은 방식으로 골라집니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 다만 얼마나 세게 맞출지는 자리마다 다릅니다 ─────────────────────
// │
// │ best  가장 많이 겹치는 것 중에서 하나. 동점이면 그것들끼리 랜덤
// │       → **질문**에 씁니다.
// │         준비된 질문은 비회원이 받을 수 있는 전부입니다(자유 질문은
// │         별조각이 있어야 열립니다). 그 사람에게는 이 한 판이 첫인상
// │         이자 마지막일 수 있으니, 가장 잘 맞는 것을 내밉니다.
// │
// │ lean  겹칠수록 자주. 겹침 2개=무게 3, 1개=2, 0개=1
// │       → **스프레드**에 씁니다.
// │         성향은 살리되, 같은 질문을 두 번 볼 때 다른 배열이 나오는
// │         편이 낫습니다.
// │
// │ even  성향을 안 봅니다. 그냥 랜덤
// │       → **멘트**(진입 인사말·섞기)에 씁니다.
// │         이 자리에 랜덤을 넣은 까닭이 "매번 같은 말을 보고 싶지
// │         않다" 였습니다. 여기서 매칭을 걸면 잘 맞는 사람일수록
// │         늘 같은 인사를 받습니다 — 넣은 뜻이 뒤집힙니다.
// │
// │ ⚠️ 한 규칙으로 다 덮으려다 한 번 틀렸습니다. 멘트에 좋은 규칙과
// │    질문에 좋은 규칙은 반대 방향입니다.
// └──────────────────────────────────────────────────────────────────
import { traitsOf, type TraitCode, type TraitProfile } from "@/lib/content/traits"

/** 고를 수 있는 것은 무엇이든 이 모양이면 됩니다 */
export interface Weighted {
  /**
   * 이것과 어울리는 성향. 비워두면 누구에게나 고르게 나옵니다.
   *
   * ⚠️ 셋을 다 적을 필요가 없습니다. 「🌸🕯️」처럼 둘만 적어도 되고,
   *    하나만 적어도 됩니다. 적은 것이 겹칠수록 자주 나옵니다.
   */
  traits?: TraitCode[]
}

/** 얼마나 세게 맞출 것인가 (위 표 참고) */
export type PickMode = "best" | "lean" | "even"

/** 이 사람의 성향과 몇 개나 겹치는가 */
export function matchCount(item: Weighted, profile?: TraitProfile | null): number {
  if (!profile || !item.traits?.length) return 0
  const mine = new Set(traitsOf(profile))
  return item.traits.filter((t) => mine.has(t)).length
}

/**
 * 여럿 중 하나를 고릅니다.
 *
 * ⚠️ 성향이 없으면(온보딩 전이거나 건너뛴 사람) 어느 모드든 그냥 랜덤이
 *    됩니다 — 겹치는 수가 모두 0 이라 저절로 그렇게 됩니다. 로그인 전
 *    사람을 위한 갈래를 따로 만들지 않아도 됩니다.
 *
 * @param rand 0 이상 1 미만의 수를 주는 함수. 시험에서 갈아끼웁니다.
 */
export function pickFor<T extends Weighted>(
  candidates: readonly T[],
  profile?: TraitProfile | null,
  mode: PickMode = "lean",
  rand: () => number = Math.random
): T {
  if (candidates.length === 0) {
    // 콘텐츠가 비어 있다는 뜻입니다. 조용히 넘어가면 화면이 빈 채로
    // 뜨므로 여기서 멈춥니다 (scripts/check-content.mjs 가 미리 잡습니다).
    throw new Error("고를 것이 하나도 없습니다")
  }
  if (candidates.length === 1) return candidates[0]

  // 성향을 안 보는 자리 — 고르게 하나.
  if (mode === "even") return candidates[Math.floor(rand() * candidates.length)]

  const matches = candidates.map((c) => matchCount(c, profile))

  // 가장 잘 맞는 것들만 남기고, 그 안에서 고르게 하나.
  if (mode === "best") {
    const top = Math.max(...matches)
    const best = candidates.filter((_, i) => matches[i] === top)
    return best[Math.floor(rand() * best.length)]
  }

  // 겹칠수록 자주.
  // ⚠️ +1 이 있어야 합니다. 겹침 0 을 무게 0 으로 두면 안 맞는 것은 영영
  //    안 나오고, 모두가 안 맞으면 무게가 전부 0 이라 아무것도 못 고릅니다.
  const weights = matches.map((m) => m + 1)
  const total = weights.reduce((sum, w) => sum + w, 0)

  let cursor = rand() * total
  for (let i = 0; i < candidates.length; i += 1) {
    cursor -= weights[i]
    if (cursor < 0) return candidates[i]
  }
  // 소수점 오차로 여기까지 올 수 있습니다. 마지막 것으로 둡니다.
  return candidates[candidates.length - 1]
}

/**
 * 자리마다 정해둔 모드. 부르는 쪽이 매번 고르지 않게 여기 적어둡니다.
 *
 * ⚠️ 부르는 쪽에서 문자열을 직접 적지 마세요. 나중에 "질문은 조금 느슨하게"
 *    같은 결정이 나올 때, 여기 한 줄만 고치면 전부 따라옵니다.
 */
export const PICK_MODE = {
  /** 어떤 질문을 내밀까 — 가장 잘 맞는 것으로 */
  question: "best",
  /** 어떤 배열을 깔까 — 맞추되 조금 흔들리게 */
  spread: "lean",
  /** 인사말·섞기 멘트 — 매번 달라야 하는 자리 */
  line: "even",
} as const satisfies Record<string, PickMode>

/**
 * 한 판 안에서 같은 값을 다시 쓰기 위한 자리.
 *
 * ⚠️ 랜덤은 판마다 **한 번만** 굴려야 합니다. 화면이 한 번 굴리고 서버가
 *    또 굴리면, 사람은 「마음의 거울」을 보고 있는데 샨티는 「감정의
 *    파도」를 읽는 상태가 됩니다 — 자리 이름이 통째로 어긋납니다.
 *
 *    그래서 고른 결과는 반드시 들고 다닙니다. 다시 고르지 마세요.
 */
export type Picked<T> = { readonly value: T }
