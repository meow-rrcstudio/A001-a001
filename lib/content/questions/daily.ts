// lib/content/questions/daily.ts
// [콘텐츠] 일상에 대한 이야기 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const DAILY_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "today-flow",
    label: "오늘 하루는 어떻게 흘러갈까?",
    resonatesWith: ["wind", "candle"],
    spreads: ["day-flow-3", "day-path-3"],
    confirms: [
      { text: "하루는 작은 순간들이 모여 하나의 이야기가 된다냥. 샨티와 함께 오늘의 흐름을 살펴보자냥." },
      { text: "아직 펼쳐지지 않은 오늘의 장면들이 기다리고 있다냥. 천천히 카드를 섞으며 하루의 이야기를 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "today-luck",
    label: "오늘 나에게 찾아올 작은 행운은 무엇일까?",
    resonatesWith: ["wind", "flower", "candle"],
    spreads: ["luck-find-3", "day-gift-3"],
    confirms: [
      { text: "행운은 언제나 커다란 모습으로 찾아오지는 않는다냥. 샨티와 함께 오늘 숨어 있는 작은 선물을 찾아보자냥." },
      { text: "작은 순간 하나가 하루의 빛이 되기도 한다냥. 오늘 너에게 찾아올 좋은 흐름을 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "energy-flow",
    label: "요즘 나의 에너지는 어디로 흘러가고 있을까?",
    resonatesWith: ["wind", "candle"],
    spreads: ["energy-5", "ripple-3"],
    confirms: [
      { text: "마음과 에너지는 언제나 어딘가를 향해 흐르고 있다냥. 샨티와 함께 지금 너의 힘이 머무는 곳을 살펴보자냥." },
      { text: "어디에 에너지를 쓰고 있는지는 지금의 삶을 비추는 작은 거울이 된다냥. 너의 흐름을 천천히 들여다보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "why-tired",
    label: "요즘 왜 이렇게 지칠까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["tired-root-3", "tired-weight-3"],
    confirms: [
      { text: "지침은 마음이 보내는 작은 신호일지도 모른다냥. 샨티와 함께 지금 너를 힘들게 하는 이야기를 살펴보자냥." },
      { text: "오래 걸어온 마음에는 쉬어갈 시간이 필요하다냥. 지금의 피로가 전하는 메시지를 천천히 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "if-i-were-object",
    label: "내가 물건이라면?",
    resonatesWith: ["flower", "moon"],
    spreads: ["object-3", "symbol-5"],
    confirms: [
      { text: "모든 존재에는 저마다의 모습과 이야기가 담겨 있다냥. 샨티와 함께 너를 닮은 특별한 상징을 찾아보자냥." },
      { text: "가끔 다른 시선으로 나를 바라보면 새로운 모습이 보이기도 한다냥. 너라는 존재의 이야기를 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "today-caution",
    label: "오늘 하루 조심해야 할 것은?",
    resonatesWith: ["moon", "wind"],
    spreads: ["caution-3", "day-balance-4"],
    confirms: [
      { text: "모든 하루에는 살펴보면 좋은 작은 신호가 있다냥. 샨티와 함께 오늘 조심하면 좋을 마음의 결을 찾아보자냥." },
      { text: "조심한다는 건 두려워하는 것이 아니라 나를 돌보는 방법이다냥. 오늘의 흐름을 천천히 들여다보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "week-flow",
    label: "이번 주 전체 흐름이 궁금해",
    resonatesWith: ["wind", "candle"],
    spreads: ["week-7", "week-compass-5"],
    confirms: [
      { text: "한 주라는 시간도 작은 이야기들이 모여 하나의 흐름이 된다냥. 샨티와 함께 이번 주의 길을 살펴보자냥." },
      { text: "아직 펼쳐지지 않은 일주일의 장면들이 기다리고 있다냥. 천천히 카드를 섞으며 주간의 흐름을 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "hidden-happiness",
    label: "요즘 내가 놓치고 있는 작은 행복은 무엇일까?",
    resonatesWith: ["flower", "wind", "moon"],
    spreads: ["happy-find-3", "daily-treasure-3"],
    confirms: [
      { text: "행복은 언제나 커다란 모습으로 찾아오지는 않는다냥. 샨티와 함께 이미 곁에 있는 작은 기쁨을 찾아보자냥." },
      { text: "가끔 가장 가까운 곳에 있는 행복을 놓치기도 한다냥. 오늘 너에게 숨겨진 작은 선물을 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "environment-message",
    label: "나를 둘러싼 환경은 나에게 무엇을 말하고 있을까?",
    resonatesWith: ["root", "moon"],
    spreads: ["env-6", "scenery-5"],
    confirms: [
      { text: "우리가 머무는 곳에는 언제나 작은 이야기가 흐르고 있다냥. 샨티와 함께 주변이 보내는 신호를 살펴보자냥." },
      { text: "때로는 나를 둘러싼 풍경이 마음보다 먼저 답을 알려주기도 한다냥. 지금 네 곁의 메시지를 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "new-experience",
    label: "요즘 내 삶에 필요한 새로운 경험은 무엇일까?",
    resonatesWith: ["wind", "flower", "candle"],
    spreads: ["newdoor-3", "adventure-7"],
    confirms: [
      { text: "삶은 작은 새로운 경험들로 조금씩 넓어지기도 한다냥. 샨티와 함께 지금 너에게 필요한 새로운 문을 찾아보자냥." },
      { text: "익숙한 길 밖에도 너를 기다리는 이야기가 있다냥. 어떤 경험이 너를 성장시킬지 함께 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "small-opportunity",
    label: "지금 내 앞에 펼쳐진 작은 기회는 무엇일까?",
    resonatesWith: ["wind", "flower", "candle"],
    spreads: ["chance-seed-3", "open-door-4"],
    confirms: [
      { text: "기회는 언제나 큰 모습으로 찾아오지는 않는다냥. 샨티와 함께 지금 네 곁에 피어난 작은 가능성을 찾아보자냥." },
      { text: "가끔 스쳐 지나가는 순간 속에 새로운 길이 숨어 있다냥. 지금 너에게 열린 문을 함께 바라보자냥." },
    ],
    shuffleStyle: "focus",
  },
]
