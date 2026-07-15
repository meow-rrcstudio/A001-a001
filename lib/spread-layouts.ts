// lib/spread-layouts.ts
// 카드 배열(스프레드) 좌표의 단일 원본입니다. — Card.pdf 시안 기준
// 여기를 고치면 실제 리딩 화면과 스타일가이드(/design-1859)가 함께 바뀝니다.
//
// ┌─ 좌표 읽는 법 ────────────────────────────────────────────────────
// │ · left : 판 왼쪽 끝에서 카드 "중심"까지의 가로 위치 (50% = 정중앙)
// │ · top  : 판 위쪽 끝에서 카드 "중심"까지의 세로 위치
// │ · rotate: 카드 기울기(도). 시안은 모두 반듯하게 0
// └──────────────────────────────────────────────────────────────────

export interface LayoutSlot {
  left: string
  top: string
  rotate: number
}

export type LayoutKey =
  | "one-card"
  | "three-1"
  | "three-2"
  | "four-1"
  | "four-2"
  | "five-1"
  | "five-2"

// 3장 일렬 (Card.pdf)
const threeInARow: LayoutSlot[] = [
  { left: "24%", top: "50%", rotate: 0 },
  { left: "50%", top: "50%", rotate: 0 },
  { left: "76%", top: "50%", rotate: 0 },
]

// 4장 일렬 (Card.pdf)
const fourInARow: LayoutSlot[] = [
  { left: "14%", top: "50%", rotate: 0 },
  { left: "38%", top: "50%", rotate: 0 },
  { left: "62%", top: "50%", rotate: 0 },
  { left: "86%", top: "50%", rotate: 0 },
]

export const spreadLayouts: Record<LayoutKey, LayoutSlot[]> = {
  // 1장 — 정중앙
  "one-card": [{ left: "50%", top: "50%", rotate: 0 }],

  // 3장 — 시안에는 일렬 배치 하나뿐이라 두 키가 같은 배치를 씁니다.
  // (three-1/three-2 키는 질문 데이터가 참조하고 있어 하위 호환용으로 유지)
  "three-1": threeInARow,
  "three-2": threeInARow,

  // 4장 — 시안 기준 일렬 배치. 두 키 동일.
  "four-1": fourInARow,
  "four-2": fourInARow,

  // 5장 ① — 위 3장 + 아래 2장 (Card.pdf 첫 배열)
  "five-1": [
    { left: "26%", top: "28%", rotate: 0 },
    { left: "50%", top: "28%", rotate: 0 },
    { left: "74%", top: "28%", rotate: 0 },
    { left: "38%", top: "72%", rotate: 0 },
    { left: "62%", top: "72%", rotate: 0 },
  ],

  // 5장 ② — 십자형 (Card.pdf "5장(십자형)")
  // 순서: 1 위 → 2 왼쪽 → 3 가운데 → 4 오른쪽 → 5 아래
  "five-2": [
    { left: "50%", top: "22%", rotate: 0 },
    { left: "28%", top: "50%", rotate: 0 },
    { left: "50%", top: "50%", rotate: 0 },
    { left: "72%", top: "50%", rotate: 0 },
    { left: "50%", top: "78%", rotate: 0 },
  ],
}
