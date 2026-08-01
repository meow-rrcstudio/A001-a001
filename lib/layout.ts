// lib/layout.ts
// 화면 골격 치수. 서버·클라이언트 어느 쪽에서든 읽어야 해서 여기 둡니다.
//
// ⚠️ "use client" 파일에 두면 안 됩니다. 서버 컴포넌트가 그 값을 import 하면
//    문자열이 아니라 클라이언트 참조 스텁이 넘어와서, className 에 그대로
//    박혀 여백이 통째로 사라집니다 (조용히 깨지므로 찾기 어렵습니다).

/** 고정 헤더가 차지하는 높이 (px). 계산해서 써야 할 때 이 값을 씁니다. */
export const HEADER_SPACE_PX = 76

/**
 * 고정 헤더가 차지하는 높이. 헤더가 떠 있는 화면은 이만큼 위를 비웁니다.
 *
 * ⚠️ HEADER_SPACE_PX 와 같은 값이어야 합니다. Tailwind 는 클래스 이름을
 *    글자 그대로 훑어가므로 `pt-[${HEADER_SPACE_PX}px]` 처럼 지어 쓰면
 *    그 클래스가 만들어지지 않습니다 — 그래서 두 벌로 둡니다.
 */
export const HEADER_SPACE = "pt-[76px]"

