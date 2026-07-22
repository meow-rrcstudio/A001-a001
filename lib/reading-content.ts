// lib/reading-content.ts
// -----------------------------------------------------------------------------
// [콘텐츠 전용] 샨티의 대사, 세부 질문, 스프레드 포지션 문구를 정의합니다.
// 로직은 없습니다 — 문구·질문을 고치고 싶을 때 "이 파일만" 수정하면 됩니다.
// 프롬프트 조립 로직은 lib/reading-prompt-templates.ts 에 있습니다.
//
// confirmTemplate 안의 {q} 자리에는 사용자가 고른 질문이 들어갑니다.
// -----------------------------------------------------------------------------
import type { LayoutKey } from "@/lib/spread-layouts"
import type { ReadingTopicSlug } from "@/lib/reading-topics"

export interface SpreadPosition {
  label: string
  guide: string
}

export interface ReadingQuestion {
  slug: string
  label: string
  positions: SpreadPosition[]
  layoutKey: LayoutKey
  // 해석 스타일. 대부분 질문은 비워두면 기본(샨티 심리 리딩)으로 나갑니다.
  // 특별한 질문만 표시하면 그 질문에서만 전용 프롬프트가 나갑니다.
  //  · "variety_show" : 카드를 연애 프로그램·캐릭터·방송 서사로 캐스팅하는 재미 리딩
  readingStyle?: "variety_show"
}

export interface TopicContent {
  titleLabel: string
  reactionLine: string
  confirmTemplate: string // {q} = 선택한 질문
  domainSection: { key: string; label: string; guide: string }
  questions: ReadingQuestion[]
}

// 포지션 가이드 문구를 만드는 짧은 도우미 (콘텐츠의 일부로 간주)
function g(label: string) {
  return `${label}을(를) 떠올리며 골라보라냥`
}

export const topicContent: Record<ReadingTopicSlug, TopicContent> = {
  self: {
    titleLabel: "나 자신에 대한 이야기",
    reactionLine: "흠... 남을 보기 전에 나부터 봐야지. 요즘 스스로에게 좀 소홀했던 거 아니냥?",
    confirmTemplate: `"{q}"이라... 좋은 질문이구먼. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "growth", label: "성장을 위한 조언 🌱", guide: "자기이해+실천" },
    questions: [
      {
        slug: "current-mind",
        label: "지금 내 마음은 어떤 상태일까?",
        layoutKey: "three-arch",
        positions: [
          { label: "현재 마음", guide: g("지금 내 마음") },
          { label: "원인", guide: g("이런 마음이 든 이유") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "why-hard",
        label: "요즘 내가 힘든 진짜 이유는?",
        layoutKey: "four-diamond",
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
        layoutKey: "three-row",
        positions: [
          { label: "현재의 나", guide: g("지금의 나") },
          { label: "변화하는 모습", guide: g("변화하고 있는 모습") },
          { label: "앞으로의 성장", guide: g("앞으로의 성장") },
        ],
      },
      {
        slug: "needed-advice",
        label: "지금 가장 필요한 조언은?",
        layoutKey: "three-inverted",
        positions: [
          { label: "내려놓을 것", guide: g("내려놓아야 할 것") },
          { label: "붙잡을 것", guide: g("붙잡아야 할 것") },
          { label: "행동 조언", guide: g("지금 할 수 있는 행동") },
        ],
      },
      {
        slug: "hidden-strength",
        label: "내 강점과 숨겨진 재능은?",
        layoutKey: "four-grid",
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
        layoutKey: "three-arch",
        positions: [
          { label: "우선순위", guide: g("지금 우선순위") },
          { label: "방해 요소", guide: g("나를 방해하는 것") },
          { label: "집중할 방향", guide: g("집중해야 할 방향") },
        ],
      },
      {
        slug: "is-this-right",
        label: "지금 이 선택이 맞을까?",
        layoutKey: "three-inverted",
        positions: [
          { label: "선택의 장점", guide: g("이 선택의 장점") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "최종 조언", guide: g("마지막 조언") },
        ],
      },
      {
        slug: "near-future-me",
        label: "가까운 미래의 나는 어떤 모습일까?",
        layoutKey: "three-row",
        positions: [
          { label: "현재", guide: g("지금의 나") },
          { label: "가까운 미래", guide: g("가까운 미래의 나") },
          { label: "변화의 핵심", guide: g("변화를 이끄는 핵심") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 나에 대해 전체적으로 보고 싶어",
        layoutKey: "three-row",
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
    confirmTemplate: `"{q}"이라... 좋은 질문이구먼~ 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "connection_advice", label: "관계를 위한 조언 💗", guide: "감정_흐름+주의점1" },
    questions: [
      {
        slug: "their-feelings",
        label: "그 사람은 지금 나를 어떻게 생각할까?",
        layoutKey: "ten-celtic",
        positions: [
          { label: "지나온 흐름", guide: g("두 사람이 지나온 흐름") },
          { label: "겉으로 바라는 것", guide: g("그 사람이 겉으로 바라는 것") },
          { label: "지금 마음의 핵심", guide: g("그 사람의 지금 마음 핵심") },
          { label: "마음을 가로막는 것", guide: g("그 마음을 가로막는 것") },
          { label: "밑바닥의 진심", guide: g("마음 깊은 곳의 진심") },
          { label: "가까운 마음의 변화", guide: g("가까운 미래 상대 마음의 변화") },
          { label: "나의 태도", guide: g("내가 관계에서 보이는 태도") },
          { label: "주변의 영향", guide: g("두 사람을 둘러싼 환경") },
          { label: "기대와 두려움", guide: g("상대가 품은 기대와 두려움") },
          { label: "마음의 최종 방향", guide: g("상대 마음이 향하는 최종 방향") },
        ],
      },
      {
        slug: "relationship-future",
        label: "우리 관계는 앞으로 어떻게 될까?",
        layoutKey: "ten-celtic",
        positions: [
          { label: "지나온 관계", guide: g("두 사람이 지나온 관계") },
          { label: "바라는 관계의 모습", guide: g("두 사람이 바라는 관계의 모습") },
          { label: "지금 관계의 핵심", guide: g("지금 관계의 핵심") },
          { label: "관계를 가로막는 것", guide: g("관계를 가로막는 것") },
          { label: "관계의 밑바탕", guide: g("관계의 진짜 밑바탕") },
          { label: "가까운 미래", guide: g("관계의 가까운 변화") },
          { label: "나의 영향", guide: g("내가 관계에 주는 영향") },
          { label: "상대·주변의 영향", guide: g("상대와 주변이 관계에 주는 영향") },
          { label: "기대와 두려움", guide: g("관계에 대한 기대와 두려움") },
          { label: "관계의 최종 방향", guide: g("관계가 향하는 최종 방향") },
        ],
      },
      {
        slug: "reunion-chance",
        label: "재회 가능성은 있을까?",
        layoutKey: "ten-celtic",
        positions: [
          { label: "헤어지기까지의 흐름", guide: g("헤어지기까지의 흐름") },
          { label: "지금 바라는 것", guide: g("두 사람이 지금 바라는 것") },
          { label: "지금 사이의 핵심", guide: g("지금 두 사람 사이의 핵심") },
          { label: "재회를 가로막는 것", guide: g("재회를 가로막는 것") },
          { label: "남아 있는 감정", guide: g("관계에 남아 있는 감정") },
          { label: "가까운 미래", guide: g("가까운 미래의 흐름") },
          { label: "나의 태도", guide: g("재회를 향한 나의 태도") },
          { label: "상대의 마음·상황", guide: g("상대의 마음과 상황") },
          { label: "기대와 두려움", guide: g("재회에 대한 기대와 두려움") },
          { label: "재회 가능성의 결과", guide: g("재회 가능성의 최종 결과") },
        ],
      },
      {
        slug: "new-connection",
        label: "새로운 인연은 언제쯤 찾아올까?",
        layoutKey: "four-diamond",
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
        layoutKey: "four-grid",
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
        layoutKey: "three-inverted",
        positions: [
          { label: "현재 패턴", guide: g("반복되는 연애 패턴") },
          { label: "바꿔야 할 점", guide: g("바꿔야 할 부분") },
          { label: "성장 방향", guide: g("나아가야 할 방향") },
        ],
      },
      {
        slug: "should-i-text",
        label: "지금 연락해도 괜찮을까?",
        layoutKey: "three-arch",
        positions: [
          { label: "지금의 에너지", guide: g("지금 두 사람 사이의 기운") },
          { label: "연락 결과", guide: g("연락했을 때의 결과") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "yearly-love",
        label: "올해 내 연애운은 어떨까?",
        layoutKey: "five-two-three",
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
        layoutKey: "three-row",
        positions: [
          { label: "나의 마음", guide: g("지금 내 마음") },
          { label: "상대의 마음", guide: g("상대의 마음") },
          { label: "관계의 방향", guide: g("관계가 향하는 방향") },
        ],
      },
      {
        slug: "if-dating-show",
        label: "내가 연애 프로그램에 나간다면?",
        layoutKey: "four-diamond",
        readingStyle: "variety_show",
        // 이 리딩은 카드가 답을 '알려주는' 방식이라, 뭔가를 떠올리며 뽑는 게 아니라
        // 뽑아서 알아보는 문구를 씁니다. (그래서 g() 대신 직접 문구 지정)
        positions: [
          { label: "잘 맞는 프로그램", guide: "어떤 연애 프로그램이 어울릴지, 한 장 뽑아보라냥" },
          { label: "내 캐릭터", guide: "그 안에서 내 캐릭터는 어떨지 뽑아보라냥" },
          { label: "상대 캐릭터", guide: "내가 만날 상대는 어떤 캐릭터일지 뽑아보라냥" },
          { label: "우리의 서사", guide: "둘에게 어떤 이야기가 펼쳐질지 뽑아보라냥" },
        ],
      },
    ],
  },

  career: {
    titleLabel: "직업·커리어운",
    reactionLine: "일 얘기라... 요즘 마음이 편치 않았나 보군, 무엇부터 볼까?",
    confirmTemplate: `"{q}"이라... 이 몸이 봐주지. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "action_step", label: "다음 행동 💼", guide: "실용+유연성" },
    questions: [
      {
        slug: "should-change-job",
        label: "지금 이직하는 것이 좋을까?",
        layoutKey: "three-inverted",
        positions: [
          { label: "이직한다면", guide: g("이직했을 때의 흐름") },
          { label: "남는다면", guide: g("남았을 때의 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "should-stay",
        label: "현재 직장에서 계속 다니는 것이 맞을까?",
        layoutKey: "three-arch",
        positions: [
          { label: "계속 다닌다면", guide: g("계속 다녔을 때의 흐름") },
          { label: "떠난다면", guide: g("떠났을 때의 흐름") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "fit-job",
        label: "나에게 잘 맞는 직업은 무엇일까?",
        layoutKey: "four-row",
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
        layoutKey: "four-diamond",
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
        layoutKey: "four-grid",
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
        layoutKey: "three-row",
        positions: [
          { label: "시작한다면", guide: g("시작했을 때의 흐름") },
          { label: "주의점", guide: g("주의해야 할 점") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "how-others-see-me",
        label: "직장에서 나를 어떻게 보고 있을까?",
        layoutKey: "four-grid",
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
        layoutKey: "five-tee",
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
        layoutKey: "three-row",
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
    confirmTemplate: `"{q}"이라... 묵직한 질문이군. 이 질문을 떠올리며 마음을 담아 섞어보라냥.`,
    domainSection: { key: "caution", label: "주의할 점 💰", guide: "안정+미룬일_경고" },
    questions: [
      {
        slug: "yearly-money",
        label: "올해 금전운은 어떨까?",
        layoutKey: "five-two-three",
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
        layoutKey: "four-diamond",
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
        layoutKey: "three-inverted",
        positions: [
          { label: "투자한다면", guide: g("투자했을 때의 흐름") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "spending-habit",
        label: "소비를 줄여야 할 부분은 무엇일까?",
        layoutKey: "three-arch",
        positions: [
          { label: "소비 습관", guide: g("지금의 소비 습관") },
          { label: "줄일 부분", guide: g("줄여야 할 부분") },
          { label: "개선 방법", guide: g("개선할 방법") },
        ],
      },
      {
        slug: "side-income",
        label: "부수입이나 새로운 수익이 생길까?",
        layoutKey: "four-grid",
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
        layoutKey: "three-inverted",
        positions: [
          { label: "지출의 장점", guide: g("이 지출의 장점") },
          { label: "위험 요소", guide: g("주의해야 할 위험") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "when-stable",
        label: "재정적으로 언제쯤 안정될까?",
        layoutKey: "five-grid",
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
        layoutKey: "three-arch",
        positions: [
          { label: "위험 요소", guide: g("가장 주의해야 할 위험") },
          { label: "피해야 할 행동", guide: g("피해야 할 행동") },
          { label: "조언", guide: g("지금 필요한 조언") },
        ],
      },
      {
        slug: "general",
        label: "그냥 요즘 내 금전운이 궁금해",
        layoutKey: "three-row",
        positions: [
          { label: "현재 재정 흐름", guide: g("지금의 재정 흐름") },
          { label: "놓치고 있는 부분", guide: g("놓치고 있는 부분") },
          { label: "앞으로의 흐름", guide: g("앞으로의 흐름") },
        ],
      },
    ],
  },
}
