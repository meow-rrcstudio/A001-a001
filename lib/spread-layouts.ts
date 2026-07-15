// lib/spread-layouts.ts
// 카드 배열(스프레드) 좌표의 단일 원본입니다. — Soul Seoul Site design.pdf 기준
// 여기를 고치면 실제 리딩 화면과 스타일가이드(/design-1859)가 함께 바뀝니다.
//
// ┌─ 좌표 읽는 법 ────────────────────────────────────────────────────
// │ · left : 판 왼쪽 끝에서 카드 "중심"까지의 가로 위치 (50% = 정중앙)
// │ · top  : 판 위쪽 끝에서 카드 "중심"까지의 세로 위치
// │ · rotate: 카드 기울기(도). 90 = 가로로 눕힘, ±8 = 살짝 비스듬히
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
  | "three-row"
  | "three-arch"
  | "three-inverted"
  | "four-row"
  | "four-diamond"
  | "four-grid"
  | "five-tee"
  | "five-grid"
  | "five-two-three"
  | "six-cross"
  | "six-hex"
  | "seven-horseshoe"
  | "ten-celtic"

export const spreadLayouts: Record<LayoutKey, LayoutSlot[]> = {
  // ── 1~2장 ──────────────────────────────────────────────
  // 1장 — 정중앙
  "one-card": [{ left: "50%", top: "50%", rotate: 0 }],

  // 2장 — 나란히 (Card.pdf)
  "two-card": [
    { left: "38%", top: "50%", rotate: 0 },
    { left: "62%", top: "50%", rotate: 0 },
  ],

  // ── 3장 ────────────────────────────────────────────────
  // 일렬
  "three-row": [
    { left: "33%", top: "50%", rotate: 0 },
    { left: "50%", top: "50%", rotate: 0 },
    { left: "67%", top: "50%", rotate: 0 },
  ],

  // 아치 — 가운데(2)가 한 단 높음
  "three-arch": [
    { left: "33%", top: "54%", rotate: 0 },
    { left: "50%", top: "40%", rotate: 0 },
    { left: "67%", top: "56%", rotate: 0 },
  ],

  // 역삼각 — 위 2장 + 아래 가운데 1장
  "three-inverted": [
    { left: "41%", top: "32%", rotate: 0 },
    { left: "59%", top: "32%", rotate: 0 },
    { left: "50%", top: "68%", rotate: 0 },
  ],

  // ── 4장 ────────────────────────────────────────────────
  // 일렬
  "four-row": [
    { left: "23%", top: "50%", rotate: 0 },
    { left: "41%", top: "50%", rotate: 0 },
    { left: "59%", top: "50%", rotate: 0 },
    { left: "77%", top: "50%", rotate: 0 },
  ],

  // 다이아몬드 — 1 왼쪽, 2 위, 3 아래, 4 오른쪽
  "four-diamond": [
    { left: "30%", top: "50%", rotate: 0 },
    { left: "50%", top: "30%", rotate: 0 },
    { left: "50%", top: "70%", rotate: 0 },
    { left: "70%", top: "50%", rotate: 0 },
  ],

  // 2×2 격자
  "four-grid": [
    { left: "40%", top: "30%", rotate: 0 },
    { left: "60%", top: "30%", rotate: 0 },
    { left: "40%", top: "70%", rotate: 0 },
    { left: "60%", top: "70%", rotate: 0 },
  ],

  // ── 5장 ────────────────────────────────────────────────
  // T자형 — 윗줄 1·3은 살짝 비스듬, 맨 아래 5는 가로로 눕힘
  "five-tee": [
    { left: "31%", top: "26%", rotate: -8 },
    { left: "50%", top: "24%", rotate: 0 },
    { left: "69%", top: "26%", rotate: 8 },
    { left: "50%", top: "52%", rotate: 0 },
    { left: "50%", top: "78%", rotate: 90 },
  ],

  // 2×2 격자 + 오른쪽 1장
  "five-grid": [
    { left: "30%", top: "30%", rotate: 0 },
    { left: "47%", top: "30%", rotate: 0 },
    { left: "30%", top: "70%", rotate: 0 },
    { left: "47%", top: "70%", rotate: 0 },
    { left: "68%", top: "50%", rotate: 0 },
  ],

  // 위 2장 + 아래 3장
  "five-two-three": [
    { left: "41%", top: "28%", rotate: 0 },
    { left: "59%", top: "28%", rotate: 0 },
    { left: "32%", top: "72%", rotate: 0 },
    { left: "50%", top: "72%", rotate: 0 },
    { left: "68%", top: "72%", rotate: 0 },
  ],

  // ── 6장 ────────────────────────────────────────────────
  // 십자 — 가로줄 1·2·4·6, 4를 중심으로 위 3 / 아래 5
  "six-cross": [
    { left: "22%", top: "50%", rotate: 0 },
    { left: "40%", top: "50%", rotate: 0 },
    { left: "58%", top: "20%", rotate: 0 },
    { left: "58%", top: "50%", rotate: 0 },
    { left: "58%", top: "80%", rotate: 0 },
    { left: "76%", top: "50%", rotate: 0 },
  ],

  // 육각 — 3 위, 1·5 윗변, 2·6 아랫변, 4 아래
  "six-hex": [
    { left: "31%", top: "32%", rotate: 0 },
    { left: "31%", top: "68%", rotate: 0 },
    { left: "50%", top: "18%", rotate: 0 },
    { left: "50%", top: "82%", rotate: 0 },
    { left: "69%", top: "32%", rotate: 0 },
    { left: "69%", top: "68%", rotate: 0 },
  ],

  // ── 7장 ────────────────────────────────────────────────
  // 말굽형 (Card.pdf)
  // 번호 순서: 1 오른쪽 중단 → 2·3 아래 → 4 왼쪽 중단 → 5·6·7 윗줄
  "seven-horseshoe": [
    { left: "72%", top: "52%", rotate: 0 },
    { left: "60%", top: "80%", rotate: 0 },
    { left: "40%", top: "80%", rotate: 0 },
    { left: "28%", top: "52%", rotate: 0 },
    { left: "28%", top: "22%", rotate: 0 },
    { left: "50%", top: "22%", rotate: 0 },
    { left: "72%", top: "22%", rotate: 0 },
  ],

  // ── 10장 ───────────────────────────────────────────────
  // 켈틱 크로스 — 1 왼쪽, 2 위, 3 가운데(세로), 4 가운데(가로로 겹침),
  // 5 아래, 6 오른쪽, 오른쪽 기둥 위에서 아래로 7 → 8 → 9 → 10
  "ten-celtic": [
    { left: "20%", top: "50%", rotate: 0 },
    { left: "40%", top: "28%", rotate: 0 },
    { left: "40%", top: "50%", rotate: 0 },
    { left: "40%", top: "50%", rotate: 90 },
    { left: "40%", top: "72%", rotate: 0 },
    { left: "60%", top: "50%", rotate: 0 },
    { left: "78%", top: "16%", rotate: 0 },
    { left: "78%", top: "39%", rotate: 0 },
    { left: "78%", top: "61%", rotate: 0 },
    { left: "78%", top: "84%", rotate: 0 },
  ],
}
