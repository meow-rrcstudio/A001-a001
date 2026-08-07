// lib/content/spreads/self.ts
// [콘텐츠] 나 자신에 대한 이야기 스프레드.
//
// 채우는 법은 lib/content/spread-type.ts 머리말을 보세요.
// ⚠️ 열쇠(id)는 이 스프레드만의 이름이고, layoutKey 는 카드가 놓이는
//    좌표입니다. 여러 스프레드가 같은 좌표를 나눠 씁니다.
import type { Spread, SpreadId } from "@/lib/content/spread-type"

export const SELF_SPREADS: Record<SpreadId, Spread> = {
  "mirror-reason-5": {
    emoji: "🌙",
    name: "마음의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["stone", "moon", "root"],
    positions: [
      {
        label: "지금의 마음",
        short: "지금 너의 마음을 비추는 카드다냥.",
        long: "겉으로 드러난 감정과 지금 네 안에 머물고 있는 마음의 모습을 살펴본다냥.",
      },
      {
        label: "숨어 있는 이야기",
        short: "마음 깊은 곳에 숨어 있는 이야기를 들려주는 카드다냥.",
        long: "아직 알아차리지 못했거나 조용히 간직한 감정을 살펴본다냥.",
      },
      {
        label: "마음이 찾아온 까닭",
        short: "이 마음이 찾아온 이유를 살펴보는 카드다냥.",
        long: "지금의 감정을 만든 경험과 기억, 마음의 뿌리를 찾아본다냥.",
      },
      {
        label: "마음이 보내는 신호",
        short: "지금 너의 마음이 보내는 신호를 담은 카드다냥.",
        long: "지금 너에게 필요한 위로와 돌봄이 무엇인지 알려준다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 작은 마음의 안내다냥.",
        long: "지금의 너를 어떻게 바라보면 좋을지 이야기해준다냥.",
      },
    ],
  },
  "wave-reason-3": {
    emoji: "🌊",
    name: "감정의 파도",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "지금 이는 파도",
        short: "지금 너의 마음 위에 일고 있는 파도를 보여주는 카드다냥.",
        long: "현재 네 감정의 흐름과 마음의 날씨를 살펴본다냥.",
      },
      {
        label: "깊은 곳의 물결",
        short: "깊은 곳에서 움직이는 마음의 물결을 보여주는 카드다냥.",
        long: "겉으로 보이지 않는 감정의 흔적을 찾아본다냥.",
      },
      {
        label: "향하고 싶은 곳",
        short: "너의 마음이 향하고 싶은 방향을 보여주는 카드다냥.",
        long: "조금 더 편안한 흐름으로 가기 위한 길을 찾아본다냥.",
      },
    ],
  },
  "mirror-now-5": {
    emoji: "🌙",
    name: "마음의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "moon", "root"],
    positions: [
      {
        label: "지금의 마음",
        short: "지금 너의 마음을 비추는 카드다냥.",
        long: "겉으로 드러난 감정과 현재 네가 느끼고 있는 마음의 모습을 살펴본다냥.",
      },
      {
        label: "숨어 있는 이야기",
        short: "마음 깊은 곳에 숨어 있는 이야기를 들려주는 카드다냥.",
        long: "아직 말로 꺼내지 못한 감정과 무의식 속 마음을 살펴본다냥.",
      },
      {
        label: "마음이 만들어진 흐름",
        short: "지금의 마음이 만들어진 흐름을 보여주는 카드다냥.",
        long: "최근의 경험과 기억 속에서 마음의 변화를 찾아본다냥.",
      },
      {
        label: "마음이 보내는 신호",
        short: "지금 너의 마음이 보내는 신호를 담은 카드다냥.",
        long: "지금 네게 필요한 위로와 돌봄이 무엇인지 알려준다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 작은 마음의 안내다냥.",
        long: "현재의 너를 조금 더 다정하게 바라보는 방법을 알려준다냥.",
      },
    ],
  },
  "wave-now-3": {
    emoji: "🌊",
    name: "감정의 파도",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "지금 이는 파도",
        short: "지금 네 마음 위에 일고 있는 파도를 보여주는 카드다냥.",
        long: "현재 감정의 흐름과 마음의 날씨를 살펴본다냥.",
      },
      {
        label: "깊은 곳의 물결",
        short: "깊은 곳에서 움직이는 마음의 물결을 보여주는 카드다냥.",
        long: "겉으로 드러나지 않은 감정과 숨은 마음을 찾아본다냥.",
      },
      {
        label: "향하고 싶은 곳",
        short: "너의 마음이 향하고 싶은 방향을 보여주는 카드다냥.",
        long: "지금의 마음이 원하는 변화와 흐름을 살펴본다냥.",
      },
    ],
  },
  "need-compass-5": {
    emoji: "🧭",
    name: "마음의 나침반",
    layoutKey: "five-tee",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "가장 바라는 것",
        short: "지금 너의 마음이 가장 필요로 하는 것을 비추는 카드다냥.",
        long: "현재 네 안에서 가장 크게 원하는 위로와 에너지가 무엇인지 살펴본다냥.",
      },
      {
        label: "돌보지 못한 마음",
        short: "네가 충분히 돌보지 못한 마음을 보여주는 카드다냥.",
        long: "잠시 잊고 있던 감정과 스스로에게 필요한 것을 들여다본다냥.",
      },
      {
        label: "지금 필요한 힘",
        short: "지금 너에게 필요한 힘을 알려주는 카드다냥.",
        long: "현재의 너를 지탱하고 앞으로 나아가게 할 마음의 힘을 찾아본다냥.",
      },
      {
        label: "내려놓아도 되는 것",
        short: "지금 내려놓아도 되는 마음의 무게를 보여주는 카드다냥.",
        long: "불필요하게 붙잡고 있던 생각과 감정을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 작은 마음의 안내다냥.",
        long: "지금의 너를 위해 선택하면 좋을 방향을 알려준다냥.",
      },
    ],
  },
  "need-balance-4": {
    emoji: "⚖️",
    name: "마음의 균형",
    layoutKey: "four-grid",
    resonatesWith: ["flower", "moon", "root"],
    positions: [
      {
        label: "부족한 조각",
        short: "지금 너에게 부족한 마음의 조각을 보여주는 카드다냥.",
        long: "네 마음이 조용히 보내고 있는 필요의 신호를 살펴본다냥.",
      },
      {
        label: "이미 있는 힘",
        short: "이미 네 안에 있는 힘을 보여주는 카드다냥.",
        long: "잊고 있던 가능성과 회복의 힘을 찾아본다냥.",
      },
      {
        label: "채워야 할 자리",
        short: "지금 채워야 할 마음의 공간을 보여주는 카드다냥.",
        long: "너 자신에게 건네야 할 위로와 돌봄을 살펴본다냥.",
      },
      {
        label: "돌보는 방법",
        short: "앞으로 마음을 돌보는 방법을 알려주는 카드다냥.",
        long: "조금 더 편안한 균형으로 나아가는 길을 찾아본다냥.",
      },
    ],
  },
  "hidden-mirror-5": {
    emoji: "🪞",
    name: "숨겨진 나의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["moon", "root", "flower"],
    positions: [
      {
        label: "눈치채지 못한 모습",
        short: "아직 눈치채지 못한 너의 모습을 비추는 카드다냥.",
        long: "겉으로 드러난 모습 뒤에 숨어 있는 진짜 마음을 살펴본다냥.",
      },
      {
        label: "조용한 가능성",
        short: "네 안에 조용히 자리한 가능성을 보여주는 카드다냥.",
        long: "스스로도 발견하지 못했던 재능과 성향을 들여다본다냥.",
      },
      {
        label: "나를 만든 뿌리",
        short: "지금까지 너를 만들어온 마음의 뿌리를 보여주는 카드다냥.",
        long: "익숙한 생각과 행동 속에 숨어 있는 너의 모습을 찾아본다냥.",
      },
      {
        label: "더 알아갈 모습",
        short: "앞으로 더 알아가면 좋을 나의 모습을 보여주는 카드다냥.",
        long: "새롭게 받아들일 수 있는 나의 가능성을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 자기 발견의 안내다냥.",
        long: "있는 그대로의 너를 바라보는 새로운 시선을 전해준다냥.",
      },
    ],
  },
  "hidden-treasure-3": {
    emoji: "💎",
    name: "숨은 보물",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "moon", "wind"],
    positions: [
      {
        label: "드러나지 않은 모습",
        short: "지금 드러나지 않은 너의 모습을 보여주는 카드다냥.",
        long: "아직 세상에 꺼내지 않은 마음과 가능성을 살펴본다냥.",
      },
      {
        label: "자라는 힘",
        short: "네 안에서 자라고 있는 숨은 힘을 보여주는 카드다냥.",
        long: "평소에는 지나쳤던 너만의 특별함을 찾아본다냥.",
      },
      {
        label: "발견하게 될 나",
        short: "앞으로 발견하게 될 나의 모습을 보여주는 카드다냥.",
        long: "새로운 나를 만나기 위한 변화의 흐름을 살펴본다냥.",
      },
    ],
  },
  "hero-5": {
    emoji: "🦸",
    name: "나만의 히어로",
    layoutKey: "five-tee",
    resonatesWith: ["flower", "candle", "wind"],
    positions: [
      {
        label: "잠든 히어로",
        short: "너 안에 잠들어 있는 히어로의 모습을 보여주는 카드다냥.",
        long: "아직 발견하지 못한 너만의 특별한 힘과 가능성을 살펴본다냥.",
      },
      {
        label: "너만의 능력",
        short: "히어로가 가진 너만의 능력을 보여주는 카드다냥.",
        long: "다른 사람과 구별되는 너만의 재능과 강점을 찾아본다냥.",
      },
      {
        label: "마주할 도전",
        short: "히어로가 마주할 도전을 보여주는 카드다냥.",
        long: "너를 성장시키고 더 강하게 만드는 과제를 살펴본다냥.",
      },
      {
        label: "힘이 필요한 곳",
        short: "너의 힘이 필요한 곳을 보여주는 카드다냥.",
        long: "어떤 순간에 너의 존재가 빛나는지 알려준다냥.",
      },
      {
        label: "샨티의 이야기",
        short: "샨티가 그려주는 너만의 히어로 이야기를 보여주는 카드다냥.",
        long: "앞으로 어떤 모습으로 빛날 수 있을지 함께 바라본다냥.",
      },
    ],
  },
  "hero-talent-3": {
    emoji: "✨",
    name: "숨은 재능",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "candle", "root"],
    positions: [
      {
        label: "숨겨진 힘",
        short: "너 안에 숨겨진 특별한 힘을 보여주는 카드다냥.",
        long: "평소에는 지나쳤던 너만의 능력을 발견해본다냥.",
      },
      {
        label: "자라난 까닭",
        short: "그 힘이 자라나는 이유를 보여주는 카드다냥.",
        long: "너를 만들어온 경험과 마음의 뿌리를 살펴본다냥.",
      },
      {
        label: "펼치는 방향",
        short: "그 힘을 세상에 펼치는 방향을 보여주는 카드다냥.",
        long: "너다운 방식으로 빛나는 길을 찾아본다냥.",
      },
    ],
  },
  "strength-mirror-5": {
    emoji: "💪",
    name: "숨은 힘의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "candle", "root"],
    positions: [
      {
        label: "잠든 힘",
        short: "너 안에 잠들어 있는 힘을 비추는 카드다냥.",
        long: "평소에는 당연하게 여겼던 너만의 강점과 특별함을 살펴본다냥.",
      },
      {
        label: "힘의 시작",
        short: "그 힘이 어디에서 시작되었는지 보여주는 카드다냥.",
        long: "너를 성장시키고 단단하게 만든 경험과 마음의 뿌리를 찾아본다냥.",
      },
      {
        label: "빛나는 순간",
        short: "네가 가진 힘이 빛나는 순간을 보여주는 카드다냥.",
        long: "어떤 상황에서 너의 능력이 가장 잘 드러나는지 살펴본다냥.",
      },
      {
        label: "더 키우려면",
        short: "그 힘을 더 키우기 위해 필요한 것을 보여주는 카드다냥.",
        long: "앞으로 너 자신을 믿고 성장시키는 방향을 알려준다냥.",
      },
      {
        label: "샨티가 본 보물",
        short: "샨티가 발견한 너만의 숨은 보물을 전하는 카드다냥.",
        long: "아직 발견하지 못한 너의 가능성을 다정하게 바라본다냥.",
      },
    ],
  },
  "potential-3": {
    emoji: "🌱",
    name: "나의 가능성",
    layoutKey: "three-arch",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "꺼내지 않은 가능성",
        short: "아직 꺼내지 않은 너의 가능성을 보여주는 카드다냥.",
        long: "마음 깊은 곳에 자리한 재능과 힘을 찾아본다냥.",
      },
      {
        label: "자라는 방향",
        short: "그 가능성이 자라나는 방향을 보여주는 카드다냥.",
        long: "너만의 힘을 키워온 과정과 흐름을 살펴본다냥.",
      },
      {
        label: "펼치는 방법",
        short: "그 힘을 세상에 펼치는 방법을 보여주는 카드다냥.",
        long: "너답게 빛날 수 있는 길을 찾아본다냥.",
      },
    ],
  },
  "drain-weight-5": {
    emoji: "🪨",
    name: "마음의 무게",
    layoutKey: "five-grid",
    resonatesWith: ["stone", "moon", "root"],
    positions: [
      {
        label: "지치게 하는 무게",
        short: "지금 너를 지치게 하는 마음의 무게를 보여주는 카드다냥.",
        long: "겉으로는 지나쳤지만 계속 쌓여온 부담과 피로를 살펴본다냥.",
      },
      {
        label: "힘을 빼앗는 것",
        short: "마음 깊은 곳에서 힘을 빼앗는 원인을 보여주는 카드다냥.",
        long: "스스로도 알아차리지 못했던 걱정과 감정의 흔적을 찾아본다냥.",
      },
      {
        label: "지침이 시작된 곳",
        short: "이 지침이 시작된 흐름을 보여주는 카드다냥.",
        long: "최근의 경험과 오래된 마음의 패턴 속에서 이유를 살펴본다냥.",
      },
      {
        label: "내려놓아도 되는 것",
        short: "잠시 내려놓아도 되는 것을 보여주는 카드다냥.",
        long: "지금의 너에게 필요하지 않은 마음의 짐을 바라본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 회복의 안내다냥.",
        long: "지친 마음을 다시 돌보기 위한 작은 방향을 찾아본다냥.",
      },
    ],
  },
  "drain-flow-3": {
    emoji: "🌊",
    name: "감정의 흐름",
    layoutKey: "three-arch",
    resonatesWith: ["stone", "moon", "wind"],
    positions: [
      {
        label: "에너지를 흐리는 것",
        short: "지금 너의 에너지를 흐리게 만드는 것을 보여주는 카드다냥.",
        long: "현재 마음속에 머무는 피로와 감정의 상태를 살펴본다냥.",
      },
      {
        label: "반복되는 파도",
        short: "반복해서 찾아오는 마음의 파도를 보여주는 카드다냥.",
        long: "너를 지치게 하는 생각과 감정의 패턴을 들여다본다냥.",
      },
      {
        label: "가벼워지는 길",
        short: "다시 가벼워지기 위한 방향을 보여주는 카드다냥.",
        long: "지금의 마음을 회복시키는 흐름을 찾아본다냥.",
      },
    ],
  },
  "release-mirror-5": {
    emoji: "🍂",
    name: "놓음과 채움의 거울",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "wind"],
    positions: [
      {
        label: "놓아줄 것",
        short: "지금 네가 놓아주어야 할 것을 비추는 카드다냥.",
        long: "더 이상 너에게 머물 필요가 없는 감정과 생각을 살펴본다냥.",
      },
      {
        label: "붙잡고 있는 마음",
        short: "아직 붙잡고 있는 마음을 보여주는 카드다냥.",
        long: "쉽게 내려놓지 못했던 기억과 마음의 이유를 들여다본다냥.",
      },
      {
        label: "지켜야 할 것",
        short: "네가 지켜야 할 소중한 것을 보여주는 카드다냥.",
        long: "지금의 너를 이루고 있는 가치와 힘을 찾아본다냥.",
      },
      {
        label: "새로 받아들일 것",
        short: "앞으로 새롭게 받아들일 것을 보여주는 카드다냥.",
        long: "비워낸 자리에 찾아올 변화와 가능성을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 균형의 안내다냥.",
        long: "무엇을 보내고 무엇을 품을지 마음의 방향을 알려준다냥.",
      },
    ],
  },
  "release-tidy-4": {
    emoji: "🧺",
    name: "마음의 정리",
    layoutKey: "four-diamond",
    resonatesWith: ["stone", "moon", "wind"],
    positions: [
      {
        label: "놓아줄 무게",
        short: "지금 놓아주어야 하는 마음의 무게를 보여주는 카드다냥.",
        long: "너를 붙잡고 있던 감정과 생각을 살펴본다냥.",
      },
      {
        label: "간직한 것",
        short: "아직 간직하고 있는 소중한 것을 보여주는 카드다냥.",
        long: "끝까지 지키고 싶은 마음의 가치를 찾아본다냥.",
      },
      {
        label: "가져갈 힘",
        short: "앞으로 가져가야 할 힘을 보여주는 카드다냥.",
        long: "새로운 흐름을 만들어줄 내면의 자원을 살펴본다냥.",
      },
      {
        label: "정리한 뒤의 변화",
        short: "마음을 정리한 뒤 찾아올 변화를 보여주는 카드다냥.",
        long: "가벼워진 너의 다음 걸음을 바라본다냥.",
      },
    ],
  },
  "selfshape-mirror-5": {
    emoji: "🪞",
    name: "나의 모습 거울",
    layoutKey: "five-grid",
    resonatesWith: ["flower", "moon", "root"],
    positions: [
      {
        label: "보여주는 모습",
        short: "지금 네가 세상에 보여주는 모습을 비추는 카드다냥.",
        long: "현재 네가 어떤 마음과 태도로 살아가고 있는지 살펴본다냥.",
      },
      {
        label: "진짜 모습",
        short: "마음 깊은 곳에 자리한 진짜 모습을 보여주는 카드다냥.",
        long: "다른 사람에게는 보이지 않는 너의 성향과 본질을 들여다본다냥.",
      },
      {
        label: "나를 만든 이야기",
        short: "지금의 너를 만들어온 이야기를 보여주는 카드다냥.",
        long: "지금까지의 경험과 선택이 어떤 너를 만들어왔는지 살펴본다냥.",
      },
      {
        label: "더 자랄 모습",
        short: "앞으로 더 성장할 수 있는 너의 모습을 보여주는 카드다냥.",
        long: "아직 펼치지 않은 가능성과 변화의 방향을 찾아본다냥.",
      },
      {
        label: "샨티가 본 너",
        short: "샨티가 바라본 너의 모습을 전하는 카드다냥.",
        long: "너 자신을 조금 더 이해하고 다정하게 바라보는 시선을 건네준다냥.",
      },
    ],
  },
  "selfshape-grain-3": {
    emoji: "🌾",
    name: "나의 결",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "root"],
    positions: [
      {
        label: "마음의 결",
        short: "지금 네가 가진 마음의 결을 보여주는 카드다냥.",
        long: "너를 이루고 있는 성향과 분위기를 살펴본다냥.",
      },
      {
        label: "특별하게 만드는 힘",
        short: "너를 특별하게 만드는 힘을 보여주는 카드다냥.",
        long: "오랜 시간 쌓여온 너만의 가치와 특징을 찾아본다냥.",
      },
      {
        label: "펼쳐질 모습",
        short: "앞으로 펼쳐질 너의 모습을 보여주는 카드다냥.",
        long: "지금의 너가 어떤 방향으로 성장해갈지 살펴본다냥.",
      },
    ],
  },
  "change-door-5": {
    emoji: "🚪",
    name: "변화의 문",
    layoutKey: "five-two-three",
    resonatesWith: ["wind", "flower"],
    positions: [
      {
        label: "열린 문",
        short: "지금 너의 삶 앞에 열린 변화의 문을 보여주는 카드다냥.",
        long: "이미 시작되고 있는 변화의 흐름과 새로운 가능성을 살펴본다냥.",
      },
      {
        label: "변화가 온 까닭",
        short: "변화가 찾아오는 이유를 보여주는 카드다냥.",
        long: "지금까지 쌓아온 경험과 마음의 움직임 속에서 그 의미를 찾아본다냥.",
      },
      {
        label: "놓치지 말 것",
        short: "변화 속에서 놓치지 말아야 할 너의 모습을 보여주는 카드다냥.",
        long: "새로운 흐름 속에서도 지켜야 할 가치와 중심을 살펴본다냥.",
      },
      {
        label: "필요한 마음가짐",
        short: "변화 앞에서 필요한 마음가짐을 보여주는 카드다냥.",
        long: "앞으로 나아가기 위해 준비하면 좋을 태도를 찾아본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 변화의 안내다냥.",
        long: "다가오는 흐름 속에서 너만의 길을 바라보는 시선을 전해준다냥.",
      },
    ],
  },
  "change-path-3": {
    emoji: "🌱",
    name: "새로운 길",
    layoutKey: "three-arch",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "다가오는 기운",
        short: "지금 너에게 다가오는 변화의 기운을 보여주는 카드다냥.",
        long: "현재 움직이고 있는 새로운 흐름을 살펴본다냥.",
      },
      {
        label: "마주할 나",
        short: "변화 속에서 마주하게 될 너의 모습을 보여주는 카드다냥.",
        long: "새로운 환경에서 발견할 가능성과 성장을 찾아본다냥.",
      },
      {
        label: "향하는 방향",
        short: "변화 이후 향하게 될 방향을 보여주는 카드다냥.",
        long: "너에게 맞는 다음 걸음을 살펴본다냥.",
      },
    ],
  },
  "soul-letter-5": {
    emoji: "💌",
    name: "영혼의 편지",
    layoutKey: "five-grid",
    resonatesWith: ["moon", "root"],
    positions: [
      {
        label: "먼저 건네는 말",
        short: "지금 네 영혼이 가장 먼저 건네고 싶은 이야기를 담은 카드다냥.",
        long: "현재의 너에게 꼭 전하고 싶은 마음의 메시지를 살펴본다냥.",
      },
      {
        label: "잊고 있던 목소리",
        short: "네가 잠시 잊고 있던 내면의 목소리를 보여주는 카드다냥.",
        long: "바쁜 일상 속에서 놓치고 있던 진짜 마음의 소리를 찾아본다냥.",
      },
      {
        label: "지금 배우는 것",
        short: "지금의 시간을 통해 배우고 있는 것을 보여주는 카드다냥.",
        long: "현재 겪고 있는 경험 속에 담긴 의미와 성장을 살펴본다냥.",
      },
      {
        label: "영혼의 응원",
        short: "영혼이 너에게 전하는 응원의 마음을 담은 카드다냥.",
        long: "지금의 너에게 필요한 믿음과 위로를 알려준다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 건네는 영혼의 작은 메시지다냥.",
        long: "있는 그대로의 너를 바라보고 앞으로 나아갈 방향을 찾아본다냥.",
      },
    ],
  },
  "soul-echo-3": {
    emoji: "🔔",
    name: "내면의 울림",
    layoutKey: "three-arch",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "울리는 소리",
        short: "지금 네 안에서 울리고 있는 마음의 소리를 보여주는 카드다냥.",
        long: "현재 너의 영혼이 바라보고 있는 모습을 살펴본다냥.",
      },
      {
        label: "못 들은 메시지",
        short: "아직 듣지 못한 내면의 메시지를 보여주는 카드다냥.",
        long: "조용히 자리하고 있던 감정과 깨달음을 찾아본다냥.",
      },
      {
        label: "만날 흐름",
        short: "앞으로 마음을 따라가면 만날 흐름을 보여주는 카드다냥.",
        long: "너다운 방향과 새로운 가능성을 살펴본다냥.",
      },
    ],
  },
  "future-letter-5": {
    emoji: "💌",
    name: "영혼의 편지",
    layoutKey: "five-grid",
    resonatesWith: ["moon", "root"],
    positions: [
      {
        label: "먼저 전하는 말",
        short: "지금 네 영혼이 가장 먼저 전하고 싶은 이야기를 담은 카드다냥.",
        long: "현재의 너에게 꼭 들려주고 싶은 마음의 메시지를 살펴본다냥.",
      },
      {
        label: "잊고 있던 목소리",
        short: "네가 잠시 잊고 있던 내면의 목소리를 보여주는 카드다냥.",
        long: "바쁜 순간들 속에서 놓치고 있던 진짜 마음의 신호를 찾아본다냥.",
      },
      {
        label: "지금의 깨달음",
        short: "지금의 시간이 너에게 알려주는 깨달음을 보여주는 카드다냥.",
        long: "현재 겪고 있는 경험 속에 담긴 의미와 배움을 살펴본다냥.",
      },
      {
        label: "위로와 응원",
        short: "영혼이 너에게 건네는 위로와 응원의 마음을 담은 카드다냥.",
        long: "지금의 너에게 필요한 믿음과 다정한 시선을 알려준다냥.",
      },
      {
        label: "샨티의 편지",
        short: "샨티가 전하는 영혼의 작은 편지다냥.",
        long: "앞으로의 길에서 너 자신을 어떻게 바라보면 좋을지 이야기해준다냥.",
      },
    ],
  },
  "future-echo-3": {
    emoji: "🔔",
    name: "내면의 울림",
    layoutKey: "three-arch",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "울리는 소리",
        short: "지금 네 안에서 울리고 있는 마음의 소리를 보여주는 카드다냥.",
        long: "현재 네 영혼이 바라보고 있는 모습을 살펴본다냥.",
      },
      {
        label: "못 들은 메시지",
        short: "아직 듣지 못한 내면의 메시지를 보여주는 카드다냥.",
        long: "조용히 머물러 있던 감정과 깨달음을 찾아본다냥.",
      },
      {
        label: "향하고 싶은 방향",
        short: "앞으로 너의 마음이 향하고 싶은 방향을 보여주는 카드다냥.",
        long: "영혼이 알려주는 새로운 흐름과 가능성을 살펴본다냥.",
      },
    ],
  },
  "me-now-1": {
    emoji: "🪞",
    name: "지금의 나",
    layoutKey: "one-card",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "지금의 나",
        short: "한 장으로 지금의 너를 가장 잘 보여주는 모습을 살펴본다냥.",
        long: "네가 지금 어떤 상태와 에너지를 가지고 있는지 알아본다냥.",
      },
    ],
  },
  "me-three-3": {
    emoji: "🌱",
    name: "나를 이루는 세 가지",
    layoutKey: "three-row",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "지금의 나",
        short: "지금의 나를 보여주는 카드다냥.",
        long: "현재 내가 가진 에너지와 모습을 살펴본다냥.",
      },
      {
        label: "숨겨진 나",
        short: "내 안에 숨겨진 나를 보여주는 카드다냥.",
        long: "아직 충분히 알아차리지 못한 나의 모습과 가능성을 알아본다냥.",
      },
      {
        label: "드러날 나",
        short: "앞으로 드러날 나를 보여주는 카드다냥.",
        long: "앞으로 내가 어떤 모습으로 변화해갈지 살펴본다냥.",
      },
    ],
  },
}
