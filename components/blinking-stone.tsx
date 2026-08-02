// components/blinking-stone.tsx
// 눈을 깜빡이는 돌.
//
// ┌─ 왜 Stone 과 나눠 두는가 ─────────────────────────────────────────
// │ Stone(components/stone.tsx)은 그림만 그립니다 — 서버에서도 그릴 수
// │ 있고, 깜빡임이 필요 없는 자리에서는 타이머를 지고 갈 이유가 없습니다.
// │ 여기는 그림과 타이머(lib/use-blink.ts)를 묶어주기만 합니다.
// │
// │ 예전 마스코트의 BlinkingShanti(components/pixel-sprite.tsx)와 같은
// │ 구실이지만 그쪽은 건드리지 않았습니다 — 헤더·해석·결제 확인이 아직
// │ 샨티를 쓰고 있어서, 한 곳을 고치면 그 셋이 함께 흔들립니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { Stone } from "@/components/stone"
import { useBlink } from "@/lib/use-blink"

export function BlinkingStone({
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

  return <Stone blink={blinking} className={className} title={title} />
}
