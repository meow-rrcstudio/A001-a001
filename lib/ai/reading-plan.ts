// lib/ai/reading-plan.ts
// 질문을 받아 "이 질문엔 어떤 배열이 좋을까"를 샨티가 직접 정합니다.
//
// 지금까지는 무슨 질문이든 6장 십자 배열이었습니다. "오늘 나의 운세?" 에
// 6장은 과하고, 자리 이름(지나온 흐름·상대의 마음…)도 질문과 안 맞았습니다.
// 이제 질문을 읽고 장수와 자리 이름을 그때그때 정합니다.

/** 쓸 수 있는 배열과 장수. spreadLayouts 의 키와 같아야 합니다. */
export const SPREAD_CHOICES: { key: string; count: number; when: string }[] = [
  { key: "one-card", count: 1, when: "예/아니오, 오늘 한마디처럼 아주 단순한 질문" },
  { key: "two-card", count: 2, when: "둘 중 하나를 고르거나 두 면을 견주는 질문" },
  { key: "three-row", count: 3, when: "과거→현재→미래 같은 시간 흐름" },
  { key: "three-arch", count: 3, when: "상황→원인→조언 같은 진단형" },
  { key: "three-inverted", count: 3, when: "마음→걸림돌→해법 같은 내면형" },
  { key: "four-row", count: 4, when: "네 단계로 이어지는 흐름" },
  { key: "four-grid", count: 4, when: "네 가지 면을 나란히 보는 질문" },
  { key: "four-diamond", count: 4, when: "핵심을 가운데 두고 둘러보는 질문" },
  { key: "five-tee", count: 5, when: "중심 주제 + 네 갈래" },
  { key: "five-grid", count: 5, when: "다섯 갈래를 고르게 보는 질문" },
  { key: "five-two-three", count: 5, when: "두 축을 견주며 보는 질문" },
  { key: "six-cross", count: 6, when: "나와 상대가 함께 얽힌 관계 질문" },
  { key: "six-hex", count: 6, when: "여섯 방향을 두루 살피는 질문" },
  { key: "seven-horseshoe", count: 7, when: "긴 흐름을 단계별로 짚는 질문" },
  { key: "ten-celtic", count: 10, when: "인생의 큰 갈림길처럼 깊고 무거운 질문" },
]

export const PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    layoutKey: {
      type: "string",
      enum: SPREAD_CHOICES.map((s) => s.key),
      description: "이 질문에 가장 어울리는 배열",
    },
    intro: {
      type: "string",
      description:
        "질문을 받고 건네는 첫 말. 질문을 되짚고, 몇 장을 뽑을지 알리고, 무엇을 떠올리며 섞을지 일러준다. 2~3문장.",
    },
    positions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "이 자리가 무엇인지 (예: 오늘의 기운)" },
          guide: {
            type: "string",
            description: "이 장을 뽑기 직전에 건네는 말. 무엇을 떠올리며 뽑을지.",
          },
        },
        required: ["label", "guide"],
        propertyOrdering: ["label", "guide"],
      },
      description: "고른 배열의 장수와 개수가 정확히 같아야 한다",
    },
  },
  required: ["layoutKey", "intro", "positions"],
  propertyOrdering: ["layoutKey", "intro", "positions"],
} as const

/** 배열 고르기 지시 — 페르소나 뒤에 붙습니다 */
export const PLAN_INSTRUCTION = `@task{
목적=사용자의_질문을_읽고_이_질문에_가장_어울리는_타로_배열을_고른다,
출력=JSON_한_덩어리만|설명문_없이
}
@spreads{
${SPREAD_CHOICES.map((s) => `${s.key}(${s.count}장)=${s.when}`).join(",\n")}
}
@rule{
장수=질문의_무게에_맞게|가벼운_질문에_10장은_과하다|무거운_질문에_1장은_모자라다,
positions.길이=고른_배열의_장수와_정확히_일치,
label=이_질문에_맞춰_지어라|일반적인_"과거/현재/미래"보다_질문에_붙은_말이_좋다,
guide=뽑기_직전에_건네는_말|"~를 떠올리며 뽑아보라냥"_같은_어투|자리마다_다르게,
intro=질문을_되짚고+몇장을_뽑는지+무엇을_떠올리며_섞을지|2~3문장|마지막_장에는_"자 마지막이야"같은_기색
}`
