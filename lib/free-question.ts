// lib/free-question.ts
// 자유 질문 — 사용자가 직접 친 질문으로 보는 타로점(/tarot/ask).
//
// 주제별 미리 준비된 질문(lib/reading-content.ts)과 달리 문구가 그때그때
// 다릅니다. 화면과 서버가 같은 정의를 봐야 해서 여기 한 곳에 둡니다.
import type { ReadingQuestion } from "@/lib/reading-content"
import type { QuestionAudit } from "@/lib/question-safety"
import { josaFor } from "@/lib/korean-josa"

/**
 * 자유 질문에 쓰는 스프레드 — 시안의 6장 십자 배열.
 *
 * ⚠️ 이 여섯 자리는 "관계"를 보는 자리입니다(상대의 마음). 무슨 질문이든
 *    이걸 깔면 진로 질문에도 "상대의 마음"이 뜨고, 몸이 아픈 사람에게
 *    "다가올 흐름"을 묻게 됩니다. 분류에 맞는 자리는 아래
 *    FREE_SPREADS 에서 고릅니다 — 이건 그중 "관계형"입니다.
 */
export const FREE_QUESTION_POSITIONS = [
  { label: "지나온 흐름", guide: "지나온 흐름을 떠올리며 골라보라냥" },
  { label: "지금 마음", guide: "지금 네 마음을 떠올리며 골라보라냥" },
  { label: "상대의 마음", guide: "상대의 마음을 떠올리며 골라보라냥" },
  { label: "가로막는 것", guide: "가로막는 것을 떠올리며 골라보라냥" },
  { label: "다가올 흐름", guide: "다가올 흐름을 떠올리며 골라보라냥" },
  { label: "조언", guide: "지금 필요한 조언을 떠올리며 골라보라냥" },
]

/** 서버가 이 슬러그를 보고 "미리 준비된 질문이 아니라 자유 질문"임을 압니다 */
export const FREE_QUESTION_SLUG = "free"

/**
 * 사용자가 친 문구를 질문으로 만들어 줍니다.
 *
 * plan 을 넘기면 샨티가 이 질문에 맞게 고른 배열(장수·자리 이름)을 씁니다.
 * 없으면 기본 6장 십자 배열입니다.
 */
export function buildFreeQuestion(
  label: string,
  plan?: { layoutKey: string; positions: { label: string; guide: string }[] } | null
): ReadingQuestion {
  return {
    slug: FREE_QUESTION_SLUG,
    label,
    layoutKey: (plan?.layoutKey ?? "six-cross") as ReadingQuestion["layoutKey"],
    positions: plan?.positions ?? FREE_QUESTION_POSITIONS,
  }
}

// ═══════════════════════════════════════════════════════════════════
// 분류마다 다른 여섯 자리
//
// ┌─ 왜 여섯 장을 지키는가 ───────────────────────────────────────────
// │ 장수는 곧 체감입니다. 한동안 자유 질문이 세 장으로만 나온 적이
// │ 있는데(배열 고르기 호출이 실패하면 세 장으로 떨어졌습니다),
// │ 그때 "약하다"는 말이 나왔습니다. 그래서 자리 이름은 질문에 맞게
// │ 갈되, 장수는 여섯으로 지킵니다.
// │
// │ 유료로 보는 판은 여기 오기 전에 샨티가 직접 고릅니다(1~10장).
// │ 이 표는 ① 로그인 전 맛보기 ② 샨티가 못 골랐을 때의 기본값입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ "돌봄형"에는 앞일을 묻는 자리가 없습니다. 검사 결과나 재판을
//    앞둔 사람에게 "다가올 흐름" 자리를 내밀면, 그 자리가 곧
//    결과 예측이 됩니다 (lib/question-safety.ts).
interface FreeSpread {
  layoutKey: string
  intro: string
  positions: { label: string; guide: string }[]
}

const 관계형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음, 사람 사이의 일이구나. 여섯 장으로 그 사이를 들여다보자꾸나.",
  positions: FREE_QUESTION_POSITIONS,
}

const 사이형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음, 곁에 있는 사람 이야기구나. 여섯 장으로 그 사이를 짚어보자꾸나.",
  positions: [
    { label: "지나온 사이", guide: "둘이 지나온 시간을 떠올리며 골라보라냥" },
    { label: "지금 내 마음", guide: "지금 네 마음을 떠올리며 골라보라냥" },
    { label: "그 사람의 마음", guide: "그 사람의 마음을 떠올리며 골라보라냥" },
    { label: "어긋난 자리", guide: "어디서부터 어긋났는지 떠올리며 골라보라냥" },
    { label: "앞으로의 사이", guide: "앞으로의 사이를 떠올리며 골라보라냥" },
    { label: "내가 할 수 있는 것", guide: "자 마지막이야. 네가 할 수 있는 것을 떠올리며 골라보라냥" },
  ],
}

const 방향형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음, 길을 고르는 물음이구나. 여섯 장으로 갈래를 짚어보자꾸나.",
  positions: [
    { label: "지금 자리", guide: "지금 네가 선 자리를 떠올리며 골라보라냥" },
    { label: "내가 바라는 것", guide: "네가 정말 바라는 것을 떠올리며 골라보라냥" },
    { label: "나를 붙드는 것", guide: "너를 붙들고 있는 것을 떠올리며 골라보라냥" },
    { label: "열려 있는 길", guide: "네 앞에 열린 길을 떠올리며 골라보라냥" },
    { label: "다가올 흐름", guide: "다가올 흐름을 떠올리며 골라보라냥" },
    { label: "다음 걸음", guide: "자 마지막이야. 다음 한 걸음을 떠올리며 골라보라냥" },
  ],
}

const 셈형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음, 셈이 걸린 물음이구나. 여섯 장으로 흐름을 짚어보자꾸나.",
  positions: [
    { label: "지금 흐름", guide: "지금의 흐름을 떠올리며 골라보라냥" },
    { label: "내 씀씀이", guide: "네가 쓰고 있는 방식을 떠올리며 골라보라냥" },
    { label: "놓치고 있는 것", guide: "네가 못 보고 있는 것을 떠올리며 골라보라냥" },
    { label: "새는 자리", guide: "어디서 새고 있는지 떠올리며 골라보라냥" },
    // ⚠️ 여기에 "다가올 흐름"을 두지 않습니다. 투자 질문에 그 자리를 깔면
    //    자리 이름 자체가 시세 예측이 됩니다 (lib/question-safety.ts).
    { label: "휩쓸리는 자리", guide: "네가 자꾸 휩쓸리는 순간을 떠올리며 골라보라냥" },
    { label: "지켜야 할 기준", guide: "자 마지막이야. 네가 지켜야 할 기준을 떠올리며 골라보라냥" },
  ],
}

const 내면형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음, 네 안을 들여다보는 물음이구나. 여섯 장으로 천천히 보자꾸나.",
  positions: [
    { label: "지금 마음", guide: "지금 네 마음을 떠올리며 골라보라냥" },
    { label: "그 아래 있는 것", guide: "그 마음 아래 무엇이 있는지 떠올리며 골라보라냥" },
    { label: "가로막는 것", guide: "너를 가로막는 것을 떠올리며 골라보라냥" },
    { label: "내게 있는 힘", guide: "네 안에 있는 힘을 떠올리며 골라보라냥" },
    { label: "흐르는 방향", guide: "지금 흐르는 방향을 떠올리며 골라보라냥" },
    { label: "지금 붙잡을 것", guide: "자 마지막이야. 지금 붙잡을 것을 떠올리며 골라보라냥" },
  ],
}

/**
 * 무거운 물음에 쓰는 여섯 자리.
 *
 * ⚠️ 앞일을 묻는 자리가 하나도 없습니다. 검사 결과나 재판을 기다리는
 *    사람에게 "다가올 흐름" 자리를 내밀면 그 자리가 곧 결과 예측이
 *    됩니다. 대신 지금 붙잡을 것과 곁에 있는 것을 봅니다.
 */
const 돌봄형: FreeSpread = {
  layoutKey: "six-cross",
  intro: "흐음… 무거운 물음이구나. 앞일을 맞히는 대신, 지금 네 곁을 여섯 장으로 보자꾸나.",
  positions: [
    { label: "지금 마음", guide: "지금 네 마음을 떠올리며 골라보라냥" },
    { label: "가장 무거운 것", guide: "무엇이 가장 무거운지 떠올리며 골라보라냥" },
    { label: "붙잡고 있는 것", guide: "네가 놓지 못하는 것을 떠올리며 골라보라냥" },
    { label: "곁에 있는 것", guide: "네 곁에 있는 사람과 것들을 떠올리며 골라보라냥" },
    { label: "내게 있는 힘", guide: "네 안에 있는 힘을 떠올리며 골라보라냥" },
    { label: "오늘 한 걸음", guide: "자 마지막이야. 오늘 할 수 있는 한 걸음을 떠올리며 골라보라냥" },
  ],
}

// ═══════════════════════════════════════════════════════════════════
// 카드를 섞기 전에 건네는 첫 마디
//
// ┌─ 「좋은 질문이구먼」을 걷어낸 까닭 ────────────────────────────────
// │ 무엇을 쳐도 같은 칭찬이 돌아왔습니다.
// │
// │     "힘들다"이라... 좋은 질문이구먼.
// │     "나 암이래 너무 걱정돼"이라... 좋은 질문이구먼.
// │
// │ 물음이 아니라 털어놓은 말인데 물음이라 부르고, 무거운 말인데
// │ 좋다고 합니다. 규칙을 어긴 것이 아니라 문장이 원래 그렇게 박혀
// │ 있었습니다 — 무슨 말이 오든 한 벌뿐이었으니까요.
// │
// │ 칭찬을 등급에 따라 갈라 붙이는 대신 아예 뺐습니다. 남의 말을
// │ 평하지 않고 받기만 하면, 어떤 말이 와도 어긋나지 않습니다.
// │ 샨티다움은 칭찬이 아니라 "이 몸이 봐주지" 쪽에 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 거절하는 말이 아닙니다. 무거운 물음에도 타로는 그대로 이어집니다 —
//    다만 무엇을 보는 자리인지를 먼저 일러둡니다. 연락처는 이 말이
//    아니라 화면이 내밉니다 (components/question-care-notice.tsx).

/** 등급·분류에 따라 갈리는 첫 마디의 가운데 토막 */
const INTRO_BODY: { crisis: string; sensitive: Partial<Record<string, string>>; normal: string } = {
  crisis: "그 말을 그냥 흘려듣지 않겠다냥. 카드보다 먼저 네가 걱정이구먼.",
  sensitive: {
    의료: "걱정이 크겠구먼. 이 몸이 결과를 맞히지는 못한다만, 그 시간을 어떻게 지날지는 같이 보자꾸나.",
    법률: "머리가 복잡하겠구먼. 옳고 그름은 카드가 정하지 못한다만, 그 시간을 버티는 힘은 볼 수 있다냥.",
    투자: "돈이 오르내리는 것은 카드가 정하지 못한다만, 네가 무엇을 보고 고르는지는 들여다볼 수 있다냥.",
    범죄: "마음이 많이 뒤집혔구먼. 그 마음을 어디에 둘지 같이 보자꾸나.",
    자기성찰: "많이 무거웠겠구먼. 천천히 같이 보자꾸나.",
  },
  normal: "이 몸이 봐주지.",
}

/**
 * 사용자가 친 물음을 되읽으며 건네는 첫 마디.
 *
 * ⚠️ 「"힘들다"이라」가 아니라 「"힘들다"라」입니다. 조사는 앞말의 받침을
 *    따라가는데 문장에 "이라"가 박혀 있었습니다. 사용자가 치는 말은
 *    무엇으로 끝날지 알 수 없으니 셈해서 붙입니다 (lib/korean-josa.ts).
 */
export function freeIntroFor(question: string, audit?: QuestionAudit | null): string {
  const asked = question.trim()
  const 라 = josaFor(asked, "이라라")

  const body =
    audit?.level === "crisis"
      ? INTRO_BODY.crisis
      : audit?.level === "sensitive"
        ? (INTRO_BODY.sensitive[audit.category] ?? INTRO_BODY.normal)
        : INTRO_BODY.normal

  return `"${asked}"${라}... ${body} 마음을 담아 섞어보라냥.`
}

/**
 * 이 물음에 어떤 여섯 자리를 깔 것인가.
 *
 * 분류를 못 했거나(기타) 읽어보지 않은 물음이면 내면형입니다 —
 * 무슨 질문에든 어긋나지 않는 자리들입니다.
 */
export function freeSpreadFor(audit?: QuestionAudit | null): FreeSpread {
  if (!audit) return 내면형

  // 위기와 몸·법·해코지 이야기는 돌봄형으로. 돈 이야기는 무겁더라도
  // 셈형이 맞습니다 — 거기엔 이미 앞일을 묻는 자리가 없습니다.
  if (audit.level === "crisis") return 돌봄형
  if (audit.level === "sensitive" && audit.category !== "투자") return 돌봄형

  switch (audit.category) {
    case "연애":
      return 관계형
    case "인간관계":
    case "가족":
      return 사이형
    case "직장":
    case "진로":
      return 방향형
    case "금전":
    case "투자":
      return 셈형
    default:
      return 내면형
  }
}
