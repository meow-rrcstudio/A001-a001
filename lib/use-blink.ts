// lib/use-blink.ts
// [단일 진실 소스] "언제 눈을 감을지"만 정하는 타이머.
//
// ┌─ 왜 그림과 나눠 두는가 ───────────────────────────────────────────
// │ 캐릭터 그림(components/stone.tsx · otter.tsx)은 그리기만 합니다 —
// │ 서버에서도 그릴 수 있고, 깜빡일 필요가 없는 자리에서 타이머를 지고
// │ 갈 이유가 없습니다.
// │
// │ 캐릭터가 둘이 되면서 깜빡이는 규칙을 두 벌로 둘 뻔했습니다. 두 벌이
// │ 되면 한쪽만 고쳐진 채 남아서, 같은 화면에 선 두 캐릭터가 서로 다른
// │ 박자로 깜빡입니다 — 보는 사람은 이유를 모른 채 어색함만 느낍니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"

export function useBlink({
  /** 깜빡임 사이 간격(ms). 매번 ±40% 흔들어서 기계처럼 안 보이게 합니다. */
  interval = 4000,
  /** 눈을 감고 있는 시간(ms) */
  duration = 130,
}: { interval?: number; duration?: number } = {}) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    // 움직임 최소화를 켠 사용자에게는 눈을 뜬 채로 둡니다
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let openTimer: ReturnType<typeof setTimeout>
    let closeTimer: ReturnType<typeof setTimeout>

    const schedule = () => {
      // 간격이 일정하면 시계처럼 보입니다. 0.6~1.4배로 흔듭니다.
      const wait = interval * (0.6 + Math.random() * 0.8)
      openTimer = setTimeout(() => {
        setBlinking(true)
        closeTimer = setTimeout(() => {
          setBlinking(false)
          schedule()
        }, duration)
      }, wait)
    }
    schedule()

    return () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
    }
  }, [interval, duration])

  return blinking
}
