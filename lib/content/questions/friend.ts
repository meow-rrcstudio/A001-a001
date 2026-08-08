// lib/content/questions/friend.ts
// [콘텐츠] 친구에 대한 이야기 — 준비된 질문.
//
// 채우는 법은 lib/content/question-type.ts 머리말을 보세요.
// 성향 코드: 🌸flower 🪨stone · 🕯️candle 🌙moon · 🌳root 🍃wind
//
// 다 채운 뒤: node --experimental-strip-types scripts/check-content.mjs
import type { PreparedQuestion } from "@/lib/content/question-type"

export const FRIEND_QUESTIONS: PreparedQuestion[] = [
  {
    slug: "meaning-of-friends",
    label: "지금 내 곁에 있는 친구들은 나에게 어떤 의미일까?",
    resonatesWith: ["flower", "moon", "root"],
    spreads: ["friend-mirror-5", "walk-together-3"],
    confirms: [
      { text: "어떤 인연은 오래 머물며 조용한 빛이 되어준다냥. 샨티와 함께 지금 네 곁의 우정이 가진 의미를 살펴보자냥." },
      { text: "사람과 사람 사이에는 눈에 보이지 않는 특별한 결이 있다냥. 지금 이어진 친구들의 이야기를 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "best-match-friend",
    label: "나와 가장 잘 맞는 친구는 어떤 사람일까?",
    resonatesWith: ["flower", "moon", "wind"],
    spreads: ["friend-grain-4", "bloom-together-3"],
    confirms: [
      { text: "모든 사람에게는 마음이 편안하게 머무는 인연이 있다냥. 샨티와 함께 너와 잘 맞는 우정의 결을 찾아보자냥." },
      { text: "좋은 친구란 서로를 바꾸기보다 있는 그대로 빛나게 해주는 존재다냥. 너에게 맞는 인연의 모습을 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "awkward-reason",
    label: "요즘 어색해진 이유가 뭘까?",
    resonatesWith: ["moon", "root", "stone"],
    spreads: ["drift-5", "relation-hidden-6"],
    confirms: [
      { text: "가까웠던 사이일수록 작은 변화도 마음에 남는다냥. 샨티와 함께 두 사람 사이에 생긴 거리의 이유를 천천히 살펴보자냥." },
      { text: "모든 어색함에는 보이지 않는 이야기가 숨어 있다냥. 지금 관계가 보내는 신호를 함께 들여다보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "say-hurt-feelings",
    label: "서운한 걸 말해도 될까?",
    resonatesWith: ["flower", "moon"],
    spreads: ["courage-4", "dialogue-5"],
    confirms: [
      { text: "마음을 전하는 일에는 작은 용기가 필요하다냥. 샨티와 함께 이 마음을 어떻게 건네면 좋을지 살펴보자냥." },
      { text: "서운함은 관계를 끝내는 감정이 아니라 더 잘 이해하고 싶은 마음일 수도 있다냥. 두 마음이 만나는 방법을 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "relationship-distance",
    label: "이 관계, 거리를 어떻게 두는 게 좋을까?",
    resonatesWith: ["stone", "moon", "wind"],
    spreads: ["distance-tune-4", "relation-balance-6"],
    confirms: [
      { text: "모든 관계에는 가까워지는 시간과 잠시 거리를 두는 시간이 있다냥. 샨티와 함께 지금 너에게 맞는 관계의 거리를 찾아보자냥." },
      { text: "좋은 관계는 붙잡는 것만으로 이어지지 않는다냥. 나를 지키면서 이어가는 방법을 함께 살펴보자냥." },
    ],
    shuffleStyle: "focus",
  },
  {
    slug: "my-place-in-friendship",
    label: "나는 친구에게 어떤 존재일까?",
    resonatesWith: ["flower", "moon"],
    spreads: ["friend-seat-5", "mutual-light-3"],
    confirms: [
      { text: "우리는 누군가의 마음속에 생각보다 특별한 모습으로 남아 있기도 한다냥. 샨티와 함께 네가 친구에게 어떤 존재인지 살펴보자냥." },
      { text: "친구라는 인연은 서로의 삶에 작은 흔적을 남긴다냥. 지금 너의 우정 속 자리를 함께 들여다보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "new-person-relationship",
    label: "새로운 사람과 잘 지낼 수 있을까?",
    resonatesWith: ["flower", "wind", "candle"],
    spreads: ["newfriend-door-4", "meeting-flow-5"],
    confirms: [
      { text: "새로운 인연은 새로운 나의 모습을 만나게 하는 문이기도 하다냥. 샨티와 함께 이 만남의 흐름을 살펴보자냥." },
      { text: "모든 관계는 작은 첫걸음에서 시작된다냥. 새로운 사람과 만들어갈 이야기를 함께 들여다보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "people-stress-reason",
    label: "요즘 사람 때문에 스트레스 받는 이유는?",
    resonatesWith: ["stone", "moon", "root"],
    spreads: ["relation-weight-5", "relation-shadow-6"],
    confirms: [
      { text: "사람 사이의 어려움은 때로 내 마음이 보내는 신호이기도 하다냥. 샨티와 함께 지금의 관계 속 이야기를 천천히 살펴보자냥." },
      { text: "누군가 때문에 힘든 순간에는 그 관계보다 먼저 내 마음을 바라보는 시간이 필요하다냥. 지금 너에게 필요한 답을 찾아보자냥." },
    ],
    shuffleStyle: "gentle",
  },
  {
    slug: "future-new-friend",
    label: "앞으로 내 삶에 들어올 새로운 친구는 어떤 모습일까?",
    resonatesWith: ["flower", "wind", "candle"],
    spreads: ["newfriend-gate-5", "meeting-seed-3"],
    confirms: [
      { text: "새로운 인연은 아직 만나지 않은 나의 이야기와 이어지는 작은 문이다냥. 샨티와 함께 다가올 우정의 모습을 살펴보자냥." },
      { text: "어떤 친구는 우연처럼 찾아와 오래 남는 인연이 되기도 한다냥. 너에게 찾아올 새로운 연결을 함께 만나보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "friends-view-me",
    label: "친구들이 바라보는 나는 어떤 사람일까?",
    resonatesWith: ["flower", "moon"],
    spreads: ["friend-gaze-5", "mirror-me-3"],
    confirms: [
      { text: "우리는 가끔 내가 모르는 모습으로 누군가의 마음속에 머물고 있다냥. 샨티와 함께 친구들이 바라보는 너의 모습을 만나보자냥." },
      { text: "나를 바라보는 다른 사람의 시선 속에는 새로운 나의 모습이 숨어 있을 수 있다냥. 지금 너의 매력을 함께 찾아보자냥." },
    ],
    shuffleStyle: "toward",
  },
  {
    slug: "general",
    label: "그냥 요즘 인간관계가 전반적으로 궁금해",
    resonatesWith: ["flower", "moon"],
    spreads: ["bond-now-1", "bond-three-3"],
    confirms: [
      { text: "누구 한 사람을 짚지 않아도 마음이 관계 쪽으로 기울 때가 있다냥. 샨티와 함께 요즘 너의 사람들과의 사이를 살펴보자냥." },
      { text: "지금의 관계, 내가 놓치고 있던 것, 다가올 인연. 세 장으로 너의 인간관계를 조금 넓게 바라보자냥." },
    ],
    shuffleStyle: "gentle",
  },
]
