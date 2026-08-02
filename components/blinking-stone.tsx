// components/blinking-stone.tsx
// 눈을 깜빡이는 돌.
//
// ┌─ 왜 Stone 과 나눠 두는가 ─────────────────────────────────────────
// │ Stone(components/stone.tsx)은 그림만 그립니다 — 서버에서도 그릴 수
// │ 있고, 깜빡임이 필요 없는 자리에서는 타이머를 지고 갈 이유가 없습니다.
// │ 여기는 "언제 감을지"만 맡습니다.
// │
// │ 예전 마스코트의 BlinkingShanti(components/pixel-sprite.tsx)와 같은
// │ 구실이지만 그쪽은 건드리지 않았습니다 — 헤더·해석·결제 확인이 아직
// │ 샨티를 쓰고 있어서, 한 곳을 고치면 그 셋이 함께 흔들립니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import { Stone } from "@/components/stone"

export function BlinkingStone({
  className,
  title,
  /** 깜빡임 사이 간격(ms). 매번 ±40% 흔들어서 기계처럼 안 보이게 합니다. */
  interval = 4000,
  /** 눈을 감고 있는 시간(ms) */
  duration = 130,
}: {
  className?: string
  title?: string
  interval?: number
  duration?: number
}) {
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

  return <Stone blink={blinking} className={className} title={title} />
}
