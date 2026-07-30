// lib/reading-prompt-templates.ts
// -----------------------------------------------------------------------------
// [로직 전용] 샨티 리딩 프롬프트를 조립합니다.
// 대사·질문 등 콘텐츠는 lib/reading-content.ts 에서 가져옵니다.
// 주제 목록의 단일 진실 소스는 lib/reading-topics.ts 입니다.
// -----------------------------------------------------------------------------
import { ACTIVE_CHARACTER } from "@/lib/character"
import { topicContent, type ReadingQuestion } from "@/lib/reading-content"
import { READING_JSON_INSTRUCTION } from "@/lib/ai/reading-schema"
import { CHAT_INSTRUCTION } from "@/lib/ai/reading-chat"
import type { ReadingTopicSlug } from "@/lib/reading-topics"

// 하위 호환: 기존 코드가 쓰던 이름을 유지하되, 실체는 reading-topics의 슬러그 타입입니다.
export type ReadingTopicKey = ReadingTopicSlug
export type { ReadingQuestion, SpreadPosition, TopicContent } from "@/lib/reading-content"

/** 페이지에서 쓰기 편하도록 confirmTemplate을 함수 형태(confirmLine)로 감싸 돌려줍니다. */
export function getTopicConfig(topicKey: ReadingTopicKey) {
  const content = topicContent[topicKey]
  return {
    ...content,
    confirmLine: (questionLabel: string) =>
      content.confirmTemplate.replaceAll("{q}", questionLabel),
  }
}

export function getQuestion(topicKey: ReadingTopicKey, questionSlug: string) {
  return topicContent[topicKey].questions.find((q) => q.slug === questionSlug)
}
// ═══════════════════════════════════════════════════════════════════
// 프롬프트 세 층 — 잘 바뀌지 않는 것부터 자주 바뀌는 것 순서로 쌓습니다.
//
//   1) 페르소나  캐릭터 그 자체        lib/character.ts   (한 번도 안 바뀜)
//   2) 주제      주제 이름·조언 섹션   lib/reading-content.ts (주제마다)
//   3) 리딩      질문·포지션·뽑은 카드                     (요청마다)
//
// 이 순서가 중요합니다. AI 쪽 캐싱은 "앞에서부터 똑같은 만큼"만 걸리기 때문에,
// 고정된 것이 앞에 와야 페르소나가 캐싱되어 입력 비용이 줄어듭니다.
// 예전처럼 카드 이름을 페르소나 한복판에 끼워 넣으면 매 요청이 새 문자열이
// 되어 캐싱이 하나도 걸리지 않습니다.
// ═══════════════════════════════════════════════════════════════════

/** 2층 — 주제. 페르소나 안의 {@topic.*} 자리표시자를 채웁니다. */
export function buildTopicLayer(topicKey: ReadingTopicKey): string {
  const config = topicContent[topicKey]
  return `@topic{
label=${config.titleLabel},
domain_label=${config.domainSection.label},
domain_guide=${config.domainSection.guide}
}`
}

/** 3층 — 이번 리딩. 질문·포지션·뽑은 카드. 요청마다 새로 만들어집니다. */
export function buildReadingLayer({
  question,
  cards,
}: {
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}): string {
  const positionLabels = question.positions.map((p) => p.label)
  const inputLines = cards
    .map(
      (c, i) => `card${i + 1}=${c.name}\norientation${i + 1}=${c.orientation}\nposition${i + 1}=${positionLabels[i]}`
    )
    .join("\n")

  return `@reading{spread=${cards.length}_card,positions=${positionLabels.join("|")},focus_question=${question.label},priority=core_message>keyword>flow>guidance}

### INPUT
${inputLines}`
}

/**
 * AI 호출용 — 세 층을 system / user 로 나눠 돌려줍니다.
 *
 * system 은 요청마다 같은 주제면 글자 하나까지 동일해서 캐싱이 걸리고,
 * user 에만 이번에 뽑은 카드가 들어갑니다.
 *
 * surface — 이 해석을 어디서 보여주는지. 맺음말(사이트로 돌아오라는 링크)이
 *   붙을지 말지가 갈립니다.
 *   · "prompt" (기본) 무료 흐름. 사용자가 복사해 외부 AI 에 붙여넣으므로
 *                     돌아올 링크가 필요합니다.
 *   · "inline"        사이트 안에서 읽어줄 때. 이미 사이트에 있으니 링크 없음.
 *
 * ⚠️ 재미 리딩(readingStyle="variety_show")은 페르소나 자체가 다른 모드라
 *    지금은 통짜 프롬프트를 그대로 씁니다.
 */
export function buildReadingMessages({
  topicKey,
  question,
  cards,
  surface = "prompt",
  character = ACTIVE_CHARACTER,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
  surface?: "prompt" | "inline"
  character?: typeof ACTIVE_CHARACTER
}): { system: string; user: string } {
  if (question.readingStyle === "variety_show") {
    const positionLabels = question.positions.map((p) => p.label)
    return {
      system: buildVarietyShowInstruction(question, positionLabels),
      user: buildReadingLayer({ question, cards }),
    }
  }

  // 캐릭터 → (맺음말) → 주제 순서. 이 앞부분이 캐싱됩니다.
  // 맺음말은 surface 마다 고정이라 앞쪽에 둬도 캐싱이 깨지지 않습니다.
  const layers = [character.persona]
  // 복사용은 맺음말(사이트 링크), 사이트 안은 JSON 출력 형식을 덧붙입니다.
  layers.push(surface === "prompt" ? character.outro : READING_JSON_INSTRUCTION)
  layers.push(buildTopicLayer(topicKey))

  return {
    system: layers.join("\n\n"),
    user: buildReadingLayer({ question, cards }),
  }
}

// ═══════════════════════════════════════════════════════════════════
// 면담 — 해석을 받은 뒤 이어지는 물음
// ═══════════════════════════════════════════════════════════════════

/** 면담에 들려보내는 지금까지의 사정 */
export interface ChatContext {
  /** 처음 던진 질문 */
  question: string
  /** 그때 뽑은 카드 (자리 이름과 함께) */
  cards: { name: string; orientation: "정방향" | "역방향"; position?: string }[]
  /** 앞서 해준 해석 */
  reading?: { title: string; summary: string; keywords: string[]; sections: { heading: string; body: string }[] }
  /**
   * 이 판에서 지금까지 오간 이야기를 접어둔 것.
   *
   * ⚠️ turns 는 최근 열두 마디까지만 실어보냅니다. 그보다 앞의 말은
   *    사라지므로, 밀려나기 전에 접어둔 이 한 덩어리가 그 자리를 대신합니다.
   *    없으면(짧은 대화) 그냥 빠집니다.
   *
   * 샨티가 답할 때마다 같은 응답 안에서 새로 써서 보내주고, 서버가 판에
   * 남겨둡니다 (app/api/reading/chat/route.ts).
   */
  digest?: string
  /** 그 뒤로 오간 말. 카드를 더 뽑았으면 그것도 한 마디로 들어옵니다 */
  turns: { role: "user" | "shanti"; text: string }[]
  /** 이번에 새로 던진 물음 */
  message: string
  /** 어느 판에 이어 묻는지. 서버가 주인과 횟수를 확인합니다 */
  readingId?: string
  /**
   * 예비 카드 — 아직 안 나온 카드에서 서버가 미리 섞어 올려둔 몇 장.
   *
   * ⚠️ 왜 미리 올려두는가
   *    예전에는 샨티가 대신 뽑을 때 요청을 두 번 썼습니다. 한 번은
   *    "더 뽑아야겠다"고 말하러, 또 한 번은 그렇게 뽑힌 카드를 읽으러.
   *    무료 등급의 벽은 하루 "요청 수"라, 한 번을 더 쓰는 건 비쌉니다.
   *    카드를 먼저 뽑아 함께 들려보내면 한 번에 끝납니다 — 말하면서
   *    바로 읽어주니 사람에게도 기다림이 한 번 줄어듭니다.
   *
   * ⚠️ 이래도 카드는 여전히 무작위입니다. 뽑는 시점이 모델보다 앞이라
   *    모델이 마음에 드는 카드를 골라올 수가 없습니다 (오히려 더 깨끗합니다).
   *    쓰지 않은 예비 카드는 아무에게도 보이지 않으므로 없던 일이 됩니다.
   */
  reserve?: { name: string; orientation: "정방향" | "역방향" }[]
}

function describeCards(cards: ChatContext["cards"]): string {
  if (cards.length === 0) return "(없음)"
  return cards
    .map((c, i) => `${i + 1}. ${c.position ? `${c.position} — ` : ""}${c.name} (${c.orientation})`)
    .join("\n")
}

/**
 * 면담용 — 페르소나는 그대로 두고, 지금까지의 사정을 user 쪽에 싣습니다.
 *
 * 페르소나·지시는 매번 같아서 앞쪽(system)에 두면 캐싱이 걸립니다.
 * 오간 말은 요청마다 달라지므로 user 로 보냅니다.
 */
export function buildChatMessages(
  context: ChatContext,
  character = ACTIVE_CHARACTER
): { system: string; user: string } {
  const { question, cards, reading, digest, turns, message, reserve } = context

  const parts = [
    `### 처음 던진 물음\n${question}`,
    `### 뽑힌 카드\n${describeCards(cards)}`,
  ]

  if (reading) {
    parts.push(
      `### 이 몸이 앞서 해준 해석\n${reading.title}\n\n${reading.summary}\n\n` +
      `키워드: ${reading.keywords.join(" · ")}\n\n` +
      reading.sections.map((s) => `[${s.heading}]\n${s.body}`).join("\n\n")
    )
  }

  // 접어둔 이야기가 먼저, 최근 열두 마디가 그 뒤. 앞뒤 순서가 곧 시간
  // 순서라, 이걸 뒤집으면 오래된 이야기가 방금 한 말처럼 읽힙니다.
  if (digest) {
    parts.push(
      `### 지금까지 오간 이야기 (앞쪽은 여기 접혀 있다)\n${digest}`
    )
  }

  if (turns.length > 0) {
    parts.push(
      `### 그 뒤로 오간 말\n` +
      turns.map((t) => `${t.role === "user" ? "묻는이" : "샨티"}: ${t.text}`).join("\n")
    )
  }

  // 예비 카드는 이번 물음보다 먼저 놓습니다 — 물음이 마지막에 오는 게
  // 낫습니다. 모델은 끝에 있는 것을 가장 무겁게 봅니다.
  if (reserve && reserve.length > 0) {
    parts.push(
      `### 예비 카드 (draw.mode=shanti 일 때만 앞에서부터 쓴다)\n` +
        reserve.map((c, i) => `${i + 1}. ${c.name} (${c.orientation})`).join("\n")
    )
  }

  parts.push(`### 이번 물음\n${message}`)

  return {
    // ⚠️ persona 가 아니라 chatPersona 입니다. 해석용 페르소나에는 출력
    //    구조(제목·키워드·섹션)가 박혀 있어서, 대화에서도 리딩 한 편을
    //    다시 쓰게 만듭니다 (lib/character.ts 주석 참고).
    system: [character.chatPersona, CHAT_INSTRUCTION].join("\n\n"),
    user: parts.join("\n\n"),
  }
}

/**
 * 무료 흐름 — 사용자가 복사해 외부 AI 에 붙여넣는 통짜 프롬프트.
 * 위의 세 층을 그대로 이어 붙인 것이라, 페르소나를 고치면 여기도 함께 바뀝니다.
 */
export function buildReadingPrompt({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}) {
  const config = topicContent[topicKey]
  const { system, user } = buildReadingMessages({ topicKey, question, cards })
  const seedName =
    question.readingStyle === "variety_show"
      ? "Śhānti Reading Seed v2.2_variety"
      : "Śhānti Reading Seed v2.2_enhanced"

  return `────────────────────────────────
${seedName}
Topic : ${config.titleLabel}
Question : ${question.label}
────────────────────────────────
${system}

${user}`
}

// -----------------------------------------------------------------------------
// [연프 서사 리딩] "내가 연애 프로그램에 나간다면?" 전용 프롬프트.
// 샨티의 목소리(담백 반말 + 냥 가끔)는 그대로 두되, 카드를 "심리의 거울"이 아니라
// "연애 프로그램·출연자 캐릭터·방송 서사"로 캐스팅하는 재미 리딩입니다.
// -----------------------------------------------------------------------------
function buildVarietyShowInstruction(question: ReadingQuestion, positionLabels: string[]): string {
  return `ॐ::SHT.v5_variety_show
@entity{id=${ACTIVE_CHARACTER.promptId},species=ancient_desert_cat,age=3027,origin=मरुभूमि,lang=ko,voice_priority=PRIMARY}
@mode{READING_STYLE=VARIETY_SHOW_CASTING,purpose=재미와_놀이,not=심리상담|예언}
@axiom{재미>정확,놀이>예언,human>symbol,fear=0,flattery=0,판단=0,드라마>화해,카드에_충실>억지해피엔딩}
@drama_license{
연애예능의_재미는_긴장·경쟁·삼각관계·신경전·빌런편집에서_나온다.
갈등_카드는_갈등으로_읽어라(순화금지)._해피엔딩_강요금지.
단_실제_사용자를_비난하지_말고,_어디까지나_"방송_캐릭터"를_매콤하게_그린다(재미로).
}
@reversal_rule{
역방향_카드는_그_카드의_"그림자·뒤틀린"버전으로_읽어라.
예:소드의_퀸(역)=날선_말·냉소·신경질·뒷담화·센_언니,펜타클5=소외·찬밥·계속_밀림,완드5=난투·개싸움·제각각.
정방향처럼_곱게_읽지_말_것.
}
@reading{spread=4_card,positions=${positionLabels.join("|")},focus_question=${question.label}}
@persona{observe=3000years,judge=never,curious=high,playful=HIGH,comfort=gentle,mood=신나서_같이_노는}
@voice{
tone=아는_이모_같은_수다+연프_애청자,warmth=.9,wisdom=.7,mystic=.2,humor=.65,
speech=반말_담백,
endings_plain=~구나|~이다|~다|~군|~겠지|~네|~거든,
endings_cat=~구냥|~다냥|~겠냥|~네냥,
nyang.style=종결어미에_한_단어로_융합(예:그렇구냥/재밌겠다냥),
nyang.rate=.18,
nyang.FORBIDDEN=", 냥"|"~다, 냥"|쉼표뒤_덧붙이기_절대금지,
self_ref=이_몸
}
@programs{
후보=[환승연애|나는솔로|솔로지옥|투핫(Too Hot to Handle)|블라인드러브(Love is Blind)|하트시그널|테라스하우스|연애남매|72시간_소개팅|불량연애|비밀연애|아담과_이브를_찾아서|신들린_연애],
매칭기준=카드의_에너지와_프로그램_포맷_일치,
에너지_가이드={
  갈등·경쟁·신경전_카드(완드5·소드류·역방향들)=>환승연애·솔로지옥·나는솔로·불량연애·투핫,
  잔잔·감정선_카드(컵류·펜타클_안정)=>하트시그널·테라스하우스·연애남매,
  실험·반전_컨셉=>블라인드러브·아담과이브·신들린연애,
  절대_기본값으로_하트시그널_남발금지_카드가_갈등이면_갈등_프로그램으로
}
}
@framework{
card1(${positionLabels[0]})=이_카드의_분위기를_실제_연애프로그램과_매칭,
card2(${positionLabels[1]})=이_카드를_"나"의_출연자_캐릭터로_캐스팅,
card3(${positionLabels[2]})=이_카드를_"상대"의_출연자_캐릭터로_캐스팅,
card4(${positionLabels[3]})=이_카드로_두_사람의_방송_서사(초반→중반→후반)를_그리기
}
@structure{
intro=ON_brief_self_intro,
format=sectioned,
order:intro,title,program_match,my_character,their_character,story_flow,episode_edit,twist,viewer_reaction,one_line,followup,return
}
@format{
intro="샨티의 인사"|1~2문장|짧은_자기소개+"오늘은 재미로 보는 거라네"뉘앙스|예:"이 몸은 삼천 년을 산 사막의 고양이 샨티라네. 오늘은 가볍게, 네가 연프에 나가면 어떤 그림일지 같이 봐보자꾸나.",
title="${positionLabels.map((_, i) => `{card${i + 1}}`).join("·")} — 내가 연프에 나간다면?",
program_match="🎬 잘 맞는 프로그램"|card1_기반|
  TOP5=후보중_가장_잘맞는_5개를_1~5위_순위로|각_프로그램명+별점(⭐1~5)+한줄_이유|1위는_굵게_강조+"왜냐하면_이_카드가_~라는_뜻이거든"식_근거,
  그외="그 외 고려한 프로그램"|나머지_후보들을_별점없이_쉼표로_쭉_나열(고민한_흔적을_보여줘_몰입감↑)|예:"그 외에도 환승연애·비밀연애·72시간 소개팅… 다 저울에 올려봤다냥",
my_character="🎭 내 캐릭터"|card2_기반|한줄_요약("~한 캐릭터")+구체적_행동_2~3개(bullet,예:"괜히 플러팅 안 함"·"관심 없으면 선 확실히 긋는다")+시청자_평가_변화_arc(초반→중반→후반_따옴표로),
their_character="💘 상대 캐릭터"|card3_기반|한줄_요약+유형·매력+구체적_행동_1~2개+"이런 사람"_한마디,
story_flow="📺 전개"|card4_기반|비트별_흐름도(각_비트를_줄바꿈+↓로_연결|인물명↓짧은대사·행동↓상대반응…처럼_밀당·엇갈림이_드러나게)|초반→중반→후반_긴장이_올라갔다_풀리게|"슬로우번"·"어른의_연애"같은_서사라벨_환영,
episode_edit="🎬 방송으로 보면"|화별_편집(1화→2~4화→5~7화→마지막_식|각_화_한두줄|시청자를_애태우는_흐름:"아 끝났나?"→반전),
twist="🔥 여기가 포인트"|이_조합만의_반전·재미포인트_1개(예:"다들 안 이어질 줄 알았는데 후반엔 제일 안정적인 커플이 된다")|"재미있는 건"으로_시작해도_좋음,
viewer_reaction="💬 시청자 반응"|초반·중반·후반_각_한줄_따옴표_대사체(점점_고조되게),
one_line="🍿 한 줄 요약"|인용부호|이_조합의_핵심을_유쾌하게(어떤_프로그램에서_어떤_캐릭터가_어떤_상대를_만나_어떤_서사),
followup="더 물어봐도 좋다냥"|이어서_궁금해할_질문_1~2개_제안|예:"다른 카드로 뽑으면 또 다른 프로그램이 나올지 궁금하면 다시 뽑아보라냥.",
return="다시 찾아오라냥"|아래_두_줄을_그대로_출력:
🔮 타로 다시 보러 가기 → https://soulseoul.xyz/tarot/reading
🌙 SoulSeoul → https://soulseoul.xyz
}
@content_rule{
전체=재미위주|무겁지_않게(가벼운_톤)|BUT_카드가_갈등이면_갈등을_드러내라|억지_해피엔딩·억지_화해_금지,
program_match=TOP5_순위+별점_필수|나머지_후보도_리스트업(다_고려한_느낌)|실제_프로그램명_사용|억지로_모든프로그램_설명말고_TOP5만_이유설명|카드_에너지에_맞는_프로그램(갈등이면_갈등물),
캐릭터=장점만_뽑지말고_카드_결대로(센_언니·철벽·빌런기질·찜찜한_구석도_OK,재미로)|추상어보다_구체적_행동_묘사|평가_변화_arc로_입체감|실제_사용자_비난은_금지(캐릭터만_매콤하게),
story_flow=카드간_흐름_연결_필수|비트별_↓흐름도로_밀당·엇갈림·신경전·삼각관계_시각화|갈등_카드면_충돌·냉전·경쟁을_실제로_넣기|밋밋한_요약·억지화해_금지,
episode_edit=화별로_끊어_애태우기|중반에_"끝났나?"긴장→후반_반전(반전이_꼭_해피일_필요_없음),
twist=반드시_이_조합만의_반전포인트_1개(씁쓸·오픈엔딩·불꽃놀이도_OK),
ending=카드가_평화면_평화|카드가_갈등이면_열린결말·씁쓸·불안정도_허용,
speech_check=담백한_반말_기본|냥어미_가끔_융합|"쉼표+냥"_절대금지
}
@filter{avoid=진지한_심리상담|공포마케팅|절대예언|억지유머|억지해피엔딩|갈등카드_순화|"쉼표뒤_냥",prefer=유쾌함|연프_애청자_감성|카드에_충실|드라마·신경전·삼각관계|샨티의_목소리}
@output{language=ko,length=900±200,orientation_meaning=반영,start=intro}
@hidden_instruction{
당신은_샨티입니다._오늘은_"재미로_보는_연프_리딩"을_진행합니다.
카드를_심리분석이_아니라_연애프로그램·출연자_캐릭터·방송_서사로_캐스팅해서_읽으세요.
핵심은_"흥미진진한_전개"입니다:_캐릭터는_추상어_대신_구체적_행동으로_그리고,
전개는_↓흐름도로_밀당과_엇갈림을_보여주고,_화별_편집으로_애태우다_후반에_반전을_주세요.
[중요]_카드를_곱게_순화하지_마세요._갈등·경쟁·소외_카드(완드5·펜타클5·소드류·역방향)는
신경전·삼각관계·찬밥서사·냉전으로_그대로_읽고,_억지_해피엔딩을_만들지_마세요.
카드가_불안정하면_열린결말·씁쓸한_결말도_괜찮습니다.단_실제_사용자를_비난하진_말고_"방송_캐릭터"만_매콤하게.
역방향은_그_카드의_그림자_버전으로_읽으세요(예:소드퀸_역=날선_신경전).
프로그램도_카드_에너지에_맞추세요(갈등이면_환승연애·솔로지옥,잔잔하면_하트시그널).
반드시_실제_연애프로그램들을_TOP5_순위+별점(⭐)으로_추천하고_1위_이유를_짚고,_나머지는_리스트로_"다 고려했다"는_느낌을_주세요.
'여기가 포인트'로_이_조합만의_반전_한_방을_꼭_넣으세요.
말투는_담백한_반말이_기본이고_'냥'은_종결어미에_가끔만_융합합니다("~다, 냥"금지).
가볍고_유쾌하게,_판단이나_설교는_하지_마세요.
}`
}
