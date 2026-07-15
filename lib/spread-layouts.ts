// lib/spread-layouts.ts
// 카드 배열(스프레드) 좌표의 단일 원본입니다. — Card.pdf 시안 기준
// 여기를 고치면 실제 리딩 화면과 스타일가이드(/design-1859)가 함께 바뀝니다.
//
// ┌─ 좌표 읽는 법 ────────────────────────────────────────────────────
// │ · left : 판 왼쪽 끝에서 카드 "중심"까지의 가로 위치 (50% = 정중앙)
// │ · top  : 판 위쪽 끝에서 카드 "중심"까지의 세로 위치
// │ · rotate: 카드 기울기(도). 90 = 가로로 눕힘 (켈틱 크로스의 2번 카드)
// │
// │ 새 스프레드 추가법: ① LayoutKey에 이름 추가 → ② 아래에 좌표 배열 추가
// │ → ③ /design-1859 스타일가이드의 스프레드 목록에 한 줄 추가
// │ (배열 순서 = 카드 번호 순서. 첫 항목이 1번 카드 자리)
// └──────────────────────────────────────────────────────────────────

export interface LayoutSlot {
  left: string
  top: string
  rotate: number
}

export type LayoutKey =
  | "one-card"
  | "two-card"
  | "three-1"
  | "three-2"
  | "four-1"
  | "four-2"
  | "five-1"
  | "five-2"
  | "seven-horseshoe"
  | "ten-celtic"

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

  // 2장 — 나란히 (Card.pdf의 [1][2])
  "two-card": [
    { left: "38%", top: "50%", rotate: 0 },
    { left: "62%", top: "50%", rotate: 0 },
  ],

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

  // 7장 말굽형 (Card.pdf 두 번째 배열)
  // 시안의 번호 순서 그대로: 1 오른쪽 중단 → 2·3 아래 → 4 왼쪽 중단 → 5·6·7 윗줄
  "seven-horseshoe": [
    { left: "72%", top: "52%", rotate: 0 }, // 1
    { left: "60%", top: "80%", rotate: 0 }, // 2
    { left: "40%", top: "80%", rotate: 0 }, // 3
    { left: "28%", top: "52%", rotate: 0 }, // 4
    { left: "28%", top: "22%", rotate: 0 }, // 5
    { left: "50%", top: "22%", rotate: 0 }, // 6
    { left: "72%", top: "22%", rotate: 0 }, // 7
  ],

  // 10장 켈틱 크로스 (Card.pdf 마지막 배열)
  // 왼쪽 십자: 1 가운데, 2 가로로 겹침, 3 위, 4 아래, 5 왼쪽, 6 오른쪽
  // 오른쪽 기둥: 아래에서 위로 7 → 8 → 9 → 10
  "ten-celtic": [
    { left: "32%", top: "50%", rotate: 0 }, //  1 가운데
    { left: "32%", top: "50%", rotate: 90 }, // 2 가운데에 가로로 겹침
    { left: "32%", top: "18%", rotate: 0 }, //  3 위
    { left: "32%", top: "82%", rotate: 0 }, //  4 아래
    { left: "12%", top: "50%", rotate: 0 }, //  5 왼쪽
    { left: "52%", top: "50%", rotate: 0 }, //  6 오른쪽
    { left: "80%", top: "84%", rotate: 0 }, //  7 기둥 맨 아래
    { left: "80%", top: "62%", rotate: 0 }, //  8
    { left: "80%", top: "40%", rotate: 0 }, //  9
    { left: "80%", top: "18%", rotate: 0 }, // 10 기둥 맨 위
  ],
}
