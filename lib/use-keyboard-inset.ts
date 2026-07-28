// lib/use-keyboard-inset.ts
// 키보드가 화면 아래에서 얼마나 올라와 있는지(px)를 알려줍니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 아이폰 사파리는 키보드가 올라와도 화면 크기를 바꾸지 않습니다.
// │ 키보드가 화면 위를 "덮을" 뿐이라, position: fixed 로 화면 맨 아래에
// │ 붙여둔 입력창은 그 뒤로 숨습니다. 사용자에겐 "입력창이 키보드에
// │ 안 붙어 있다"로 보입니다.
// │
// │ 브라우저는 이때 두 가지 크기를 따로 들고 있습니다.
// │   레이아웃 뷰포트 (window.innerHeight) — 키보드와 무관하게 그대로
// │   시각 뷰포트 (visualViewport.height) — 지금 실제로 보이는 만큼
// │ 둘의 차이가 곧 키보드가 가린 높이입니다. 그만큼 입력창을 올립니다.
// └──────────────────────────────────────────────────────────────────
//
// app/layout.tsx 의 interactiveWidget: "resizes-content" 를 듣는 브라우저에서는
// 애초에 화면이 줄어들어 차이가 0 이 됩니다. 그때는 이 값도 0 이라 아무 일도
// 하지 않습니다 — 두 방법이 겹쳐도 두 번 올라가지 않습니다.
"use client"

import { useEffect, useState } from "react"

/** 이보다 작은 차이는 키보드가 아니라 주소창이 접힌 것으로 봅니다 */
const NOISE_PX = 80

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    // 화면이 흔들리지 않도록 다음 그림 주기에 한 번만 반영합니다.
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // offsetTop 을 빼는 이유: 확대해서 화면을 위로 밀어둔 상태에서도
        // 아래쪽 가려진 양이 정확히 나옵니다.
        const hidden = window.innerHeight - vv.height - vv.offsetTop
        setInset(hidden > NOISE_PX ? Math.round(hidden) : 0)
      })
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  return inset
}
