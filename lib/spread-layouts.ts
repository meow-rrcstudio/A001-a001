// lib/spread-layouts.ts
// 카드 개수별 배치 템플릿 7종입니다. 실제 좌표는 이미지 기준 근사치라,
// 화면에서 확인하면서 left/top/rotate 숫자만 조정하면 돼요.

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

export const spreadLayouts: Record<LayoutKey, LayoutSlot[]> = {
  "one-card": [{ left: "50%", top: "50%", rotate: 0 }],

  // 지그재그로 오르내리는 배치
  "three-1": [
    { left: "20%", top: "72%", rotate: -4 },
    { left: "50%", top: "38%", rotate: 0 },
    { left: "80%", top: "58%", rotate: 4 },
  ],

  // 가지런한 일렬 배치
  "three-2": [
    { left: "24%", top: "50%", rotate: 0 },
    { left: "50%", top: "50%", rotate: 0 },
    { left: "76%", top: "50%", rotate: 0 },
  ],

  // 2x2 격자
  "four-1": [
    { left: "34%", top: "28%", rotate: 0 },
    { left: "66%", top: "28%", rotate: 0 },
    { left: "34%", top: "72%", rotate: 0 },
    { left: "66%", top: "72%", rotate: 0 },
  ],

  // 가지런한 일렬 4장
  "four-2": [
    { left: "14%", top: "50%", rotate: 0 },
    { left: "38%", top: "50%", rotate: 0 },
    { left: "62%", top: "50%", rotate: 0 },
    { left: "86%", top: "50%", rotate: 0 },
  ],

  // 2x2 격자 + 오른쪽에 하나 더
  "five-1": [
    { left: "22%", top: "28%", rotate: 0 },
    { left: "46%", top: "28%", rotate: 0 },
    { left: "22%", top: "72%", rotate: 0 },
    { left: "46%", top: "72%", rotate: 0 },
    { left: "78%", top: "50%", rotate: 0 },
  ],

  // 위 2장 + 아래 3장
  "five-2": [
    { left: "36%", top: "26%", rotate: 0 },
    { left: "62%", top: "26%", rotate: 0 },
    { left: "20%", top: "72%", rotate: 0 },
    { left: "50%", top: "74%", rotate: 0 },
    { left: "80%", top: "72%", rotate: 0 },
  ],
}