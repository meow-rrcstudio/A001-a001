// components/blinking-otter.tsx
// 눈을 깜빡이는 해달. 그림(components/otter.tsx)과 타이머(lib/use-blink.ts)를
// 묶어주기만 합니다 — 돌 쪽(blinking-stone.tsx)과 같은 구조입니다.
"use client"

import { Otter } from "@/components/otter"
import { useBlink } from "@/lib/use-blink"

export function BlinkingOtter({
  className,
  title,
  interval,
  duration,
}: {
  className?: string
  title?: string
  /** 깜빡임 사이 간격(ms) */
  interval?: number
  /** 눈을 감고 있는 시간(ms) */
  duration?: number
}) {
  const blinking = useBlink({ interval, duration })

  return <Otter blink={blinking} className={className} title={title} />
}
