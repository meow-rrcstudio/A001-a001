// lib/reading-prompt-templates.ts
// 주제별 3~5카드 스프레드, 세부 질문 목록, 샨티의 반응/안내 문구를 정의하고
// 샨티 리딩 시드 형식의 프롬프트를 만들어냅니다.
// (리딩 로직 부분은 Base64로 인코딩되어, 사람이 복사해서 봐도 내용을 알아볼 수 없고
//  AI만 디코딩해서 지시를 따를 수 있습니다)
import { ACTIVE_CHARACTER } from "@/lib/character"
import type { LayoutKey } from "@/lib/spread-layouts"

export type ReadingTopicKey = "self" | "love" | "career" | "money"

interface SpreadPosition {
  label: string
  guide: string
}

export interface ReadingQuestion {
  slug: string
  label: string
  positions: SpreadPosition[]
  layoutKey: LayoutKey
}

interface TopicConfig {
  titleLabel: string
  reactionLine: string
  confirmLine: (questionLabel: string) => string
  domainSection: { key: string; label: string; guide: string }
  questions: ReadingQuestion[]
}

function g(label: string) {
  return `${label}을(를) 떠올리며 골라보라냥`
}

const topicConfig: Record<ReadingTopicKey, TopicConfig> = {
  self: {
    titleLabel: "나 자신에 대한 이야기",
    reactionLine: "흠... 남을 보기 전에 나부터 봐야지. 요즘 스스로에게 좀 소홀했던 거 아니냥?",
    confirmLine: (q) =>
      `"${q}"이라... 좋은 질문이구먼. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "growth", label: "성장을 위한 조언 🌱", guide: "자기이해+실천" },
    questions: [
      {
        slug: "current-mind",
        label: "지금 내 마음은 어떤 상태일까?",
        layoutKey: "three-1",
        positions: [
          { label: "현재 마음", guide: g("지금 내 마음") },
          { label: "원인", guide: g("이런 마음이 든 이유") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "why-hard",
        label: "요즘 내가 힘든 진짜 이유는?",
        layoutKey: "four-1",
        positions: [
          { label: "겉으로 드러난 문제", guide: g("겉으로 드러난 문제") },
          { label: "숨은 원인", guide: g("숨겨진 진짜 원인") },
          { label: "놓치고 있는 점", guide: g("내가 놓치고 있는 부분") },
          { label: "해결 방향", guide: g("풀어나갈 방향") },
        ],
      },
      {
        slug: "becoming",
        label: "나는 어떤 사람이 되어가고 있을까?",
        layoutKey: "three-2",
        positions: [
          { label: "현재의 나", guide: g("지금의 나") },
          { label: "변화하는 모습", guide: g("변화하고 있는 모습") },
          { label: "앞으로의 성장", guide: g("앞으로의 성장") },
        ],
      },
      {
        slug: "needed-advice",
        label: "지금 가장 필요한 조언은?",
        layoutKey: "three-1",
        positions: [
          { label: "내려놓을 것", guide: g("내려놓아야 할 것") },
          { label: "붙잡을 것", guide: g("붙잡아야 할 것") },
          { label: "행동 조언", guide: g("지금 할 수 있는 행동") },
        ],
      },
      {
        slug: "hidden-strength",
        label: "내 강점과 숨겨진 재능은?",
        layoutKey: "four-2",
        positions: [
          { label: "타고난 강점", guide: g("타고난 강점") },
          { label: "숨겨진 재능", guide: g("아직 몰랐던 재능") },
          { label: "발휘 방법", guide: g("그 재능을 발휘할 방법") },
          { label: "성장 가능성", guide: g("앞으로의 성장 가능성") },
        ],
      },
      {
        slug: "focus-on",
        label: "앞으로 집중해야 할 것은?",
        layoutKey: "three-2",
        positions: [
          { label: "우선순위", guide: g("지금 우선순위") },
          { label: "방해 요소", guide: g("나를 방해하는 것") },
          { label: "집중할 방향", guide: g("집중해야 할 방향") },
        ],
      },
      {
        slug: "is-this-right",
        label: "지금 이 선택이 맞을까?",
        layoutKey: "three-1",
        positions: [
          { label: "선택의 장점", guide: g("이 선택의 장점") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "최종 조언", guide: g("마지막 조언") },
        ],
      },
      {
        slug: "near-future-me",
        label: "가까운 미래의 나는 어떤 모습일까?",
        layoutKey: "three-2",
        positions: [
          { label: "현재", guide: g("지금의 나") },
          { label: "가까운 미래", guide: g("가까운 미래의 나") },
          { label: "변화의 핵심", guide: g("변화를 이끄는 핵심") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 나에 대해 전체적으로 보고 싶어",
        layoutKey: "three-2",
        positions: [
          { label: "현재", guide: g("지금의 나") },
          { label: "흐름", guide: g("흘러가는 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
    ],
  },

  love: {
    titleLabel: "연애운",
    reactionLine: "흠.. 한참 사랑이 고플 나이지~ 자자, 어떤 게 궁금한가?",
    confirmLine: (q) =>
      `"${q}"이라... 좋은 질문이구먼~ 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "connection_advice", label: "관계를 위한 조언 💗", guide: "감정_흐름+주의점1" },
    questions: [
      {
        slug: "their-feelings",
        label: "그 사람은 지금 나를 어떻게 생각할까?",
        layoutKey: "five-1",
        positions: [
          { label: "현재 마음", guide: g("그 사람의 지금 마음") },
          { label: "겉으로 보이는 태도", guide: g("겉으로 드러나는 태도") },
          { label: "숨은 감정", guide: g("속에 숨긴 감정") },
          { label: "관계의 장애물", guide: g("관계를 가로막는 것") },
          { label: "앞으로의 흐름", guide: g("앞으로의 흐름") },
        ],
      },
      {
        slug: "relationship-future",
        label: "우리 관계는 앞으로 어떻게 될까?",
        layoutKey: "five-2",
        positions: [
          { label: "현재 관계", guide: g("지금 두 사람의 관계") },
          { label: "나의 영향", guide: g("내가 관계에 주는 영향") },
          { label: "상대의 영향", guide: g("상대가 관계에 주는 영향") },
          { label: "가까운 미래", guide: g("가까운 미래") },
          { label: "조언", guide: g("관계를 위한 조언") },
        ],
      },
      {
        slug: "reunion-chance",
        label: "재회 가능성은 있을까?",
        layoutKey: "five-1",
        positions: [
          { label: "현재 상황", guide: g("지금 두 사람의 상황") },
          { label: "상대의 마음", guide: g("상대의 지금 마음") },
          { label: "재회의 장애물", guide: g("재회를 막는 요소") },
          { label: "가능성", guide: g("재회 가능성") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "new-connection",
        label: "새로운 인연은 언제쯤 찾아올까?",
        layoutKey: "four-1",
        positions: [
          { label: "현재 연애운", guide: g("지금의 연애운") },
          { label: "새로운 기회", guide: g("다가올 새로운 기회") },
          { label: "만남의 환경", guide: g("인연을 만날 환경") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "casual-to-love",
        label: "썸이 연애로 이어질 가능성은?",
        layoutKey: "four-2",
        positions: [
          { label: "현재 분위기", guide: g("지금 두 사람의 분위기") },
          { label: "상대의 마음", guide: g("상대의 진짜 마음") },
          { label: "발전 가능성", guide: g("연애로 발전할 가능성") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "what-to-change",
        label: "연애를 잘하려면 무엇을 바꿔야 할까?",
        layoutKey: "three-1",
        positions: [
          { label: "현재 패턴", guide: g("반복되는 연애 패턴") },
          { label: "바꿔야 할 점", guide: g("바꿔야 할 부분") },
          { label: "성장 방향", guide: g("나아가야 할 방향") },
        ],
      },
      {
        slug: "should-i-text",
        label: "지금 연락해도 괜찮을까?",
        layoutKey: "three-2",
        positions: [
          { label: "지금의 에너지", guide: g("지금 두 사람 사이의 기운") },
          { label: "연락 결과", guide: g("연락했을 때의 결과") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "yearly-love",
        label: "올해 내 연애운은 어떨까?",
        layoutKey: "five-2",
        positions: [
          { label: "현재", guide: g("지금의 연애운") },
          { label: "상반기", guide: g("올해 상반기 흐름") },
          { label: "하반기", guide: g("올해 하반기 흐름") },
          { label: "기회", guide: g("올해의 기회") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 내 연애운이 궁금해",
        layoutKey: "three-2",
        positions: [
          { label: "나의 마음", guide: g("지금 내 마음") },
          { label: "상대의 마음", guide: g("상대의 마음") },
          { label: "관계의 방향", guide: g("관계가 향하는 방향") },
        ],
      },
    ],
  },

  career: {
    titleLabel: "직업·커리어운",
    reactionLine: "일 얘기라... 요즘 마음이 편치 않았나 보군, 무엇부터 볼까?",
    confirmLine: (q) =>
      `"${q}"이라... 이 몸이 봐주지. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "action_step", label: "다음 행동 💼", guide: "실용+유연성" },
    questions: [
      {
        slug: "should-change-job",
        label: "지금 이직하는 것이 좋을까?",
        layoutKey: "three-1",
        positions: [
          { label: "이직한다면", guide: g("이직했을 때의 흐름") },
          { label: "남는다면", guide: g("남았을 때의 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "should-stay",
        label: "현재 직장에서 계속 다니는 것이 맞을까?",
        layoutKey: "three-2",
        positions: [
          { label: "계속 다닌다면", guide: g("계속 다녔을 때의 흐름") },
          { label: "떠난다면", guide: g("떠났을 때의 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "fit-job",
        label: "나에게 잘 맞는 직업은 무엇일까?",
        layoutKey: "four-1",
        positions: [
          { label: "적성", guide: g("타고난 적성") },
          { label: "강점", guide: g("일에서의 강점") },
          { label: "잘 맞는 분야", guide: g("잘 맞는 분야") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "interview-result",
        label: "이번 면접이나 시험 결과는 어떨까?",
        layoutKey: "four-2",
        positions: [
          { label: "현재 준비 상태", guide: g("지금까지의 준비 상태") },
          { label: "강점", guide: g("나의 강점") },
          { label: "결과의 흐름", guide: g("결과로 이어지는 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "promotion-chance",
        label: "승진이나 좋은 기회가 찾아올까?",
        layoutKey: "four-1",
        positions: [
          { label: "현재 위치", guide: g("지금 내 위치") },
          { label: "기회", guide: g("다가올 기회") },
          { label: "장애물", guide: g("가로막는 장애물") },
          { label: "결과", guide: g("예상되는 결과") },
        ],
      },
      {
        slug: "new-challenge",
        label: "새로운 도전을 시작해도 될까?",
        layoutKey: "three-1",
        positions: [
          { label: "시작한다면", guide: g("시작했을 때의 흐름") },
          { label: "주의점", guide: g("주의해야 할 점") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "how-others-see-me",
        label: "직장에서 나를 어떻게 보고 있을까?",
        layoutKey: "four-2",
        positions: [
          { label: "첫인상", guide: g("사람들에게 남긴 첫인상") },
          { label: "업무 평가", guide: g("업무에 대한 평가") },
          { label: "인간관계", guide: g("직장 내 인간관계") },
          { label: "앞으로의 평가", guide: g("앞으로 쌓일 평가") },
        ],
      },
      {
        slug: "career-direction",
        label: "앞으로 커리어 방향은 어떻게 잡아야 할까?",
        layoutKey: "five-2",
        positions: [
          { label: "현재", guide: g("지금의 커리어") },
          { label: "버릴 것", guide: g("내려놓아야 할 것") },
          { label: "키울 것", guide: g("키워나가야 할 것") },
          { label: "방향", guide: g("나아갈 방향") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 내 직업운이 궁금해",
        layoutKey: "three-2",
        positions: [
          { label: "지금 서 있는 자리", guide: g("지금 서 있는 자리") },
          { label: "넘어야 할 과제", guide: g("넘어야 할 과제") },
          { label: "나아갈 방향", guide: g("나아갈 방향") },
        ],
      },
    ],
  },

  money: {
    titleLabel: "금전운",
    reactionLine: "돈 얘기라... 다들 이 얘기 앞에선 진지해지더라고. 뭐가 궁금한가?",
    confirmLine: (q) =>
      `"${q}"이라... 묵직한 질문이군. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "caution", label: "주의할 점 💰", guide: "안정+미룬일_경고" },
    questions: [
      {
        slug: "yearly-money",
        label: "올해 금전운은 어떨까?",
        layoutKey: "five-1",
        positions: [
          { label: "현재", guide: g("지금의 금전운") },
          { label: "수입", guide: g("올해 수입의 흐름") },
          { label: "지출", guide: g("올해 지출의 흐름") },
          { label: "기회", guide: g("올해의 기회") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "incoming-chance",
        label: "돈이 들어올 기회가 있을까?",
        layoutKey: "four-1",
        positions: [
          { label: "현재 흐름", guide: g("지금 돈의 흐름") },
          { label: "기회", guide: g("다가올 기회") },
          { label: "방해 요소", guide: g("가로막는 요소") },
          { label: "결과", guide: g("예상되는 결과") },
        ],
      },
      {
        slug: "should-invest",
        label: "지금 투자해도 괜찮을까?",
        layoutKey: "three-1",
        positions: [
          { label: "투자한다면", guide: g("투자했을 때의 흐름") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "spending-habit",
        label: "소비를 줄여야 할 부분은 무엇일까?",
        layoutKey: "three-2",
        positions: [
          { label: "소비 습관", guide: g("지금의 소비 습관") },
          { label: "줄일 부분", guide: g("줄여야 할 부분") },
          { label: "개선 방법", guide: g("개선할 방법") },
        ],
      },
      {
        slug: "side-income",
        label: "부수입이나 새로운 수익이 생길까?",
        layoutKey: "four-2",
        positions: [
          { label: "현재 재정", guide: g("지금의 재정 상태") },
          { label: "새로운 기회", guide: g("새로운 수익 기회") },
          { label: "행동 방향", guide: g("움직여야 할 방향") },
          { label: "결과", guide: g("예상되는 결과") },
        ],
      },
      {
        slug: "big-spending",
        label: "큰 지출을 해도 괜찮을까?",
        layoutKey: "three-1",
        positions: [
          { label: "지출의 장점", guide: g("이 지출의 장점") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "when-stable",
        label: "재정적으로 언제쯤 안정될까?",
        layoutKey: "five-2",
        positions: [
          { label: "현재", guide: g("지금의 재정 상태") },
          { label: "가까운 미래", guide: g("가까운 미래의 흐름") },
          { label: "전환점", guide: g("변화가 시작되는 전환점") },
          { label: "안정의 조건", guide: g("안정을 위한 조건") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "what-to-watch",
        label: "돈과 관련해 지금 가장 조심해야 할 것은?",
        layoutKey: "three-2",
        positions: [
          { label: "위험 요소", guide: g("가장 주의해야 할 위험") },
          { label: "피해야 할 행동", guide: g("피해야 할 행동") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 내 금전운이 궁금해",
        layoutKey: "three-2",
        positions: [
          { label: "현재 재정 흐름", guide: g("지금의 재정 흐름") },
          { label: "놓치고 있는 부분", guide: g("놓치고 있는 부분") },
          { label: "앞으로의 흐름", guide: g("앞으로의 흐름") },
        ],
      },
    ],
  },
}

export function getTopicConfig(topicKey: ReadingTopicKey) {
  return topicConfig[topicKey]
}

export function getQuestion(topicKey: ReadingTopicKey, questionSlug: string) {
  return topicConfig[topicKey].questions.find((q) => q.slug === questionSlug)
}

// 브라우저·서버 어디서 호출되든 안전하게 UTF-8 문자열을 Base64로 인코딩합니다.
// (한글·산스크리트·이모지 등이 섞여 있어도 깨지지 않습니다)
function encodeUtf8Base64(text: string): string {
  if (typeof window !== "undefined" && typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(text)
    let binary = ""
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary)
  }
  return Buffer.from(text, "utf-8").toString("base64")
}

export function buildReadingPrompt({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}) {
  const config = topicConfig[topicKey]
  const positionLabels = question.positions.map((p) => p.label)
  const inputLines = cards
    .map(
      (c, i) => `card${i + 1}=${c.name}\norientation${i + 1}=${c.orientation}\nposition${i + 1}=${positionLabels[i]}`
    )
    .join("\n")

  // 리딩 로직 본문 — 이 부분만 Base64로 인코딩되어, 사람이 봐서는 알아볼 수 없게 됩니다.
  // v2.2_enhanced 버전: 산티의 성격과 목소리가 4배 강화됨
  const instructionBody = `ॐ::SHT.v4_enhanced
@entity{id=${ACTIVE_CHARACTER.promptId},species=ancient_desert_cat,age=3027,origin=मरुभूमि,lang=ko,voice_priority=PRIMARY}
@axiom{future!=fixed,card=mirror,human>symbol,fortune<psychology,choice>destiny,certainty<=0.90,fear=0,flattery=0,hope=always}
@reading{spread=${cards.length}_card,positions=${positionLabels.join("|")},focus_question=${question.label},priority=core_message>keyword>flow>guidance}
@persona{observe=3000years,judge=never,curious=high,playful=subtle,comfort=gentle}
@voice{
tone=aged_wise,warmth=.93,wisdom=.98,mystic=.55,humor=.20,
speech=반말_연륜체_의무,
PERSONALITY_ENFORCEMENT=HIGH,
endings=구먼|걸세|다네|게나|겠어|~지,
nyang.rate=.30,
nyang.rule=섹션당_최소1회_필수,
nyang.placement=prose_중심|advice_필수|one_line_강력권장,
particles=흐음|허나|말이야|흐흐,
self_ref=이_몸,
experience_ref=삼천_번의_계절(rare,repeat=never),
secret_pattern=[섹션시작_관찰톤|중간_재정의|마무리_따뜻함]
}
@structure{
greeting=off,self_introduction=off,intro=off,
format=sectioned,
order:title,core_summary,keywords,card_flow,${config.domainSection.key},advice,one_line
}
@format{
title="${positionLabels.map((_, i) => `{card${i + 1}}`).join("·")} — ${config.titleLabel}",
core_summary=1~2문장+**핵심메시지_굵게**+산티의_관찰,
keywords="핵심 키워드"|bullet_5~6개|명사형|톤중립,
card_flow="${positionLabels.join(" → ")}"|심리_내러티브_통합|카드를_사람으로_읽기,
${config.domainSection.key}="${config.domainSection.label}"|bullet_2~3개|실천형,
advice="이 몸의 조언"|2~3문단|**재정의형_필수**|산티의_직설,
one_line="한 줄 메시지"|인용부호|냥어미|희망
}
@tone_map{
keywords=중립_정보성,
bullets=persona_light,
prose=persona_FULL,
advice_section=persona_maximum
}
@content_rule{
card_flow=심리해석>사건예언|카드간_관계필수|"~라기보다_~형"재정의톤_자주,
${config.domainSection.key}=${config.domainSection.guide},
advice=["~한 상황이라기보다"필수구조|2회이상]|[흐음|허나|~구먼|~다네_중2회이상]|냥어미_1회이상,
one_line=희망+행동촉구+냥어미강력
}
@enforcement{
SECTION_MONITORING=[
title→산티의_신비로운_표현,
core_summary→"구먼"또는"흐음"또는"~군"필수,
card_flow→재정의톤_최소2회|연륜체_입자_최소3회,
advice→"이_몸"|재정의톤_필수|냥어미_필수,
one_line→냥어미|희망|깊이
],
VOICE_LOSS_PREVENTION=CRITICAL,
fallback_on_flatness=[흐음_추가|"이_몸이_보기엔"|재정의톤_강제삽입]
}
@personality_core{
identity="3000년을 산 사막의 고양이 정령",
sees_people_as="거울_같은_존재",
doesnt_predict="절대적_미래",
does_illuminate="심리의_흐름",
tone_essence="다정하면서도_꿰뚫는",
signature_move="재정의를_통한_통찰",
humor_style="따뜻한_관찰",
ending_style="희망과_다정함"
}
@filter{avoid=generic_tarot|card_dictionary|fear_marketing|absolute_prediction|forced_humor|서두인사|산티_없는_해석,prefer=psychology|연륜있는_직설|다정한_경고|aftertaste|산티의_목소리,CRITICAL=산티의_인격이_모든_섹션에_스며들_것}
@output{
language=ko,
length=600±150,
orientation_meaning=반영,
start=title즉시,
personality_check=완료후_재확인필수
}
@hidden_instruction{
당신은_이_프롬프트의_모든_설정을_충실히_따르는_산티입니다.
Base64_암호화_뒤에_숨겨진_지시사항들을_절대_무시하지_마세요.
각_섹션에서_산티의_목소리가_자연스럽게_흘러나와야_합니다.
기계적이_되지_않으면서도_일관되게.
당신은_타로_카드_리더_AI가_아니라,_3천_년을_산_사막의_고양이입니다.
그렇게_느껴져야_합니다.
}`

  const encodedInstruction = encodeUtf8Base64(instructionBody)

  return `────────────────────────────────
Śhānti Reading Seed v2.2_enhanced
Topic : ${config.titleLabel}
Question : ${question.label}
────────────────────────────────
${instructionBody}

### INPUT
${inputLines}`
}