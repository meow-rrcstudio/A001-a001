// lib/content/questions/money.ts
// [콘텐츠] 금전운 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const MONEY_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "yearly-money-flow",
    label: "올해 금전운은 어떨까?",
    resonatesWith: ["stone", "root", "moon"],
    spreads: ["money-map-5", "abundance-road-7"],
    confirms: [
      { text: "돈의 흐름은 숫자만이 아니라 선택과 마음의 방향에서도 만들어진다냥. 샨티와 함께 올해의 재물 흐름을 살펴보자냥." },
      { text: "풍요는 준비된 마음과 찾아온 기회가 만나는 순간 시작된다냥. 올해 너에게 필요한 금전의 메시지를 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "current-money-flow",
    label: "지금 나의 재물 흐름은?",
    resonatesWith: ["stone", "root"],
    spreads: ["money-flow-5", "abundance-cycle-6"],
    confirms: [
      { text: "돈의 흐름은 지금 가진 것과 앞으로 만들어갈 가능성을 함께 보여준다냥. 샨티와 함께 현재 재물의 방향을 살펴보자냥." },
      { text: "재물의 흐름을 이해하면 지금 필요한 선택이 조금 더 선명해질 수 있다냥. 너의 금전 에너지를 함께 들여다보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "relationship-with-money",
    label: "내가 돈을 대하는 방식은 어떤 모습일까?",
    resonatesWith: ["stone", "moon"],
    spreads: ["money-and-me-5", "money-mirror-7"],
    confirms: [
      { text: "돈을 대하는 방식에는 내가 중요하게 생각하는 가치와 삶의 태도가 담겨 있다냥. 샨티와 함께 돈과 나의 관계를 살펴보자냥." },
      { text: "재물은 단순히 모으는 것이 아니라 나와 어떤 관계를 맺고 있는지 이해하는 것이 중요하다냥. 지금의 돈 습관을 함께 들여다보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "why-money-not-saving",
    label: "요즘 돈이 잘 모이지 않는 이유는 무엇일까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["money-check-5", "money-habit-7"],
    confirms: [
      { text: "돈이 모이지 않는 이유를 찾는 것은 나를 탓하기 위한 것이 아니라 흐름을 이해하기 위한 과정이다냥. 샨티와 함께 지금의 재물 패턴을 살펴보자냥." },
      { text: "작은 습관과 선택이 모여 돈의 흐름을 만든다냥. 지금 나의 재물을 막는 요소와 새로운 방향을 함께 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "hidden-wealth-luck",
    label: "나의 숨겨진 재물운은 무엇일까?",
    resonatesWith: ["stone", "wind", "moon"],
    spreads: ["wealth-seed-5", "gold-key-7"],
    confirms: [
      { text: "재물운은 단순히 얻는 행운이 아니라 내가 가진 가능성을 발견하고 키워가는 흐름이기도 하다냥. 샨티와 함께 숨겨진 풍요의 씨앗을 찾아보자냥." },
      { text: "이미 가진 재능과 경험 속에 새로운 가치가 숨어 있을 수 있다냥. 너만의 재물 가능성을 함께 들여다보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "new-money-opportunity",
    label: "내게 찾아올 새로운 돈의 기회는 무엇일까?",
    resonatesWith: ["stone", "wind", "candle"],
    spreads: ["gold-gate-5", "wealth-door-7"],
    confirms: [
      { text: "새로운 재물의 기회는 갑자기 나타나는 행운처럼 보이지만, 그동안 쌓아온 경험과 준비 위에서 발견되기도 한다냥. 샨티와 함께 다가오는 가능성을 살펴보자냥." },
      { text: "기회는 발견하는 눈과 움직이는 용기가 만날 때 현실이 된다냥. 너에게 열릴 새로운 재물의 문을 함께 찾아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "investment-new-challenge",
    label: "투자나 새로운 도전을 해도 괜찮을까?",
    resonatesWith: ["stone", "wind"],
    spreads: ["challenge-gate-5", "choice-scale-7"],
    confirms: [
      { text: "새로운 도전은 용기와 준비가 함께할 때 더 좋은 흐름을 만든다냥. 샨티와 함께 지금의 선택을 바라보자냥." },
      { text: "기회 앞에서는 설렘과 신중함이 모두 필요하다냥. 너에게 맞는 방향을 함께 찾아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "what-to-let-go-money",
    label: "돈과 관련해 내가 내려놓아야 할 것은 무엇일까?",
    resonatesWith: ["stone", "wind", "moon"],
    spreads: ["money-burden-5", "tidy-abundance-7"],
    confirms: [
      { text: "돈과의 관계를 돌아보는 것은 더 많이 가지기 위한 것이 아니라, 나에게 필요한 흐름을 만드는 과정이다냥. 샨티와 함께 내려놓아야 할 마음을 살펴보자냥." },
      { text: "때로는 새로운 풍요를 맞이하기 위해 오래된 걱정과 믿음을 비워낼 필요가 있다냥. 가벼워지는 방향을 함께 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "meaning-of-money-in-life",
    label: "내 삶에서 돈은 어떤 의미일까?",
    resonatesWith: ["stone", "root", "moon"],
    spreads: ["money-meaning-5", "abundance-meaning-7"],
    confirms: [
      { text: "돈은 단순한 숫자가 아니라 내가 원하는 삶과 가치를 만들어가는 하나의 도구가 될 수 있다냥. 샨티와 함께 돈과 삶의 관계를 살펴보자냥." },
      { text: "풍요는 얼마나 많이 가지는지가 아니라 무엇을 위해 돈을 사용하는지에서 시작되기도 한다냥. 나만의 풍요의 의미를 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "when-financially-stable",
    label: "재정적으로 언제쯤 안정될까?",
    resonatesWith: ["stone", "root"],
    spreads: ["stable-time-5", "abundance-travel-7"],
    confirms: [
      { text: "재정의 안정은 단순한 날짜보다 지금의 흐름과 선택이 만들어가는 과정이다냥. 샨티와 함께 안정으로 향하는 길을 살펴보자냥." },
      { text: "각자의 풍요에는 저마다의 시간이 있다냥. 지금의 위치와 앞으로 필요한 방향을 함께 들여다보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "money-warning",
    label: "돈 관련해서 지금 가장 조심해야 할 것은?",
    resonatesWith: ["stone", "moon"],
    spreads: ["money-alert-5", "money-balance-7"],
    confirms: [
      { text: "돈과 관련된 주의점은 두려움을 찾기보다 더 나은 선택을 위한 힌트를 발견하는 과정이다냥. 샨티와 함께 지금 필요한 경고의 메시지를 살펴보자냥." },
      { text: "재물을 지키는 지혜는 큰 결정보다 작은 선택에서 시작되기도 한다냥. 지금 조심해야 할 흐름을 함께 알아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "should-i-invest-now",
    label: "지금 투자해도 괜찮을까?",
    resonatesWith: ["stone", "wind", "moon"],
    spreads: ["invest-compass-5", "invest-scale-7"],
    confirms: [
      { text: "투자의 선택은 수익만이 아니라 나의 준비와 방향을 함께 살펴보는 과정이다냥. 샨티와 함께 지금의 투자 흐름을 바라보자냥." },
      { text: "좋은 기회는 준비된 판단과 만날 때 더 큰 의미를 가진다냥. 지금 필요한 균형과 선택의 힌트를 찾아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "which-investment-fits-me",
    label: "난 땅? 집? 주식? 나에게 맞는 투자는?",
    resonatesWith: ["root", "stone"],
    spreads: ["invest-map-6", "three-road-7"],
    confirms: [
      { text: "모든 투자에는 각자의 성향과 맞는 흐름이 있다냥. 샨티와 함께 나에게 어울리는 재물의 길을 찾아보자냥." },
      { text: "투자의 선택은 정답보다 나의 가치와 성향을 이해하는 것에서 시작된다냥. 나만의 풍요로운 방향을 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
]
