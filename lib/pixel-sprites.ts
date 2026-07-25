// lib/pixel-sprites.ts
// [단일 진실 소스] 픽셀 캐릭터 도트 데이터.
//
// 캐릭터를 이미지(png)가 아니라 "글자 그림"으로 들고 있습니다. 그래서
//   · 파일을 안 받아도 되고 (네트워크 요청 0회)
//   · 색을 CSS 로 바꿀 수 있고
//   · 표정·동작을 코드로 만들어 다마고치처럼 움직일 수 있습니다.
//
// ┌─ 도트를 고치는 법 ────────────────────────────────────────────────
// │ 아래 문자열을 그대로 편집하면 됩니다. '#' = 칠함, '.' = 비움.
// │ 모든 줄의 길이가 같아야 하고, 줄 수가 세로 칸수가 됩니다.
// │ (에디터에서 고정폭 글꼴로 보면 그림이 그대로 보입니다)
// │
// │ 새 캐릭터 추가: 같은 형식으로 상수를 하나 더 만들고 sprites 에 등록하세요.
// └──────────────────────────────────────────────────────────────────

/** 도트 그림 한 장. 문자열 배열이며 '#'만 칠합니다. */
export type SpriteFrame = readonly string[]

/** 샨티(고양이) — 기본 표정. 25×16 칸. 시안 PDF에서 실측해 복원했습니다. */
export const SHANTI_BASE: SpriteFrame = [
  "..............#.......#..",
  ".............###.....###.",
  "............##.#....##.#.",
  "...........##..##..##..#.",
  "..........##..########.#.",
  "........################.",
  ".......#################.",
  "##....##################.",
  "###...##################.",
  "###...###################",
  ".###..########.######.###",
  ".#############.######.###",
  "..#######################",
  "....####################.",
  "........###############..",
  "..........###########....",
] as const

/** 샨티의 눈 위치 [x, y]. 여기를 메우면 눈을 감은 표정이 됩니다. */
const SHANTI_EYES: readonly (readonly [number, number])[] = [
  [14, 10],
  [14, 11],
  [21, 10],
  [21, 11],
] as const

/** 지정한 칸들을 채운 새 프레임을 만듭니다. (원본은 건드리지 않습니다) */
export function fillCells(
  frame: SpriteFrame,
  cells: readonly (readonly [number, number])[]
): SpriteFrame {
  const rows = frame.map((r) => r.split(""))
  for (const [x, y] of cells) {
    if (rows[y] && rows[y][x] !== undefined) rows[y][x] = "#"
  }
  return rows.map((r) => r.join(""))
}

/** 샨티 — 눈 감은 표정 (깜빡임용). 눈 칸만 메워서 자동 생성합니다. */
export const SHANTI_BLINK: SpriteFrame = fillCells(SHANTI_BASE, SHANTI_EYES)

/**
 * 도트 그림을 가로 방향으로 이어붙여 사각형 목록으로 바꿉니다.
 * 칸 하나마다 사각형을 그리면 400개가 넘지만, 가로로 이어진 칸을 하나로 묶으면
 * 40여 개로 줄어듭니다. 화면에 그리는 비용이 그만큼 줄어듭니다.
 */
export function toRects(frame: SpriteFrame) {
  const rects: { x: number; y: number; w: number }[] = []
  frame.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== "#") {
        x++
        continue
      }
      const start = x
      while (x < row.length && row[x] === "#") x++
      rects.push({ x: start, y, w: x - start })
    }
  })
  return rects
}

/** 그림의 칸 수 (가로, 세로) */
export function frameSize(frame: SpriteFrame) {
  return { cols: frame[0]?.length ?? 0, rows: frame.length }
}
