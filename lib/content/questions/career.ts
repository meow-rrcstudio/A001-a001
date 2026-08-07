// lib/content/questions/career.ts
// [콘텐츠] 직업·커리어운 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const CAREER_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "work-hard-reason",
    label: "요즘 내 일이 힘든 이유는 무엇일까?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["work-weight-5", "career-shadow-6"],
    confirms: [
      { text: "일이 힘들게 느껴지는 순간에는 보이지 않는 마음의 신호가 숨어 있을 수 있다냥. 샨티와 함께 지금의 무게가 어디에서 오는지 살펴보자냥." },
      { text: "열심히 버티는 것만큼 내가 왜 지쳐 있는지 알아보는 것도 중요하다냥. 지금 일 속에 숨은 이야기를 함께 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "job-change-decision",
    label: "지금 이직하는 것이 좋을까?",
    resonatesWith: ["stone", "wind", "candle"],
    spreads: ["crossroad-5", "career-dir-6"],
    confirms: [
      { text: "변화 앞에서는 떠나야 할 이유와 남아야 할 이유가 함께 보인다냥. 샨티와 함께 지금 너에게 필요한 선택의 방향을 살펴보자냥." },
      { text: "이직은 새로운 시작이면서 지금까지의 나를 돌아보는 시간이기도 하다냥. 마음과 현실 사이의 답을 함께 찾아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "suitable-career",
    label: "나에게 잘 맞는 직업은 무엇일까?",
    resonatesWith: ["root", "flower", "candle"],
    spreads: ["my-path-5", "talent-compass-7"],
    confirms: [
      { text: "모든 사람에게는 자신만의 방식으로 빛나는 일이 있다냥. 샨티와 함께 너의 재능과 어울리는 길을 찾아보자냥." },
      { text: "좋은 직업은 잘하는 일과 마음이 향하는 곳이 만나는 자리일지도 모른다냥. 지금 너에게 맞는 방향을 함께 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "stay-current-job",
    label: "현재 직장 계속 다니는 것이 맞을까?",
    resonatesWith: ["stone", "root"],
    spreads: ["stay-or-go-5", "career-fork-6"],
    confirms: [
      { text: "머무름과 변화 사이에는 언제나 나만의 이유가 숨어 있다냥. 샨티와 함께 지금 커리어가 보내는 신호를 살펴보자냥." },
      { text: "어떤 선택이든 중요한 것은 내가 어떤 방향으로 성장하고 싶은지 아는 것이다냥. 지금 너에게 맞는 길을 함께 찾아보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "doing-well-in-my-place",
    label: "지금 내 자리에서 잘하고 있을까?",
    resonatesWith: ["root", "flower", "candle"],
    spreads: ["my-seat-5", "growth-tree-7"],
    confirms: [
      { text: "우리는 때때로 잘하고 있으면서도 스스로 알아차리지 못한다냥. 샨티와 함께 지금 네 자리에서 빛나는 모습을 찾아보자냥." },
      { text: "성장은 부족함을 찾는 것만이 아니라 이미 가진 힘을 발견하는 과정이기도 하다냥. 지금 너의 가능성을 함께 살펴보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "hidden-career-talent",
    label: "미처 몰랐던 나의 직업적 재능은 무엇일까?",
    resonatesWith: ["root", "flower", "moon"],
    spreads: ["hidden-talent-5", "talent-map-7"],
    confirms: [
      { text: "가끔 가장 가까이에 있는 재능일수록 스스로 발견하기 어렵다냥. 샨티와 함께 네 안에 숨어 있던 힘을 찾아보자냥." },
      { text: "모든 사람에게는 자신만의 방식으로 빛나는 능력이 있다냥. 지금까지 보지 못했던 너의 가능성을 만나보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "workplace-position",
    label: "직장 안에서 나의 위치는 어떤 모습일까?",
    resonatesWith: ["root", "stone", "moon"],
    spreads: ["org-seat-5", "org-mirror-6"],
    confirms: [
      { text: "우리는 때때로 내가 차지하고 있는 자리를 스스로 작게 바라보기도 한다냥. 샨티와 함께 조직 속 너의 모습을 살펴보자냥." },
      { text: "직장 안에서의 나의 가치는 직책만으로 정해지지 않는다냥. 지금 네가 만들어내고 있는 의미를 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "career-needs",
    label: "내 커리어에 필요한 것은 무엇일까?",
    resonatesWith: ["root", "moon"],
    spreads: ["career-compass-5", "growth-stair-7"],
    confirms: [
      { text: "커리어의 방향은 빠르게 찾는 답보다 나에게 맞는 길을 발견하는 과정이다냥. 샨티와 함께 지금 필요한 것을 찾아보자냥." },
      { text: "지금의 경험은 앞으로의 길을 만드는 작은 씨앗이 된다냥. 너의 성장을 위해 필요한 메시지를 함께 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "future-career-direction",
    label: "앞으로 커리어 방향은 어떻게 잡아야 할까?",
    resonatesWith: ["wind", "moon"],
    spreads: ["career-north-5", "future-road-7"],
    confirms: [
      { text: "커리어의 길은 정답을 찾는 것이 아니라 나에게 맞는 방향을 만들어가는 과정이다냥. 샨티와 함께 앞으로의 길을 살펴보자냥." },
      { text: "지금까지 쌓아온 경험은 새로운 방향을 만드는 든든한 기반이 된다냥. 앞으로 펼쳐질 가능성을 함께 만나보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "promotion-opportunity",
    label: "승진이나 좋은 기회가 올까?",
    resonatesWith: ["flower", "root", "candle"],
    spreads: ["chance-gate-5", "star-stair-7"],
    confirms: [
      { text: "기회는 준비된 마음과 만나는 순간 새로운 길이 되기도 한다냥. 샨티와 함께 지금 너에게 다가오는 가능성을 살펴보자냥." },
      { text: "성장은 갑자기 찾아오는 행운만이 아니라 지금까지 쌓아온 시간이 만들어내는 흐름이기도 하다냥. 앞으로의 기회를 함께 바라보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "boss-view-of-me",
    label: "상사는 날 어떤 팀원으로 생각할까?",
    resonatesWith: ["moon", "root", "stone"],
    spreads: ["boss-gaze-5", "leader-eval-6"],
    confirms: [
      { text: "가끔 우리는 다른 사람의 시선 속에 비친 나의 모습을 궁금해한다냥. 샨티와 함께 상사가 바라보는 너의 모습을 살펴보자냥." },
      { text: "평가는 하나의 시선일 뿐이지만, 그 안에는 내가 가진 강점과 가능성을 발견하는 힌트가 있을 수 있다냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "new-career-path",
    label: "새로운 직업을 갖는다면 어떤 거?",
    resonatesWith: ["root", "moon"],
    spreads: ["new-road-5", "fate-job-7"],
    confirms: [
      { text: "새로운 길은 지금까지 쌓아온 경험 위에 또 다른 가능성을 더하는 여행이다냥. 샨티와 함께 너에게 어울리는 직업의 모습을 찾아보자냥." },
      { text: "마음이 끌리는 일 속에는 아직 발견하지 못한 나의 재능이 숨어 있을지도 모른다냥. 새로운 가능성을 함께 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "workplace-perception",
    label: "직장에서 날 어떻게 보고 있을까?",
    resonatesWith: ["moon", "root"],
    spreads: ["work-mirror-5", "org-gaze-6"],
    confirms: [
      { text: "우리는 가끔 다른 사람의 눈에 비친 나의 모습을 궁금해한다냥. 샨티와 함께 직장 속 너의 모습을 들여다보자냥." },
      { text: "타인의 시선 속에는 내가 미처 발견하지 못한 나의 강점과 가능성이 숨어 있을 수 있다냥." },
    ],
    shuffleStyle: "toward",
  },
]
