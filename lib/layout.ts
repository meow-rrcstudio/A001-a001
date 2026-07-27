// lib/layout.ts
// 화면 골격 치수. 서버·클라이언트 어느 쪽에서든 읽어야 해서 여기 둡니다.
//
// ⚠️ "use client" 파일에 두면 안 됩니다. 서버 컴포넌트가 그 값을 import 하면
//    문자열이 아니라 클라이언트 참조 스텁이 넘어와서, className 에 그대로
//    박혀 여백이 통째로 사라집니다 (조용히 깨지므로 찾기 어렵습니다).

/** 고정 헤더가 차지하는 높이. 헤더가 떠 있는 화면은 이만큼 위를 비웁니다. */
export const HEADER_SPACE = "pt-[76px]"

/**
 * 키보드만 올라오게 하는 입력칸 속성.
 *
 * iOS 사파리는 입력칸을 보면 키보드 위에 자동완성 줄(암호·신용카드·연락처
 * 아이콘)을 얹습니다. 타로 질문을 적는 칸에는 채워 넣을 게 없으니 그 줄이
 * 자리만 먹습니다. 아래 속성으로 "채울 것 없음"을 알려 그 줄을 없앱니다.
 *
 * ⚠️ 여기에 더해 <form> 으로 감싸지 마세요 — 폼 안이면 사파리가 다시
 *    자동완성 대상으로 봅니다. 엔터는 onKeyDown 으로 직접 받습니다.
 * ⚠️ 이전/다음·완료 버튼 줄은 사파리가 웹에 내주지 않는 부분이라
 *    남습니다. 웹에서 없앨 수 있는 건 자동완성 줄까지입니다.
 */
export const KEYBOARD_ONLY_INPUT_PROPS = {
  type: "text",
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  enterKeyHint: "send",
  // 사파리는 name 을 보고 무엇을 채울지 짐작합니다. 짐작할 거리를 주지 않습니다.
  name: "shanti-input",
} as const
