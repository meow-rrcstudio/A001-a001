// lib/content/questions/self.ts
// [콘텐츠] 나 자신에 대한 이야기 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const SELF_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "emotion-reason",
    label: "내가 지금 느끼는 감정의 이유는 무엇일까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["mirror-reason-5", "wave-reason-3"],
    confirms: [
      { text: "지금 느끼는 감정 뒤에는 어떤 이야기가 숨어 있을까냥. 샨티와 함께 천천히 들여다보자냥." },
      { text: "마음은 언제나 이유 없이 흔들리지 않는다냥. 지금 너의 마음이 전하는 이야기를 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "current-mind",
    label: "지금 내 마음은 어떤 상태일까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["mirror-now-5", "wave-now-3"],
    confirms: [
      { text: "지금 네 마음은 어떤 이야기를 품고 있을까냥. 샨티와 함께 조용히 들여다보자냥." },
      { text: "마음은 언제나 작은 신호를 보내고 있다냥. 지금 너에게 찾아온 마음의 이야기를 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "what-i-need-now",
    label: "지금 가장 필요로 하는 것은 무엇일까?",
    resonatesWith: ["flower", "moon", "wind"],
    spreads: ["need-compass-5", "need-balance-4"],
    confirms: [
      { text: "지금 너에게 필요한 것은 무엇일까냥. 샨티와 함께 마음이 보내는 신호를 찾아보자냥." },
      { text: "마음은 언제나 필요한 것을 조용히 알려준다냥. 지금 너를 위한 작은 답을 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "hidden-self",
    label: "내가 미처 알아차리지 못한 내 모습은 무엇일까?",
    resonatesWith: ["moon", "root", "flower"],
    spreads: ["hidden-mirror-5", "hidden-treasure-3"],
    confirms: [
      { text: "너 안에는 아직 발견하지 못한 모습이 머물고 있을지도 모른다냥. 샨티와 함께 숨겨진 이야기를 찾아보자냥." },
      { text: "가끔 가장 가까운 나 자신을 가장 늦게 알아차리기도 한다냥. 지금 너 안의 새로운 모습을 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "my-hero",
    label: "내가 히어로가 된다면 누구?",
    resonatesWith: ["flower", "candle", "wind"],
    spreads: ["hero-5", "hero-talent-3"],
    confirms: [
      { text: "누구에게나 자신만의 특별한 힘이 숨어 있다냥. 샨티와 함께 너만의 히어로 모습을 찾아보자냥." },
      { text: "가끔 가장 평범해 보이는 곳에 가장 빛나는 힘이 숨어 있다냥. 너만의 이야기를 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "hidden-strength",
    label: "내 안에 숨겨진 나의 힘은 무엇일까?",
    resonatesWith: ["flower", "candle", "root"],
    spreads: ["strength-mirror-5", "potential-3"],
    confirms: [
      { text: "모든 마음에는 아직 발견하지 못한 힘이 숨어 있다냥. 샨티와 함께 너만의 빛을 찾아보자냥." },
      { text: "너도 모르게 자라난 힘이 있을지도 모른다냥. 지금까지의 너를 천천히 돌아보며 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "what-drains-me",
    label: "요즘 나를 지치게 하는 것은 무엇일까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["drain-weight-5", "drain-flow-3"],
    confirms: [
      { text: "지친 마음에는 언제나 이유가 숨어 있다냥. 샨티와 함께 지금 너를 무겁게 하는 이야기를 찾아보자냥." },
      { text: "마음이 힘들다고 느껴질 때는 먼저 무엇이 나를 지치게 하는지 바라보는 시간이 필요하다냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "release-and-hold",
    label: "내가 보내야 할 것, 잡아야 할 것은 무엇일까?",
    resonatesWith: ["flower", "wind"],
    spreads: ["release-mirror-5", "release-tidy-4"],
    confirms: [
      { text: "마음에는 떠나보낼 것과 끝까지 품고 갈 것이 함께 있다냥. 샨티와 함께 너에게 필요한 선택을 찾아보자냥." },
      { text: "무언가를 놓는다는 건 새로운 것을 위한 자리를 만드는 일이기도 하다냥. 지금 너의 마음을 천천히 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "who-am-i",
    label: "나는 어떤 사람으로 살아가고 있을까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["selfshape-mirror-5", "selfshape-grain-3"],
    confirms: [
      { text: "가끔 가장 가까운 나 자신을 가장 천천히 알아가기도 한다냥. 샨티와 함께 지금의 너를 바라보자냥." },
      { text: "너라는 이야기는 매일 조금씩 만들어지고 있다냥. 지금 어떤 모습으로 살아가고 있는지 함께 살펴보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "coming-change",
    label: "나는 어떤 변화를 앞두고 있을까?",
    resonatesWith: ["wind", "flower"],
    spreads: ["change-door-5", "change-path-3"],
    confirms: [
      { text: "변화는 언제나 새로운 이야기가 시작되는 문이기도 하다냥. 샨티와 함께 너에게 다가오는 흐름을 살펴보자냥." },
      { text: "아직 모습을 드러내지 않은 변화가 너를 기다리고 있을지도 모른다냥. 마음을 열고 새로운 길을 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "soul-message",
    label: "내 영혼이 지금 나에게 전하고 싶은 메시지는 무엇일까?",
    resonatesWith: ["moon", "root"],
    spreads: ["soul-letter-5", "soul-echo-3"],
    confirms: [
      { text: "가장 깊은 곳의 마음은 언제나 조용한 목소리로 이야기하고 있다냥. 샨티와 함께 지금 너에게 오는 메시지를 들어보자냥." },
      { text: "때로는 답을 찾기보다 내 안의 목소리를 바라보는 시간이 필요하다냥. 너의 영혼이 전하는 이야기를 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "near-future-me",
    label: "가까운 미래의 나는 어떤 모습일까?",
    resonatesWith: ["moon", "root"],
    spreads: ["future-letter-5", "future-echo-3"],
    confirms: [
      { text: "아직 오지 않은 너의 모습에도 지금의 마음이 이어져 있다냥. 샨티와 함께 다가올 너를 바라보자냥." },
      { text: "때로는 답을 찾기보다 내 안의 이야기를 바라보는 시간이 필요하다냥. 지금 너의 영혼이 전하는 마음을 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
]
