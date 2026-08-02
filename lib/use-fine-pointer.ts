// lib/use-fine-pointer.ts
// 지금 이 사람이 마우스를 쓰고 있는가.
//
// ┌─ 왜 화면 폭이 아니라 포인터를 묻는가 ─────────────────────────────
// │ "PC 냐 폰이냐"를 화면 폭(sm: · lg:)으로 가르면 자주 틀립니다 —
// │ 넓은 태블릿은 손가락이고, 좁은 창으로 띄운 노트북은 마우스입니다.
// │ 우리가 알고 싶은 것은 폭이 아니라 "올려놓을 수 있는 손이 있는가"라,
// │ 그것을 그대로 묻습니다.
// │   (hover: hover)   올려놓은 상태를 유지할 수 있는가
// │   (pointer: fine)  점을 정확히 가리킬 수 있는가 (마우스·트랙패드)
// │ 손가락은 둘 다 아닙니다 — 올려놓을 수 없고(닿거나 떨어지거나),
// │ 끝이 뭉툭합니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 왜 useEffect + setState 가 아닌가 ───────────────────────────────
// │ 이 저장소는 react-hooks/set-state-in-effect 가 error 입니다.
// │ useSyncExternalStore 는 바깥 값(여기서는 matchMedia)을 React 가
// │ 직접 구독하게 하는 자리라, 상태를 한 번 더 두지 않아도 됩니다.
// │
// │ 서버에는 포인터가 없으므로 false(터치)로 그립니다. 마우스인 사람은
// │ 화면이 살아나는 순간 true 로 바뀌는데, 이 값이 바꾸는 것은
// │ "무엇을 누름으로 볼지"뿐이라 처음 그림이 흔들리지 않습니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(hover: hover) and (pointer: fine)"

/** matchMedia 를 매번 새로 만들지 않도록 한 번만 붙잡아 둡니다 */
let mql: MediaQueryList | null = null
function query() {
  if (!mql) mql = window.matchMedia(QUERY)
  return mql
}

function subscribe(onChange: () => void) {
  // 창을 다른 화면으로 끌고 가면(노트북 ↔ 터치 모니터) 값이 바뀝니다
  const m = query()
  m.addEventListener("change", onChange)
  return () => m.removeEventListener("change", onChange)
}

function getSnapshot() {
  return query().matches
}

function getServerSnapshot() {
  return false
}

/** 마우스·트랙패드면 true, 손가락이면 false */
export function useFinePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
