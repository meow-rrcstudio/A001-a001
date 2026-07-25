// lib/site.ts
// [단일 진실 소스] 사이트 이름·주소·저작권 표기.
// 푸터·메타데이터 등 여러 곳에서 이 값을 가져다 쓰므로,
// 여기만 고치면 사이트 전체 표기가 한 번에 바뀝니다.

export const SITE = {
  /** 화면에 보여줄 사이트 주소 */
  displayUrl: "www.soulseoul.xyz",
  /** 저작권자 */
  owner: "Meow RRC Studio",
  /** 아카이브 이름 */
  archive: "Soulseoul Archive",
  /** 주소 양옆에 붙는 장식 별 (워드마크의 별과 같은 모양) */
  star: "✦",
  /** 사이트 한 줄 소개 — 홈·메뉴·메타데이터가 같은 문장을 씁니다 */
  tagline: "타로를 중심으로 마음과 몸, 여러가지 일상의 경험을 기록하고 연결하는 개인 아카이브입니다.",
} as const

/** "©2026 Meow RRC Studio. Soulseoul Archive. All Rights Reserved." */
export function copyrightLine(year: number = new Date().getFullYear()) {
  return `©${year} ${SITE.owner}. ${SITE.archive}. All Rights Reserved.`
}
