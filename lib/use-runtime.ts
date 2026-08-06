// lib/use-runtime.ts
// 화면이 "어디서 열렸는지"를 React 쪽에서 읽는 갈고리.
//
// ⚠️ 서버가 그린 HTML 과 브라우저의 첫 그림이 달라지면 안 됩니다
//    (하이드레이션 어긋남). 그래서 처음에는 언제나 "web" 으로 시작하고,
//    붙은 뒤에 실제 값으로 바꿉니다. 광고를 숨기는 일은 이미 인라인
//    스크립트가 <html data-runtime> 과 CSS 로 먼저 해두므로, 이 갈고리가
//    한 박자 늦어도 화면이 깜빡이지 않습니다 (lib/runtime.ts 참고).
"use client"

import { useSyncExternalStore } from "react"
import { currentRuntime, type Runtime } from "@/lib/runtime"

// 이 값은 첫 그림 뒤로는 바뀌지 않습니다 (같은 세션 안에서 미니앱이었다가
// 브라우저가 되지 않습니다). 그래서 구독할 것이 없습니다.
function subscribe(): () => void {
  return () => {}
}

/**
 * 지금 화면이 열린 곳.
 *
 * ⚠️ useEffect + setState 로 만들지 않습니다. 이 저장소는
 *    react-hooks/set-state-in-effect 가 error 이고, 바깥 값(문서의 속성)을
 *    읽는 일은 React 가 직접 구독하게 하는 편이 맞습니다.
 */
export function useRuntime(): Runtime {
  return useSyncExternalStore(subscribe, currentRuntime, () => "web" as Runtime)
}

/** 앱인토스 미니앱 안인가 */
export function useAppsInToss(): boolean {
  return useRuntime() === "toss"
}
