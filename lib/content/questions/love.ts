// lib/content/questions/love.ts
// [콘텐츠] 연애운 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const LOVE_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "future-love",
    label: "앞으로 내게 찾아올 인연은 어떤 모습일까?",
    resonatesWith: ["flower", "moon", "wind"],
    spreads: ["fate-portrait-5", "love-path-7"],
    confirms: [
      { text: "인연은 언제나 예상하지 못한 모습으로 찾아오기도 한다냥. 샨티와 함께 너에게 다가올 사랑의 모습을 살펴보자냥." },
      { text: "새로운 만남에는 아직 펼쳐지지 않은 이야기가 담겨 있다냥. 어떤 인연이 너를 찾아올지 함께 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "self-in-love",
    label: "나는 사랑할 때 어떤 사람이 될까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["love-mirror-5", "love-grain-3"],
    confirms: [
      { text: "사랑할 때의 모습은 평소와 또 다른 너의 이야기를 들려준다냥. 샨티와 함께 사랑 속에서 피어나는 너의 모습을 만나보자냥." },
      { text: "누군가를 사랑하는 순간, 마음속에 숨겨진 결이 드러나기도 한다냥. 너만의 사랑 방식을 천천히 살펴보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "hidden-love-signal",
    label: "지금 내 주변에 숨겨진 인연의 신호는 무엇일까?",
    resonatesWith: ["flower", "moon", "wind"],
    spreads: ["love-signal-4", "meeting-guide-5"],
    confirms: [
      { text: "인연은 언제나 큰 소리로 찾아오지 않고 작은 신호로 다가오기도 한다냥. 샨티와 함께 네 주변에 머무는 이야기를 살펴보자냥." },
      { text: "스쳐 지나가는 순간 속에도 새로운 연결의 시작이 숨어 있을 수 있다냥. 지금 너에게 오는 인연의 기척을 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "future-person-energy",
    label: "내가 만나게 될 사람은 어떤 에너지를 가진 사람일까?",
    resonatesWith: ["flower", "moon"],
    spreads: ["person-energy-4", "two-souls-5"],
    confirms: [
      { text: "사람은 저마다 고유한 빛과 결을 가지고 있다냥. 샨티와 함께 앞으로 만나게 될 인연의 에너지를 살펴보자냥." },
      { text: "어떤 사람은 말보다 분위기로 먼저 다가오기도 한다냥. 너와 이어질 인연의 모습을 천천히 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "love-to-receive",
    label: "나는 어떤 사랑을 받아야 행복할까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["love-warmth-5", "love-petal-3"],
    confirms: [
      { text: "사랑은 많이 받는 것보다 나에게 맞는 온기를 만나는 것이 중요하다냥. 샨티와 함께 네 마음이 원하는 사랑의 모습을 찾아보자냥." },
      { text: "모든 마음에는 자신에게 맞는 사랑의 결이 있다냥. 너를 행복하게 하는 사랑이 무엇인지 천천히 살펴보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "thinking-of-me",
    label: "그 사람은 지금 나를 생각하고 있을까?",
    resonatesWith: ["moon", "flower", "root"],
    spreads: ["wavelength-3", "unseen-heart-5"],
    confirms: [
      { text: "마음은 눈에 보이지 않아도 작은 흔적을 남긴다냥. 샨티와 함께 두 사람 사이에 흐르는 마음의 결을 살펴보자냥." },
      { text: "누군가를 떠올리는 순간에는 말하지 못한 이야기들이 머물기도 한다냥. 지금 너와 그 사람 사이의 흐름을 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "meaning-of-person",
    label: "그 사람은 나에게 어떤 의미일까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["relation-meaning-5", "soul-meet-6"],
    confirms: [
      { text: "어떤 사람은 우리 삶에 머물며 하나의 이야기를 남기기도 한다냥. 샨티와 함께 그 사람이 너에게 가진 의미를 천천히 살펴보자냥." },
      { text: "모든 만남에는 저마다의 이유와 배움이 담겨 있다냥. 지금 너와 그 사람 사이의 특별한 결을 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "who-loves-more",
    label: "내가 더? 아님 상대가 날 더?",
    resonatesWith: ["flower", "moon"],
    spreads: ["heart-scale-3", "heart-distance-5"],
    confirms: [
      { text: "마음의 크기는 언제나 같은 모양으로 보이지 않는다냥. 샨티와 함께 두 사람 사이에 흐르는 마음의 균형을 살펴보자냥." },
      { text: "누군가는 표현으로, 누군가는 조용한 행동으로 마음을 전하기도 한다냥. 두 마음이 어떻게 닿아 있는지 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "dating-potential",
    label: "썸이 연애로 이어질 가능성은?",
    resonatesWith: ["flower", "moon", "wind"],
    spreads: ["love-chance-5", "two-path-7"],
    confirms: [
      { text: "두 마음이 가까워지는 과정에는 설렘과 작은 신호들이 함께 있다냥. 샨티와 함께 이 관계가 향하는 흐름을 살펴보자냥." },
      { text: "모든 인연은 천천히 피어나는 시간이 필요하다냥. 지금 두 사람 사이에 흐르는 가능성을 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "love-is-it-okay",
    label: "이 사랑, 이대로 괜찮은 걸까?",
    resonatesWith: ["flower", "moon"],
    spreads: ["love-balance-5", "relation-flow-6"],
    confirms: [
      { text: "사랑은 설렘만으로 이어지는 것이 아니라 서로의 마음을 살피는 시간이기도 하다냥. 샨티와 함께 지금 이 사랑의 모습을 들여다보자냥." },
      { text: "마음이 흔들릴 때는 관계를 끝내기보다 먼저 그 안의 이야기를 바라보는 시간이 필요하다냥. 지금 너의 사랑이 전하는 신호를 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "relationship-direction",
    label: "우리 관계는 지금 어떤 방향으로 가고 있을까?",
    resonatesWith: ["flower", "wind", "moon"],
    spreads: ["relation-flow-6", "love-path-7"],
    confirms: [
      { text: "모든 관계에는 저마다의 속도와 흐름이 있다냥. 샨티와 함께 지금 두 사람 사이에 흐르는 방향을 살펴보자냥." },
      { text: "관계의 미래는 정해진 답보다 서로가 만들어가는 이야기 속에 있다냥. 지금의 흐름이 전하는 의미를 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "contact-now",
    label: "지금 연락해도 괜찮을까?",
    resonatesWith: ["moon", "wind"],
    spreads: ["love-timing-3", "heart-door-4"],
    confirms: [
      { text: "마음을 전하고 싶은 순간에는 작은 용기가 필요하다냥. 샨티와 함께 지금 두 사람 사이의 흐름을 살펴보자냥." },
      { text: "때로는 기다림도, 다가감도 모두 마음을 전하는 방법이다냥. 지금 너에게 맞는 방향을 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "dating-show",
    label: "내가 연애 프로그램에 나간다면?",
    resonatesWith: ["flower", "candle", "wind"],
    spreads: ["show-lead-5", "show-stage-7"],
    confirms: [
      { text: "누구에게나 자신만의 매력이 빛나는 순간이 있다냥. 샨티와 함께 새로운 무대 위의 너를 만나보자냥." },
      { text: "사람을 만나는 순간마다 새로운 모습의 내가 피어나기도 한다냥. 너의 매력이 어떻게 펼쳐질지 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "past-love-message",
    label: "과거의 사랑이 지금 내게 남긴 메시지는 무엇일까?",
    resonatesWith: ["moon", "root", "flower"],
    spreads: ["past-trace-5", "heart-season-4"],
    confirms: [
      { text: "지나간 사랑도 마음속에 하나의 이야기를 남긴다냥. 샨티와 함께 그 시간이 지금의 너에게 전하는 메시지를 살펴보자냥." },
      { text: "모든 만남에는 떠나간 뒤에도 남는 의미가 있다냥. 과거의 사랑이 건네는 작은 이야기를 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "release-in-love",
    label: "내가 사랑에서 내려놓아야 할 것은 무엇일까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["love-burden-5", "love-tidy-4"],
    confirms: [
      { text: "사랑은 채우는 것만큼 비워내는 것도 중요하다냥. 샨티와 함께 지금 네 마음이 가벼워질 길을 찾아보자냥." },
      { text: "때로는 놓아주는 순간 새로운 사랑이 들어올 자리가 생긴다냥. 너의 마음을 조용히 정리해보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "general",
    label: "그냥 사랑에 대해 전반적으로 궁금해",
    resonatesWith: ["flower", "moon"],
    spreads: ["love-now-1", "love-three-3"],
    confirms: [
      { text: "사랑은 누군가를 만나는 것뿐 아니라 내가 사랑을 받아들이고 표현하는 방식까지 담고 있다냥. 샨티와 함께 지금의 사랑 흐름을 살펴보자냥." },
      { text: "사랑의 계절은 각자 다른 속도로 찾아온다냥. 지금의 마음과 앞으로 열릴 가능성을 함께 들여다보자냥." },
    ],
    shuffleStyle: "gentle",
  },
]
