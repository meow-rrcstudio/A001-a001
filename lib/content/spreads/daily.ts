// lib/content/spreads/daily.ts
// [콘텐츠] 일상에 대한 이야기 스프레드.
//
// 채우는 법은 lib/content/spread-type.ts 머리말을 보세요.
// ⚠️ 열쇠(id)는 이 스프레드만의 이름이고, layoutKey 는 카드가 놓이는
//    좌표입니다. 여러 스프레드가 같은 좌표를 나눠 씁니다.
import type { Spread, SpreadId } from "@/lib/content/spread-type"

export const DAILY_SPREADS: Record<SpreadId, Spread> = {
  "day-flow-3": {
    emoji: "🌤",
    name: "하루의 흐름",
    layoutKey: "three-row",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "하루의 시작",
        short: "오늘 하루의 시작에 머무는 기운을 보여주는 카드다냥.",
        long: "아침부터 지금까지 이어지는 마음과 주변의 흐름을 살펴본다냥.",
      },
      {
        label: "지나며 만날 흐름",
        short: "오늘 하루를 지나며 만나게 될 흐름을 보여주는 카드다냥.",
        long: "예상하지 못한 순간과 변화의 기운을 살펴본다냥.",
      },
      {
        label: "끝에 남을 이야기",
        short: "오늘 하루의 끝에 남게 될 이야기를 보여주는 카드다냥.",
        long: "하루를 마친 뒤 얻게 될 깨달음과 마음의 흔적을 바라본다냥.",
      },
    ],
  },
  "day-path-3": {
    emoji: "🚶",
    name: "오늘의 길목",
    layoutKey: "three-arch",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "하루를 여는 분위기",
        short: "오늘 하루를 여는 분위기를 보여주는 카드다냥.",
        long: "지금 네 주변에 흐르는 에너지와 상황을 살펴본다냥.",
      },
      {
        label: "마주할 순간",
        short: "오늘 마주하게 될 순간을 보여주는 카드다냥.",
        long: "하루 속 작은 변화와 의미 있는 장면을 찾아본다냥.",
      },
      {
        label: "하루가 남기는 말",
        short: "오늘 하루가 너에게 남기는 메시지를 보여주는 카드다냥.",
        long: "하루를 통해 발견할 마음의 방향을 살펴본다냥.",
      },
    ],
  },
  "luck-find-3": {
    emoji: "🍀",
    name: "작은 행운의 발견",
    layoutKey: "three-row",
    resonatesWith: ["wind", "flower", "candle"],
    positions: [
      {
        label: "다가오는 행운",
        short: "오늘 너에게 다가오는 작은 행운의 기운을 보여주는 카드다냥.",
        long: "평범한 하루 속에서 발견할 수 있는 좋은 흐름과 기회를 살펴본다냥.",
      },
      {
        label: "찾아오는 순간",
        short: "행운이 찾아오는 순간을 보여주는 카드다냥.",
        long: "오늘 마주하게 될 뜻밖의 장면과 의미 있는 만남을 살펴본다냥.",
      },
      {
        label: "키우는 마음",
        short: "그 행운을 더 크게 만드는 마음의 태도를 보여주는 카드다냥.",
        long: "좋은 흐름을 알아보고 받아들이는 방법을 알려준다냥.",
      },
    ],
  },
  "day-gift-3": {
    emoji: "🎁",
    name: "오늘의 선물",
    layoutKey: "three-arch",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "숨겨진 선물",
        short: "오늘 하루에 숨겨진 작은 선물을 보여주는 카드다냥.",
        long: "이미 곁에 있지만 지나치고 있던 좋은 순간을 찾아본다냥.",
      },
      {
        label: "선물의 뜻",
        short: "그 선물이 너에게 전하는 의미를 보여주는 카드다냥.",
        long: "오늘의 경험 속에서 발견할 메시지를 살펴본다냥.",
      },
      {
        label: "이어가는 방향",
        short: "행운을 이어가는 방향을 보여주는 카드다냥.",
        long: "작은 기쁨을 삶의 흐름으로 이어가는 방법을 찾아본다냥.",
      },
    ],
  },
  "energy-5": {
    emoji: "⚡",
    name: "에너지의 흐름",
    layoutKey: "five-tee",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "머무는 곳",
        short: "지금 너의 에너지가 머물고 있는 곳을 보여주는 카드다냥.",
        long: "현재 가장 많은 마음과 힘을 쓰고 있는 방향을 살펴본다냥.",
      },
      {
        label: "움직이게 하는 것",
        short: "너의 에너지를 움직이게 하는 원인을 보여주는 카드다냥.",
        long: "무엇이 너를 이 흐름으로 이끌고 있는지 살펴본다냥.",
      },
      {
        label: "지금의 영향",
        short: "에너지가 향하고 있는 현재의 영향을 보여주는 카드다냥.",
        long: "지금의 흐름이 너에게 어떤 의미를 만들고 있는지 바라본다냥.",
      },
      {
        label: "조절할 것",
        short: "흘려보내거나 조절하면 좋은 에너지를 보여주는 카드다냥.",
        long: "너의 힘을 더 건강하게 쓰기 위한 방향을 찾아본다냥.",
      },
      {
        label: "채워줄 흐름",
        short: "앞으로 에너지를 채워줄 흐름을 보여주는 카드다냥.",
        long: "다시 힘을 얻기 위해 필요한 것을 알려준다냥.",
      },
    ],
  },
  "ripple-3": {
    emoji: "🌊",
    name: "마음의 물결",
    layoutKey: "three-arch",
    resonatesWith: ["wind", "moon", "flower"],
    positions: [
      {
        label: "향하는 방향",
        short: "지금 너의 에너지가 향하는 방향을 보여주는 카드다냥.",
        long: "최근 너의 마음과 관심이 어디로 흐르고 있는지 살펴본다냥.",
      },
      {
        label: "숨은 까닭",
        short: "그 흐름 속에 담긴 숨은 이유를 보여주는 카드다냥.",
        long: "무의식 속에서 움직이는 마음의 힘을 찾아본다냥.",
      },
      {
        label: "새로운 균형",
        short: "에너지의 흐름을 바꾸거나 이어갈 방향을 보여주는 카드다냥.",
        long: "지금 너에게 필요한 새로운 균형을 살펴본다냥.",
      },
    ],
  },
  "tired-root-3": {
    emoji: "🌑",
    name: "지침의 뿌리",
    layoutKey: "three-inverted",
    resonatesWith: ["stone", "moon", "root"],
    positions: [
      {
        label: "쌓인 피로",
        short: "지금 네 마음 아래에 쌓여 있는 피로를 보여주는 카드다냥.",
        long: "겉으로 보이지 않는 부담과 지친 마음의 모습을 살펴본다냥.",
      },
      {
        label: "지치게 한 흐름",
        short: "너를 지치게 만든 흐름을 보여주는 카드다냥.",
        long: "최근의 경험과 마음속 깊은 원인을 찾아본다냥.",
      },
      {
        label: "힘을 되찾는 길",
        short: "다시 힘을 되찾기 위한 방향을 보여주는 카드다냥.",
        long: "지금 너에게 필요한 회복의 방법을 살펴본다냥.",
      },
    ],
  },
  "tired-weight-3": {
    emoji: "🪨",
    name: "마음의 무게",
    layoutKey: "three-arch",
    resonatesWith: ["stone", "moon", "wind"],
    positions: [
      {
        label: "짊어진 무게",
        short: "지금 네가 짊어지고 있는 마음의 무게를 보여주는 카드다냥.",
        long: "무엇이 너의 에너지를 빼앗고 있는지 살펴본다냥.",
      },
      {
        label: "놓지 못한 감정",
        short: "아직 놓지 못한 감정을 보여주는 카드다냥.",
        long: "마음 깊은 곳에 남아 있는 이야기를 들여다본다냥.",
      },
      {
        label: "가벼워지는 흐름",
        short: "가벼워지기 위해 필요한 흐름을 보여주는 카드다냥.",
        long: "앞으로 마음을 돌보는 방향을 찾아본다냥.",
      },
    ],
  },
  "object-3": {
    emoji: "🧸",
    name: "나를 닮은 물건",
    layoutKey: "three-arch",
    resonatesWith: ["flower", "moon"],
    positions: [
      {
        label: "닮은 모습",
        short: "네가 가진 가장 닮은 모습을 보여주는 카드다냥.",
        long: "겉으로 드러나는 분위기와 너만의 특징을 살펴본다냥.",
      },
      {
        label: "숨은 의미",
        short: "그 물건 안에 담긴 숨은 의미를 보여주는 카드다냥.",
        long: "쉽게 보이지 않는 너의 가치와 마음을 들여다본다냥.",
      },
      {
        label: "전하는 이야기",
        short: "그 물건이 전하는 너만의 이야기를 보여주는 카드다냥.",
        long: "지금의 너를 표현하는 특별한 메시지를 찾아본다냥.",
      },
    ],
  },
  "symbol-5": {
    emoji: "🗿",
    name: "존재의 상징",
    layoutKey: "five-tee",
    resonatesWith: ["flower", "root", "moon"],
    positions: [
      {
        label: "나를 상징하는 것",
        short: "너를 상징하는 모습을 보여주는 카드다냥.",
        long: "지금 세상에 드러나는 너의 모습을 살펴본다냥.",
      },
      {
        label: "지켜온 힘",
        short: "너를 오래도록 지켜온 힘을 보여주는 카드다냥.",
        long: "너를 이루고 있는 깊은 기반을 찾아본다냥.",
      },
      {
        label: "숨겨진 특별함",
        short: "네 안에 숨겨진 특별함을 보여주는 카드다냥.",
        long: "다른 사람과 다른 너만의 결을 살펴본다냥.",
      },
      {
        label: "더 빛날 모습",
        short: "앞으로 더 빛날 너의 모습을 보여주는 카드다냥.",
        long: "새롭게 펼쳐질 가능성을 찾아본다냥.",
      },
      {
        label: "샨티가 본 의미",
        short: "샨티가 바라본 너라는 존재의 의미를 전하는 카드다냥.",
        long: "너 자신을 새로운 시선으로 바라보게 해준다냥.",
      },
    ],
  },
  "caution-3": {
    emoji: "🌫",
    name: "오늘의 주의 신호",
    layoutKey: "three-inverted",
    resonatesWith: ["moon", "wind"],
    positions: [
      {
        label: "조심할 마음",
        short: "오늘 네가 조심하면 좋을 마음의 모습을 보여주는 카드다냥.",
        long: "무심코 지나칠 수 있는 감정과 행동의 흐름을 살펴본다냥.",
      },
      {
        label: "작은 걸림돌",
        short: "오늘 마주할 수 있는 작은 걸림돌을 보여주는 카드다냥.",
        long: "주의하면 좋을 상황과 마음의 반응을 찾아본다냥.",
      },
      {
        label: "편안히 지나는 길",
        short: "하루를 더 편안하게 보내기 위한 방향을 보여주는 카드다냥.",
        long: "지혜롭게 지나가기 위해 필요한 태도를 알려준다냥.",
      },
    ],
  },
  "day-balance-4": {
    emoji: "⚖️",
    name: "하루의 균형",
    layoutKey: "four-grid",
    resonatesWith: ["candle", "root"],
    positions: [
      {
        label: "조심할 흐름",
        short: "오늘 조심해야 할 흐름을 보여주는 카드다냥.",
        long: "지금의 상황에서 주의 깊게 바라볼 부분을 살펴본다냥.",
      },
      {
        label: "생기는 까닭",
        short: "그 흐름이 생기는 이유를 보여주는 카드다냥.",
        long: "내 마음과 주변 환경의 영향을 함께 살펴본다냥.",
      },
      {
        label: "지킬 것",
        short: "오늘 지키면 좋은 것을 보여주는 카드다냥.",
        long: "흔들리지 않도록 기억할 마음의 중심을 찾아본다냥.",
      },
      {
        label: "마무리하는 법",
        short: "오늘 하루를 잘 마무리하는 방법을 보여주는 카드다냥.",
        long: "편안한 흐름으로 돌아가기 위한 방향을 살펴본다냥.",
      },
    ],
  },
  "week-7": {
    emoji: "🗓",
    name: "일주일의 흐름",
    layoutKey: "seven-horseshoe",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "주의 시작",
        short: "이번 주를 시작하는 흐름을 보여주는 카드다냥.",
        long: "현재 네 주변에 머무는 분위기와 시작의 기운을 살펴본다냥.",
      },
      {
        label: "초반의 흐름",
        short: "이번 주 초반에 만나게 될 흐름을 보여주는 카드다냥.",
        long: "새롭게 움직이는 일과 마음의 변화를 살펴본다냥.",
      },
      {
        label: "중반의 모습",
        short: "이번 주 중반에 펼쳐질 모습을 보여주는 카드다냥.",
        long: "현재 이어지고 있는 흐름과 중요한 순간을 바라본다냥.",
      },
      {
        label: "후반의 변화",
        short: "이번 주 후반으로 향하는 변화를 보여주는 카드다냥.",
        long: "점점 드러나는 방향과 가능성을 살펴본다냥.",
      },
      {
        label: "살펴볼 신호",
        short: "이번 주에 주의 깊게 바라볼 부분을 보여주는 카드다냥.",
        long: "놓치지 말아야 할 신호를 찾아본다냥.",
      },
      {
        label: "필요한 힘",
        short: "이번 주를 잘 보내기 위한 힘을 보여주는 카드다냥.",
        long: "필요한 태도와 마음가짐을 살펴본다냥.",
      },
      {
        label: "주가 남기는 말",
        short: "이번 주가 남기는 마지막 메시지를 보여주는 카드다냥.",
        long: "한 주의 끝에서 얻게 될 의미를 찾아본다냥.",
      },
    ],
  },
  "week-compass-5": {
    emoji: "🧭",
    name: "주간 나침반",
    layoutKey: "five-two-three",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "주의 방향",
        short: "이번 주의 전체적인 방향을 보여주는 카드다냥.",
        long: "지금부터 흘러갈 큰 흐름을 살펴본다냥.",
      },
      {
        label: "집중할 것",
        short: "이번 주에 집중하게 될 것을 보여주는 카드다냥.",
        long: "마음과 에너지가 향하는 곳을 찾아본다냥.",
      },
      {
        label: "마주할 변화",
        short: "이번 주에 마주할 변화를 보여주는 카드다냥.",
        long: "새롭게 펼쳐지는 상황과 가능성을 살펴본다냥.",
      },
      {
        label: "얻게 될 것",
        short: "이번 주를 지나며 얻는 것을 보여주는 카드다냥.",
        long: "경험 속에서 남는 배움을 찾아본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 전하는 주간의 안내를 담은 카드다냥.",
        long: "이번 주를 조금 더 다정하게 살아가는 방법을 알려준다냥.",
      },
    ],
  },
  "happy-find-3": {
    emoji: "🌼",
    name: "숨은 행복 찾기",
    layoutKey: "three-row",
    resonatesWith: ["flower", "wind", "moon"],
    positions: [
      {
        label: "곁의 행복",
        short: "지금 네 곁에 머물고 있는 작은 행복을 보여주는 카드다냥.",
        long: "이미 가까이에 있지만 지나치고 있던 기쁨과 순간을 살펴본다냥.",
      },
      {
        label: "놓치게 한 흐름",
        short: "그 행복을 놓치게 만든 마음의 흐름을 보여주는 카드다냥.",
        long: "바쁘거나 익숙해서 보지 못했던 소중한 것을 찾아본다냥.",
      },
      {
        label: "다시 찾는 법",
        short: "작은 행복을 다시 발견하는 방법을 보여주는 카드다냥.",
        long: "일상 속에서 기쁨을 키워가는 방향을 살펴본다냥.",
      },
    ],
  },
  "daily-treasure-3": {
    emoji: "💎",
    name: "일상의 보물",
    layoutKey: "three-inverted",
    resonatesWith: ["flower", "root", "candle"],
    positions: [
      {
        label: "숨겨진 보물",
        short: "네 주변에 숨겨진 작은 보물을 보여주는 카드다냥.",
        long: "평범한 하루 속 특별한 의미를 찾아본다냥.",
      },
      {
        label: "이어져 온 까닭",
        short: "그 행복이 오래도록 이어져 온 이유를 보여주는 카드다냥.",
        long: "너와 연결된 기억과 마음의 뿌리를 살펴본다냥.",
      },
      {
        label: "더 만나고 싶은 것",
        short: "앞으로 더 많이 만나고 싶은 행복의 방향을 보여주는 카드다냥.",
        long: "작은 기쁨을 삶 속에 초대하는 방법을 알려준다냥.",
      },
    ],
  },
  "env-6": {
    emoji: "🏞",
    name: "환경의 속삭임",
    layoutKey: "six-hex",
    resonatesWith: ["root", "moon"],
    positions: [
      {
        label: "둘러싼 환경",
        short: "지금 너를 둘러싼 환경의 모습을 보여주는 카드다냥.",
        long: "현재 머물고 있는 공간과 상황의 분위기를 살펴본다냥.",
      },
      {
        label: "보내오는 신호",
        short: "주변에서 보내오는 신호를 보여주는 카드다냥.",
        long: "사람과 사건, 일상의 흐름 속 메시지를 찾아본다냥.",
      },
      {
        label: "요구하는 변화",
        short: "환경이 너에게 요구하는 변화를 보여주는 카드다냥.",
        long: "지금의 흐름 속에서 필요한 움직임을 살펴본다냥.",
      },
      {
        label: "발견할 도움",
        short: "환경 속에서 발견할 수 있는 도움을 보여주는 카드다냥.",
        long: "주변에 이미 존재하는 기회와 자원을 찾아본다냥.",
      },
      {
        label: "나와의 균형",
        short: "환경과 너 사이의 균형을 보여주는 카드다냥.",
        long: "더 편안하게 연결되는 방법을 살펴본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 환경의 메시지를 담은 카드다냥.",
        long: "지금 머무는 자리에서 발견할 의미를 알려준다냥.",
      },
    ],
  },
  "scenery-5": {
    emoji: "🌄",
    name: "삶의 풍경",
    layoutKey: "five-two-three",
    resonatesWith: ["wind", "candle"],
    positions: [
      {
        label: "지금의 풍경",
        short: "지금 네 삶의 풍경을 보여주는 카드다냥.",
        long: "현재 주변에 펼쳐진 상황과 흐름을 바라본다냥.",
      },
      {
        label: "다가오는 기운",
        short: "환경 속에서 너에게 다가오는 기운을 보여주는 카드다냥.",
        long: "새롭게 알아차릴 변화와 가능성을 살펴본다냥.",
      },
      {
        label: "가르쳐주는 것",
        short: "주변이 너에게 가르쳐주는 것을 보여주는 카드다냥.",
        long: "지금의 경험 속에서 얻을 지혜를 찾아본다냥.",
      },
      {
        label: "함께 만들 방향",
        short: "환경과 함께 만들어갈 방향을 보여주는 카드다냥.",
        long: "앞으로 조율하면 좋은 부분을 살펴본다냥.",
      },
      {
        label: "샨티의 안내",
        short: "샨티가 건네는 작은 안내다냥.",
        long: "지금 네가 있는 자리의 의미를 바라보게 해준다냥.",
      },
    ],
  },
  "newdoor-3": {
    emoji: "🚪",
    name: "새로운 문을 여는",
    layoutKey: "three-row",
    resonatesWith: ["wind", "flower", "candle"],
    positions: [
      {
        label: "찾아오는 경험",
        short: "지금 네 삶에 찾아오려는 새로운 경험을 보여주는 카드다냥.",
        long: "아직 만나지 않은 가능성과 새로운 흐름을 살펴본다냥.",
      },
      {
        label: "가져올 변화",
        short: "그 경험이 너에게 가져다줄 변화를 보여주는 카드다냥.",
        long: "새로운 만남과 배움 속에서 얻을 것을 찾아본다냥.",
      },
      {
        label: "받아들이는 마음",
        short: "새로운 경험을 받아들이기 위한 마음의 방향을 보여주는 카드다냥.",
        long: "한 걸음 내딛기 위해 필요한 태도를 알려준다냥.",
      },
    ],
  },
  "adventure-7": {
    emoji: "🧭",
    name: "모험의 나침반",
    layoutKey: "seven-horseshoe",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "열려 있는 가능성",
        short: "지금 너에게 열려 있는 새로운 가능성을 보여주는 카드다냥.",
        long: "현재의 삶에서 시작되는 작은 변화를 살펴본다냥.",
      },
      {
        label: "바라보지 못한 것",
        short: "네가 아직 바라보지 못한 경험을 보여주는 카드다냥.",
        long: "새롭게 발견할 세계와 시선을 찾아본다냥.",
      },
      {
        label: "감정의 변화",
        short: "그 경험이 가져올 감정의 변화를 보여주는 카드다냥.",
        long: "마음속에 일어날 새로운 움직임을 살펴본다냥.",
      },
      {
        label: "만날 배움",
        short: "새로운 길에서 만날 배움을 보여주는 카드다냥.",
        long: "너를 성장시키는 순간을 찾아본다냥.",
      },
      {
        label: "가로막는 문",
        short: "그 경험을 가로막는 마음의 문을 보여주는 카드다냥.",
        long: "조금 내려놓으면 좋을 것을 살펴본다냥.",
      },
      {
        label: "받아들이는 법",
        short: "새로운 경험을 잘 받아들이는 방법을 보여주는 카드다냥.",
        long: "삶의 흐름과 조화를 이루는 방향을 알려준다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 새로운 시작의 메시지를 담은 카드다냥.",
        long: "앞으로 펼쳐질 가능성을 바라보게 해준다냥.",
      },
    ],
  },
  "chance-seed-3": {
    emoji: "🌱",
    name: "기회의 씨앗",
    layoutKey: "three-row",
    resonatesWith: ["wind", "flower", "candle"],
    positions: [
      {
        label: "앞에 놓인 기회",
        short: "지금 네 앞에 놓인 작은 기회를 보여주는 카드다냥.",
        long: "아직 크게 보이지 않지만 다가오고 있는 가능성을 살펴본다냥.",
      },
      {
        label: "기회의 의미",
        short: "그 기회가 가진 의미를 보여주는 카드다냥.",
        long: "왜 지금 너에게 찾아왔는지, 어떤 성장을 품고 있는지 바라본다냥.",
      },
      {
        label: "키우는 방법",
        short: "그 기회를 키워가는 방법을 보여주는 카드다냥.",
        long: "작은 가능성을 현실로 이어가기 위한 방향을 찾아본다냥.",
      },
    ],
  },
  "open-door-4": {
    emoji: "🚪",
    name: "열린 문",
    layoutKey: "four-diamond",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "열려 있는 문",
        short: "지금 너에게 열려 있는 문을 보여주는 카드다냥.",
        long: "눈앞에 있지만 아직 발견하지 못한 기회를 살펴본다냥.",
      },
      {
        label: "가리고 있는 것",
        short: "그 기회를 알아차리지 못하게 하는 것을 보여주는 카드다냥.",
        long: "망설임이나 익숙함 속에 가려진 마음을 들여다본다냥.",
      },
      {
        label: "잡았을 때의 흐름",
        short: "기회를 잡았을 때 펼쳐질 흐름을 보여주는 카드다냥.",
        long: "새로운 선택이 가져올 변화를 살펴본다냥.",
      },
      {
        label: "샨티의 메시지",
        short: "샨티가 전하는 기회의 메시지를 담은 카드다냥.",
        long: "지금 너에게 필요한 용기와 태도를 알려준다냥.",
      },
    ],
  },
  "life-now-1": {
    emoji: "🌿",
    name: "오늘의 삶의 흐름",
    layoutKey: "one-card",
    resonatesWith: ["wind", "moon"],
    positions: [
      {
        label: "삶의 흐름",
        short: "한 장으로 지금 너의 일상과 삶의 흐름을 살펴본다냥.",
        long: "현재 네가 어떤 에너지 속에 머물고 있는지 알아본다냥.",
      },
    ],
  },
  "life-three-3": {
    emoji: "🌊",
    name: "삶의 세 가지 흐름",
    layoutKey: "three-row",
    resonatesWith: ["wind", "moon", "flower"],
    positions: [
      {
        label: "지금의 상태",
        short: "지금 나의 삶의 상태를 보여주는 카드다냥.",
        long: "현재 일상에서 느끼는 흐름과 에너지를 살펴본다냥.",
      },
      {
        label: "들어오는 변화",
        short: "내 삶에 들어오고 있는 변화를 보여주는 카드다냥.",
        long: "앞으로 경험하게 될 새로운 흐름과 가능성을 알아본다냥.",
      },
      {
        label: "필요한 방향",
        short: "더 좋은 삶을 위해 필요한 방향을 보여주는 카드다냥.",
        long: "지금 나에게 필요한 선택과 마음가짐을 살펴본다냥.",
      },
    ],
  },
}
