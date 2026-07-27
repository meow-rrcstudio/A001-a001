// lib/free-question.ts
// 자유 질문 — 사용자가 직접 친 질문으로 보는 타로점(/tarot/ask).
//
// 주제별 미리 준비된 질문(lib/reading-content.ts)과 달리 문구가 그때그때
// 다릅니다. 화면과 서버가 같은 정의를 봐야 해서 여기 한 곳에 둡니다.
import type { ReadingQuestion } from "@/lib/reading-content"

/** 자유 질문에 쓰는 스프레드 — 시안의 6장 십자 배열 */
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
