// lib/content/spreads/friend.ts
// [콘텐츠] 친구에 대한 이야기 스프레드.
//
// 채우는 법은 lib/content/spread-type.ts 머리말을 보세요.
// ⚠️ 열쇠(id)는 이 스프레드만의 이름이고, layoutKey 는 카드가 놓이는
//    좌표입니다. 여러 스프레드가 같은 좌표를 나눠 씁니다.
import type { Spread, SpreadId } from "@/lib/content/spread-type"

export const FRIEND_SPREADS: Record<SpreadId, Spread> = {
  "friend-mirror-5": {
    emoji: "🪞",
    name: "우정의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "moon", "root"],
    positions: [
      {
        label: "친구의 의미",
        short: "지금 내 곁에 있는 친구들이 가진 의미를 비추는 카드다냥.",
        long: "현재의 관계 속에서 느끼는 연결과 소중함을 살펴본다냥.",
      },
      {
        label: "가져온 선물",
        short: "친구들이 내 삶에 가져온 선물을 보여주는 카드다냥.",
        long: "함께하며 얻은 위로와 성장의 흔적을 찾아본다냥.",
      },
      {
        label: "내가 전하는 것",
        short: "내가 친구들에게 전하고 있는 모습을 보여주는 카드다냥.",
        long: "이 관계 속에서 내가 어떤 존재인지 살펴본다냥.",
      },
      {
        label: "배우는 것",
        short: "친구들과의 관계에서 배우고 있는 것을 보여주는 카드다냥.",
        long: "우정이 내게 알려주는 마음의 이야기를 들여다본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 우정의 메시지를 담은 카드다냥.",
        long: "지금의 인연을 어떻게 바라보면 좋을지 알려준다냥.",
      },
    ],
  },
  "walk-together-3": {
    emoji: "🤝",
    name: "함께 걷는 길",
    layoutKey: "three-row",
    resonatesWith: ["flower", "wind", "candle"],
    positions: [
      {
        label: "우정의 온도",
        short: "지금 친구들과 나 사이에 흐르는 관계의 분위기를 보여주는 카드다냥.",
        long: "현재 우정의 온도와 흐름을 살펴본다냥.",
      },
      {
        label: "맡고 있는 자리",
        short: "친구들이 내 삶에서 맡고 있는 역할을 보여주는 카드다냥.",
        long: "서로에게 어떤 영향을 주고 있는지 알아본다냥.",
      },
      {
        label: "이어가는 방향",
        short: "앞으로 이 우정을 이어가는 방향을 보여주는 카드다냥.",
        long: "더 따뜻한 관계를 만들기 위한 마음을 찾아본다냥.",
      },
    ],
  },
  "friend-grain-4": {
    emoji: "🌿",
    name: "우정의 결",
    layoutKey: "four-diamond",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "어울리는 에너지",
        short: "너와 잘 맞는 친구의 기본적인 에너지를 보여주는 카드다냥.",
        long: "어떤 성향의 사람이 너와 자연스럽게 어울리는지 살펴본다냥.",
      },
      {
        label: "나눌 관계",
        short: "그 친구와 나누게 될 관계의 모습을 보여주는 카드다냥.",
        long: "서로에게 어떤 힘이 되어주는지 알아본다냥.",
      },
      {
        label: "주고받을 것",
        short: "너와 그 친구가 서로에게 줄 수 있는 것을 보여주는 카드다냥.",
        long: "함께 성장하고 채워가는 부분을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 우정의 안내다냥.",
        long: "좋은 인연을 알아보고 이어가는 마음을 알려준다냥.",
      },
    ],
  },
  "bloom-together-3": {
    emoji: "🌷",
    name: "함께 피는 꽃",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "wind", "candle"],
    positions: [
      {
        label: "조화로운 친구",
        short: "너와 가장 조화로운 친구의 모습을 보여주는 카드다냥.",
        long: "너의 마음과 잘 맞는 관계의 결을 살펴본다냥.",
      },
      {
        label: "피어나는 나",
        short: "그 친구와 함께할 때 피어나는 너의 모습을 보여주는 카드다냥.",
        long: "편안하게 드러나는 너의 모습을 알아본다냥.",
      },
      {
        label: "우정의 가능성",
        short: "앞으로 만나게 될 우정의 가능성을 보여주는 카드다냥.",
        long: "새로운 연결과 관계의 흐름을 살펴본다냥.",
      },
    ],
  },
  "drift-5": {
    emoji: "🌫",
    name: "멀어진 마음의 이유",
    layoutKey: "five-grid",
    resonatesWith: ["moon", "root", "stone"],
    positions: [
      {
        label: "생긴 거리감",
        short: "지금 두 사람 사이에 생긴 거리감을 보여주는 카드다냥.",
        long: "어색함이 시작된 현재의 흐름을 살펴본다냥.",
      },
      {
        label: "숨겨진 원인",
        short: "관계 속에 숨겨진 원인을 보여주는 카드다냥.",
        long: "말하지 못한 감정과 서로 다른 생각을 들여다본다냥.",
      },
      {
        label: "만들어진 과정",
        short: "이 어색함이 만들어진 과정을 보여주는 카드다냥.",
        long: "최근의 변화와 관계의 흐름을 찾아본다냥.",
      },
      {
        label: "가까워지려면",
        short: "다시 가까워지기 위해 필요한 마음을 보여주는 카드다냥.",
        long: "관계를 풀어갈 실마리를 살펴본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 관계의 메시지를 담은 카드다냥.",
        long: "지금 이 관계를 어떻게 바라보면 좋을지 알려준다냥.",
      },
    ],
  },
  "relation-hidden-6": {
    emoji: "🔍",
    name: "관계의 숨은 결",
    layoutKey: "six-cross",
    resonatesWith: ["moon", "root"],
    positions: [
      {
        label: "현재의 분위기",
        short: "두 사람 사이의 현재 분위기를 보여주는 카드다냥.",
        long: "지금 느껴지는 어색함의 모습을 살펴본다냥.",
      },
      {
        label: "나의 마음",
        short: "내가 느끼고 있는 마음을 보여주는 카드다냥.",
        long: "내 안의 서운함과 생각을 들여다본다냥.",
      },
      {
        label: "상대의 마음",
        short: "상대가 느끼고 있을 마음을 보여주는 카드다냥.",
        long: "상대의 입장에서 관계를 바라본다냥.",
      },
      {
        label: "막고 있는 것",
        short: "두 사람 사이를 막고 있는 부분을 보여주는 카드다냥.",
        long: "풀어야 할 오해와 거리감을 찾아본다냥.",
      },
      {
        label: "다시 이어질 흐름",
        short: "다시 이어질 수 있는 흐름을 보여주는 카드다냥.",
        long: "관계를 회복할 가능성을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 우정의 안내다냥.",
        long: "이 관계를 위해 기억하면 좋을 마음을 알려준다냥.",
      },
    ],
  },
  "courage-4": {
    emoji: "💬",
    name: "마음을 전하는 용기",
    layoutKey: "four-row",
    resonatesWith: ["flower", "moon"],
    positions: [
      {
        label: "서운한 마음",
        short: "지금 네가 느끼는 서운함의 마음을 보여주는 카드다냥.",
        long: "왜 이 감정이 생겼는지 마음 깊은 곳을 살펴본다냥.",
      },
      {
        label: "전했을 때의 흐름",
        short: "이 마음을 전했을 때의 흐름을 보여주는 카드다냥.",
        long: "솔직한 표현이 관계에 어떤 영향을 줄지 알아본다냥.",
      },
      {
        label: "상대의 여지",
        short: "상대가 받아들일 수 있는 마음의 여지를 보여주는 카드다냥.",
        long: "상대의 입장에서 바라볼 부분을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 대화의 안내다냥.",
        long: "서운함을 어떻게 전하면 좋을지 마음의 방향을 알려준다냥.",
      },
    ],
  },
  "dialogue-5": {
    emoji: "🗣",
    name: "두 마음의 대화",
    layoutKey: "five-tee",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "진짜 마음",
        short: "지금 말하고 싶은 너의 진짜 마음을 보여주는 카드다냥.",
        long: "겉으로 표현하지 못한 감정과 바람을 살펴본다냥.",
      },
      {
        label: "숨겨진 소중함",
        short: "서운함 속에 숨겨진 소중한 마음을 보여주는 카드다냥.",
        long: "왜 이 관계를 지키고 싶은지 알아본다냥.",
      },
      {
        label: "전해질 모습",
        short: "상대가 듣게 될 메시지의 모습을 보여주는 카드다냥.",
        long: "네 마음이 어떻게 전달될지 살펴본다냥.",
      },
      {
        label: "조심할 것",
        short: "대화에서 조심해야 할 부분을 보여주는 카드다냥.",
        long: "서로를 이해하기 위한 지혜를 찾아본다냥.",
      },
      {
        label: "샨티의 조언",
        short: "샨티가 전하는 관계의 조언을 담은 카드다냥.",
        long: "마음을 나누는 가장 따뜻한 방법을 알려준다냥.",
      },
    ],
  },
  "distance-tune-4": {
    emoji: "📐",
    name: "관계의 거리 조절",
    layoutKey: "four-diamond",
    resonatesWith: ["stone", "moon", "wind"],
    positions: [
      {
        label: "현재의 거리",
        short: "지금 이 관계의 현재 거리를 보여주는 카드다냥.",
        long: "두 사람 사이에 흐르는 분위기와 관계의 상태를 살펴본다냥.",
      },
      {
        label: "지킬 경계",
        short: "내가 이 관계에서 지켜야 할 마음의 경계를 보여주는 카드다냥.",
        long: "무엇을 받아들이고 무엇을 내려놓아야 할지 살펴본다냥.",
      },
      {
        label: "필요한 거리감",
        short: "관계를 유지하기 위해 필요한 거리감을 보여주는 카드다냥.",
        long: "가까움과 멀어짐 사이의 균형을 찾아본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 관계의 안내다냥.",
        long: "지금 너에게 가장 편안한 관계의 방향을 알려준다냥.",
      },
    ],
  },
  "relation-balance-6": {
    emoji: "⚖️",
    name: "관계의 균형",
    layoutKey: "six-cross",
    resonatesWith: ["stone", "root"],
    positions: [
      {
        label: "관계의 흐름",
        short: "지금 두 사람 관계의 흐름을 보여주는 카드다냥.",
        long: "현재 관계가 어떤 방향으로 움직이고 있는지 살펴본다냥.",
      },
      {
        label: "붙잡은 마음",
        short: "내가 붙잡고 있는 마음을 보여주는 카드다냥.",
        long: "아직 놓지 못한 기대와 감정을 들여다본다냥.",
      },
      {
        label: "필요한 공간",
        short: "상대와 나 사이에 필요한 공간을 보여주는 카드다냥.",
        long: "건강한 거리를 만들기 위한 방법을 찾아본다냥.",
      },
      {
        label: "조심할 것",
        short: "관계에서 조심해야 할 부분을 보여주는 카드다냥.",
        long: "나를 지키기 위해 기억해야 할 점을 살펴본다냥.",
      },
      {
        label: "흘러갈 가능성",
        short: "앞으로 관계가 흘러갈 가능성을 보여주는 카드다냥.",
        long: "조금 멀어짐과 다시 가까워짐의 흐름을 바라본다냥.",
      },
      {
        label: "샨티의 지혜",
        short: "샨티가 전하는 관계의 지혜를 담은 카드다냥.",
        long: "이 관계를 어떤 마음으로 바라보면 좋을지 알려준다냥.",
      },
    ],
  },
  "friend-seat-5": {
    emoji: "🪑",
    name: "우정의 자리",
    layoutKey: "five-tee",
    resonatesWith: ["flower", "moon"],
    positions: [
      {
        label: "친구가 보는 나",
        short: "친구의 마음속에 있는 나의 모습을 보여주는 카드다냥.",
        long: "친구가 바라보는 나의 분위기와 존재감을 살펴본다냥.",
      },
      {
        label: "내가 주는 힘",
        short: "내가 친구에게 주는 힘을 보여주는 카드다냥.",
        long: "함께 있을 때 전해지는 위로와 영향을 알아본다냥.",
      },
      {
        label: "친구의 감정",
        short: "친구가 나와 함께하며 느끼는 감정을 보여주는 카드다냥.",
        long: "말로 표현하지 않은 마음의 결을 살펴본다냥.",
      },
      {
        label: "맡고 있는 역할",
        short: "이 관계 속에서 내가 맡고 있는 역할을 보여주는 카드다냥.",
        long: "친구에게 어떤 의미로 자리하고 있는지 알아본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 우정의 메시지를 담은 카드다냥.",
        long: "지금의 관계를 더 따뜻하게 바라보는 방법을 알려준다냥.",
      },
    ],
  },
  "mutual-light-3": {
    emoji: "💡",
    name: "서로의 빛",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "candle", "wind"],
    positions: [
      {
        label: "첫인상",
        short: "친구가 느끼는 나의 첫인상을 보여주는 카드다냥.",
        long: "관계 속에서 드러나는 나의 매력을 살펴본다냥.",
      },
      {
        label: "주고받는 에너지",
        short: "친구와 내가 서로 주고받는 에너지를 보여주는 카드다냥.",
        long: "두 사람 사이의 특별한 연결을 알아본다냥.",
      },
      {
        label: "남길 의미",
        short: "이 우정이 앞으로 남길 의미를 보여주는 카드다냥.",
        long: "관계가 서로에게 어떤 성장을 가져오는지 살펴본다냥.",
      },
    ],
  },
  "newfriend-door-4": {
    emoji: "🚪",
    name: "새로운 인연의 문",
    layoutKey: "four-diamond",
    resonatesWith: ["flower", "wind", "candle"],
    positions: [
      {
        label: "지금의 마음",
        short: "새로운 사람을 만나는 지금의 너의 마음을 보여주는 카드다냥.",
        long: "새로운 관계를 받아들이는 준비와 마음의 상태를 살펴본다냥.",
      },
      {
        label: "만들어갈 관계",
        short: "새로운 인연과 만들어갈 관계의 모습을 보여주는 카드다냥.",
        long: "서로 어떤 방식으로 가까워질 수 있는지 알아본다냥.",
      },
      {
        label: "나의 매력",
        short: "새로운 관계에서 너의 매력을 보여주는 카드다냥.",
        long: "상대에게 전해지는 너만의 분위기를 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 새로운 인연의 안내다냥.",
        long: "좋은 관계를 시작하기 위해 기억하면 좋을 마음을 알려준다냥.",
      },
    ],
  },
  "meeting-flow-5": {
    emoji: "🌊",
    name: "만남의 흐름",
    layoutKey: "five-two-three",
    resonatesWith: ["flower", "wind", "moon"],
    positions: [
      {
        label: "시작되는 흐름",
        short: "새로운 만남이 시작되는 흐름을 보여주는 카드다냥.",
        long: "처음 관계가 어떻게 열릴지 살펴본다냥.",
      },
      {
        label: "필요한 마음",
        short: "서로 가까워지는 과정에서 필요한 마음을 보여주는 카드다냥.",
        long: "편안한 관계를 만드는 방법을 찾아본다냥.",
      },
      {
        label: "주의할 부분",
        short: "관계 속에서 주의할 부분을 보여주는 카드다냥.",
        long: "서로 다른 점을 이해하는 방법을 살펴본다냥.",
      },
      {
        label: "가져올 가능성",
        short: "이 만남이 가져올 가능성을 보여주는 카드다냥.",
        long: "새로운 관계가 어떤 의미가 될지 알아본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 관계의 메시지를 담은 카드다냥.",
        long: "너답게 새로운 인연을 이어가는 방법을 알려준다냥.",
      },
    ],
  },
  "relation-weight-5": {
    emoji: "🪨",
    name: "관계의 무게",
    layoutKey: "five-grid",
    resonatesWith: ["stone", "moon", "root"],
    positions: [
      {
        label: "스트레스의 모습",
        short: "지금 사람 때문에 느끼는 스트레스의 모습을 보여주는 카드다냥.",
        long: "겉으로 드러난 불편함과 마음의 부담을 살펴본다냥.",
      },
      {
        label: "시작된 원인",
        short: "이 스트레스가 시작된 원인을 보여주는 카드다냥.",
        long: "관계 속에서 쌓여온 감정과 상황의 흐름을 찾아본다냥.",
      },
      {
        label: "못 알아챈 마음",
        short: "내가 미처 알아차리지 못한 마음을 보여주는 카드다냥.",
        long: "상대와의 관계 속에서 숨겨진 내 감정을 들여다본다냥.",
      },
      {
        label: "지킬 기준",
        short: "이 관계에서 지켜야 할 나의 기준을 보여주는 카드다냥.",
        long: "나를 보호하기 위해 필요한 마음의 경계를 살펴본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 관계의 메시지를 담은 카드다냥.",
        long: "이 상황을 조금 더 편안하게 바라보는 방법을 알려준다냥.",
      },
    ],
  },
  "relation-shadow-6": {
    emoji: "🌑",
    name: "관계의 그림자",
    layoutKey: "six-cross",
    resonatesWith: ["stone", "moon", "wind"],
    positions: [
      {
        label: "힘들게 하는 것",
        short: "지금 나를 힘들게 하는 관계의 모습을 보여주는 카드다냥.",
        long: "현재 상황 속에서 가장 크게 느껴지는 부분을 살펴본다냥.",
      },
      {
        label: "감정의 원인",
        short: "내가 느끼는 감정의 원인을 보여주는 카드다냥.",
        long: "서운함, 부담, 답답함 속에 있는 마음을 찾아본다냥.",
      },
      {
        label: "상대의 영향",
        short: "상대의 행동이 내게 미치는 영향을 보여주는 카드다냥.",
        long: "관계 속에서 오가는 에너지를 살펴본다냥.",
      },
      {
        label: "놓치고 있는 것",
        short: "내가 놓치고 있는 부분을 보여주는 카드다냥.",
        long: "새로운 시선으로 관계를 바라볼 힌트를 찾아본다냥.",
      },
      {
        label: "필요한 방향",
        short: "앞으로 필요한 관계의 방향을 보여주는 카드다냥.",
        long: "거리를 두거나 이어가는 방법을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 마음의 안내다냥.",
        long: "나를 지키면서 관계를 바라보는 방법을 알려준다냥.",
      },
    ],
  },
  "newfriend-gate-5": {
    emoji: "🌼",
    name: "새로운 우정의 문",
    layoutKey: "five-two-three",
    resonatesWith: ["flower", "wind", "candle"],
    positions: [
      {
        label: "다가올 에너지",
        short: "앞으로 다가올 새로운 친구의 에너지를 보여주는 카드다냥.",
        long: "어떤 분위기와 성향을 가진 사람인지 살펴본다냥.",
      },
      {
        label: "연결되는 계기",
        short: "그 친구와 연결되는 계기를 보여주는 카드다냥.",
        long: "어떤 흐름 속에서 인연이 시작될지 알아본다냥.",
      },
      {
        label: "가져올 변화",
        short: "그 친구가 내 삶에 가져올 변화를 보여주는 카드다냥.",
        long: "새로운 관계가 나에게 어떤 의미가 될지 살펴본다냥.",
      },
      {
        label: "내가 전할 모습",
        short: "내가 그 친구에게 전하게 될 모습을 보여주는 카드다냥.",
        long: "서로 어떤 영향을 주고받을지 알아본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 새로운 우정의 메시지를 담은 카드다냥.",
        long: "다가오는 인연을 어떻게 맞이하면 좋을지 알려준다냥.",
      },
    ],
  },
  "meeting-seed-3": {
    emoji: "🌱",
    name: "만남의 씨앗",
    layoutKey: "three-row",
    resonatesWith: ["flower", "wind", "moon"],
    positions: [
      {
        label: "찾아올 친구",
        short: "앞으로 찾아올 새로운 친구의 모습을 보여주는 카드다냥.",
        long: "그 사람만의 분위기와 관계의 결을 살펴본다냥.",
      },
      {
        label: "자라나는 과정",
        short: "이 인연이 자라나는 과정을 보여주는 카드다냥.",
        long: "서로 가까워지는 흐름을 알아본다냥.",
      },
      {
        label: "남길 의미",
        short: "이 우정이 남길 의미를 보여주는 카드다냥.",
        long: "새로운 관계가 내 삶에 가져올 가능성을 살펴본다냥.",
      },
    ],
  },
  "friend-gaze-5": {
    emoji: "👀",
    name: "친구의 시선",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "moon"],
    positions: [
      {
        label: "첫인상",
        short: "친구들이 바라보는 나의 첫인상을 보여주는 카드다냥.",
        long: "사람들에게 처음 전해지는 나의 분위기와 이미지를 살펴본다냥.",
      },
      {
        label: "좋아하는 모습",
        short: "친구들이 좋아하는 나의 모습을 보여주는 카드다냥.",
        long: "관계 속에서 빛나는 나만의 장점을 알아본다냥.",
      },
      {
        label: "말 없이 느끼는 것",
        short: "친구들이 말하지 않아도 느끼는 나의 모습을 보여주는 카드다냥.",
        long: "겉으로 드러나지 않은 매력과 성향을 살펴본다냥.",
      },
      {
        label: "나의 역할",
        short: "친구 관계 속에서 내가 가진 특별한 역할을 보여주는 카드다냥.",
        long: "주변 사람들에게 어떤 힘이 되어주는지 알아본다냥.",
      },
      {
        label: "샨티의 시선",
        short: "샨티가 전하는 나에 대한 새로운 시선을 담은 카드다냥.",
        long: "내가 가진 모습을 조금 더 따뜻하게 바라보는 방법을 알려준다냥.",
      },
    ],
  },
  "mirror-me-3": {
    emoji: "🪞",
    name: "거울 속의 나",
    layoutKey: "three-inverted",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "드러난 모습",
        short: "친구들이 보는 겉으로 드러난 나의 모습을 보여주는 카드다냥.",
        long: "사람들이 느끼는 나의 분위기를 살펴본다냥.",
      },
      {
        label: "발견된 모습",
        short: "가까운 사람들이 발견한 나의 숨은 모습을 보여주는 카드다냥.",
        long: "나도 몰랐던 매력과 특징을 찾아본다냥.",
      },
      {
        label: "변화하는 나",
        short: "관계 속에서 성장하고 변화하는 나의 모습을 보여주는 카드다냥.",
        long: "친구들과의 연결이 나에게 남긴 의미를 살펴본다냥.",
      },
    ],
  },
}
