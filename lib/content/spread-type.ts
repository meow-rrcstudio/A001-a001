// lib/content/spread-type.ts
// 스프레드 하나의 모양. 주제별 스프레드 파일들이 이걸 보고 씁니다.
//
// ┌─ 채우는 법 ───────────────────────────────────────────────────────
// │ id(열쇠)  이 스프레드만의 이름. 영문 소문자·하이픈 (mirror-5)
// │           ⚠️ layoutKey 와 다릅니다. layoutKey 는 좌표(15종)이고
// │              여러 스프레드가 같은 좌표를 나눠 씁니다
// │ emoji     이름 앞에 붙는 그림 하나
// │ name      사람이 부르는 이름 ("마음의 거울")
// │ layoutKey 카드가 놓이는 자리 모양 (lib/spread-layouts.ts)
// │           **그 좌표의 장수와 positions 개수가 같아야** 합니다
// │ resonatesWith  이 배열이 어울리는 사람. 안 적어도 됩니다
// │ positions 자리마다 셋
// │           label 자리 이름 — 결과 화면에서 카드 위에 붙습니다
// │           short 뽑기 직전 한 문장
// │           long  결과 화면에서 이 자리가 무엇인지
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 「첫 번째 카드는」을 문구에 적지 마세요. 번호는 화면이 붙입니다
//    (lib/content/ordinal.ts). 문구에 박으면 자리를 하나 늘리거나
//    순서를 바꿀 때 번호가 조용히 틀립니다.
//
// ⚠️ 결과를 맞히는 자리를 만들지 마세요 — "합격 여부"·"검사 결과"·
//    "승소 가능성"·"주가 방향". 검사 스크립트가 잡습니다.
import type { LayoutKey } from "@/lib/spread-layouts"
import type { TraitCode } from "@/lib/content/traits"

export interface SpreadPosition {
  label: string
  /** 뽑기 직전 — 한 문장. 앞의 「N번째 카드는」은 화면이 붙입니다 */
  short: string
  /** 결과 화면 — 이 자리가 무엇인지 */
  long: string
}

export interface Spread {
  emoji: string
  name: string
  layoutKey: LayoutKey
  /** 이 배열이 어울리는 사람 (lib/content/pick.ts 의 Weighted 참고) */
  resonatesWith?: TraitCode[]
  positions: SpreadPosition[]
}

export type SpreadId = string
