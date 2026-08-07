// lib/content/questions/self.ts
// [콘텐츠] 나 자신에 대한 이야기 — 열 개.
//
// ┌─ 채우는 법 ───────────────────────────────────────────────────────
// │ slug           영문 소문자·숫자·하이픈. 이 주제 안에서 안 겹치게
// │ label          사람이 보는 질문
// │ resonatesWith  이 질문이 어울리는 사람. 뚜렷하게 기우는 것만
// │ spreads        쓸 배열 id (lib/content/spreads.ts). 하나 이상
// │ confirms       질문을 고른 직후의 말. **질문마다 직접 씁니다**
// │                질문을 되읽는 자리라 공용으로 만들면 무슨 질문이든
// │                같은 틀이 됩니다. 여러 개면 그중 하나가 나갑니다
// │ shuffleStyle   섞기 멘트를 어느 결에서 꺼낼까 (풀에서 꺼냅니다)
// │                gentle(내면·감정) · focus(선택·때) · toward(관계)
// │
// │ shuffles 는 대개 안 적습니다 — 풀에서 알아서 꺼냅니다.
// └──────────────────────────────────────────────────────────────────
//
// 성향 코드 — 이모지가 아니라 글자입니다 (lib/content/traits.ts)
//   🌸 꽃결 flower   🪨 돌결 stone
//   🕯️ 불빛 candle   🌙 달빛 moon
//   🌳 뿌리 root     🍃 바람 wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const SELF_QUESTIONS: PreparedQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // 본보기 ① — 확정 멘트 둘에 성향을 달아 사람마다 갈리게 한 경우
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "current-mind",
    label: "지금 내 마음은 어떤 상태일까?",
    resonatesWith: ["flower", "candle"],
    spreads: ["mirror-5", "wave-3"],
    confirms: [
      // 🕯️ 불빛 — 기척에 마음이 놓이는 쪽에는 곁에 있겠다는 말로
      {
        text: "지금의 마음이라... 이 몸이 곁에서 들여다봐 주지. 마음을 담아 섞어보라냥.",
        resonatesWith: ["candle"],
      },
      // 🌙 달빛 — 혼자일 때 마음이 개는 쪽에는 조용히 물러서는 말로
      {
        text: "네 안에 무엇이 머물고 있는지 천천히 보자꾸나. 마음을 담아 섞어보라냥.",
        resonatesWith: ["moon"],
      },
    ],
    shuffleStyle: "gentle",
  },

  // ═══════════════════════════════════════════════════════════════
  // 본보기 ② — 확정 멘트 하나뿐인 경우. 이쪽이 보통입니다.
  // 섞기 멘트는 안 적었으니 gentle 풀에서 꺼내 갑니다.
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "emotion-reason",
    label: "내가 지금 느끼는 감정의 이유는 무엇일까?",
    // 🪨 버티고 쌓인 것 · 🌙 숨은 감정 · 🌳 까닭 찾기
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["mirror-5"],
    confirms: [
      { text: "겉으로 보이는 마음 너머에 어떤 이야기가 숨어 있는지 같이 살펴보자냥." },
    ],
    shuffleStyle: "gentle",
  },

  // ── 여기부터 여덟 개를 더 채웁니다 ─────────────────────────────
  // {
  //   slug: "",
  //   label: "",
  //   resonatesWith: [],
  //   spreads: [""],
  //   confirms: [{ text: "" }],
  //   shuffleStyle: "gentle",
  // },
  //
  // ⚠️ 「그냥 요즘 나에 대해 전체적으로 보고 싶어」(slug: "general")를
  //    꼭 하나 두세요. 질문을 되읽지 않고 주제를 통째로 보는 자리라
  //    화면이 다르게 다룹니다 — 빠지면 이 주제에 전체보기가 사라집니다.
]
