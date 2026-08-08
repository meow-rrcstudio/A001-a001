// lib/content/question-type.ts
// 준비된 질문 하나의 모양. 주제별 파일들이 이걸 보고 씁니다.
//
// ⚠️ 타입만 여기 둡니다. 질문 내용은 lib/content/questions/<주제>.ts 이고,
//    그것들을 모으는 곳은 lib/content/questions.ts 입니다.
//    주제 파일들이 questions.ts 를 보면 서로 물고 도는 참조가 됩니다.
import type { SpreadId } from "@/lib/content/spreads"
import type { TraitCode } from "@/lib/content/traits"
import type { Line, ShuffleStyle } from "@/lib/content/lines"

export interface PreparedQuestion {
  /** 영문 소문자·숫자·하이픈. 한 주제 안에서 겹치면 안 됩니다 */
  slug: string
  /** 사람이 보는 질문 문장 */
  label: string

  /**
   * 이 질문이 어울리는 사람.
   *
   * ⚠️ 사람의 성향(TraitProfile)과 같은 타입이지만 **역할이 반대**입니다.
   *    사람 쪽은 "나는 🌸🕯️🍃 다", 이쪽은 "이건 🌸🕯️ 인 사람에게 맞다".
   *    양쪽을 다 traits 라 부르면 코드에서 누구 것인지 매번 되짚게 됩니다.
   *    (lib/content/pick.ts 의 Weighted 참고)
   *
   * ⚠️ 세 갈래를 다 적을 필요는 없습니다. 뚜렷하게 기우는 것만 적으세요 —
   *    안 기우는 질문에 억지로 한쪽을 적으면 없는 신호를 만들어 절반의
   *    사람에게 까닭 없는 감점을 주는 셈입니다.
   */
  resonatesWith?: TraitCode[]

  /** 쓸 배열. 하나 이상. 여럿이면 그중 하나가 나갑니다 */
  spreads: SpreadId[]

  /**
   * 질문을 고른 직후 건네는 말. 하나 이상.
   *
   * ┌─ 왜 이것만 질문마다 쓰는가 ────────────────────────────────
   * │ 이 자리는 질문을 되읽는 자리입니다. 「지금의 마음이라...」처럼
   * │ 질문이 문장에 녹아 있어야 "듣고 있구나"가 됩니다.
   * │ 공용 풀에서 꺼내면 무슨 질문이든 같은 틀이 되는데, 한동안
   * │ 「무슨 질문이든 좋은 질문이구먼」이었던 까닭이 그것입니다.
   * └────────────────────────────────────────────────────────────
   *
   * ⚠️ 여러 개를 적으면 그중 하나가 나갑니다. 줄마다 resonatesWith 를
   *    달면 사람에 따라 갈립니다 — 안 달면 그냥 번갈아 나옵니다.
   */
  confirms: Line[]

  /**
   * 섞는 동안의 말을 어느 결에서 꺼낼까 (lib/content/lines.ts 의 풀).
   *
   * ⚠️ 이쪽은 풀입니다. 「마음이 가는 곳을 따라」는 어느 질문에도 붙어서,
   *    질문마다 네 개씩 240개를 쓸 까닭이 없습니다.
   *
   * ⚠️ 결 이름은 정해진 것 중에서만 고릅니다. 자유 문자열이면 오타가
   *    났을 때 그 질문만 조용히 빈 멘트가 되고, 눌러봐야 압니다.
   */
  shuffleStyle: ShuffleStyle

  /** 이 질문만 쓰는 섞기 멘트 — 대개 비워둡니다 (풀을 대신 씁니다) */
  shuffles?: Line[]

  /**
   * 이 질문만 다른 해석 프롬프트를 씁니다.
   * 비워두면 기본(샨티 심리 리딩)입니다.
   */
  readingStyle?: "variety_show"
}
