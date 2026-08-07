// lib/content/questions.ts
// [콘텐츠] 준비된 질문 — 주제마다 열 개.
//
// ┌─ 한 판이 흘러가는 네 자리 ────────────────────────────────────────
// │ ① 타로 진입    ENTRY_LINES        (lib/content/lines.ts · 공용)
// │ ② 주제 진입    TOPIC_LINES        (lib/content/lines.ts · 주제별)
// │ ③ 질문 확정    question.confirms  ← 이 파일
// │ ④ 섞을 때      question.shuffles  ← 이 파일
// │ ⑤ 뽑을 때      spread.positions[].short  (lib/content/spreads.ts)
// │
// │ ①~④ 는 모두 여럿 중 하나가 나갑니다. 고르는 규칙은 한 곳입니다
// │ (lib/content/pick.ts) — 성향이 겹칠수록 자주 나오고, 겹치는 것이
// │ 없으면 그냥 랜덤입니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 채우는 법 ───────────────────────────────────────────────────────
// │ slug     영문 소문자와 하이픈. 한 주제 안에서 겹치면 안 됩니다
// │ label    사람이 보는 질문 문장
// │ traits   이 질문과 어울리는 성향. 셋을 다 적을 필요 없습니다 —
// │          「🌸🕯️」처럼 둘만 적으면 그 둘이 겹치는 사람에게 자주 갑니다
// │ spreads  쓸 스프레드 id 를 하나 이상. 여럿이면 그중 하나가 나갑니다
// │          (lib/content/spreads.ts 에 있는 id 여야 합니다)
// │ confirms 질문을 고른 직후 샨티가 건네는 말. 하나 이상
// │ shuffles 카드를 섞는 동안 건네는 말. 하나 이상
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 성향 코드는 이모지가 아니라 글자입니다 (lib/content/traits.ts).
//      🌸 꽃결 = flower     🪨 돌결 = stone
//      🕯️ 불빛 = candle     🌙 달빛 = moon
//      🌳 뿌리 = root       🍃 바람 = wind
//
// ⚠️ 다 채운 뒤 반드시 한 번 돌리세요:
//      node --experimental-strip-types scripts/check-content.mjs
//    자리 수가 안 맞거나, 없는 스프레드를 가리키거나, 멘트가 비었거나,
//    같은 갈래의 양쪽을 함께 적은 것(flower 와 stone 을 같이)을 잡습니다.
import type { ReadingTopicSlug } from "@/lib/reading-topics"
import type { SpreadId } from "@/lib/content/spreads"
import type { TraitCode } from "@/lib/content/traits"

export interface PreparedQuestion {
  slug: string
  label: string
  traits?: TraitCode[]
  /** 하나 이상. 여럿이면 이 중 하나가 나갑니다 */
  spreads: SpreadId[]
  /** 질문을 고른 직후. 하나 이상 */
  confirms: string[]
  /** 섞는 동안. 하나 이상 */
  shuffles: string[]
  /**
   * 이 질문만 다른 해석 프롬프트를 씁니다.
   * 비워두면 기본(샨티 심리 리딩)입니다.
   */
  readingStyle?: "variety_show"
}

/**
 * 주제마다 열 개.
 *
 * ⚠️ 「그냥 요즘 ~ 전체적으로 궁금해」(slug="general")를 주제마다 하나씩
 *    두세요. 이건 질문을 되읽지 않고 주제를 통째로 보는 자리라 화면이
 *    다르게 다룹니다 — 빠지면 그 주제에 "전체보기"가 사라집니다.
 */
export const PREPARED: Partial<Record<ReadingTopicSlug, PreparedQuestion[]>> = {
  self: [
    // ═══════════════════════════════════════════════════════════════
    // 본보기 — 나머지는 이 모양을 복사해서 채우면 됩니다.
    // ═══════════════════════════════════════════════════════════════
    {
      slug: "current-mind",
      label: "지금 내 마음은 어떤 상태일까?",
      // 🌸 꽃결 · 🕯️ 불빛 — 마음이 먼저 닿고 기척에 놓이는 사람에게 자주
      traits: ["flower", "candle"],
      // 둘 중 하나가 나갑니다. 「마음의 거울」은 달빛·뿌리 쪽에,
      // 「감정의 파도」는 꽃결·바람 쪽에 조금 더 자주 갑니다.
      spreads: ["mirror-5", "wave-3"],
      confirms: [
        "지금의 마음이라... 이 몸이 들여다봐 주지. 마음을 담아 섞어보라냥.",
        "네 안에 무엇이 머물고 있는지 같이 보자꾸나. 마음을 담아 섞어보라냥.",
      ],
      shuffles: [
        "마음이 가는 곳을 따라 천천히 살펴보자냥.",
        "아직 말하지 못한 마음의 이야기도 천천히 들여다보자냥.",
        "잠시 멈춰서 지금의 마음을 바라보는 시간을 가져보라냥.",
        "손끝이 이끄는 카드 속에서 마음의 답을 찾아보자냥.",
      ],
    },
    // ── 여기부터 아홉 개를 더 채웁니다 ─────────────────────────────
    // {
    //   slug: "",
    //   label: "",
    //   traits: [],
    //   spreads: [""],
    //   confirms: [""],
    //   shuffles: [""],
    // },
  ],

  // love: [...],
  // career: [...],
  // money: [...],
  // daily: [...],
  // friend: [...],
}
