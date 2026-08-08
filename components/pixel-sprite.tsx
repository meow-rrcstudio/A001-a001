// components/pixel-sprite.tsx
// 픽셀 캐릭터를 화면에 그리는 컴포넌트입니다. (도트 데이터는 lib/pixel-sprites.ts)
//
// 이미지 파일 대신 SVG 사각형으로 그립니다. 그래서
//   · 아무리 크게 키워도 흐려지지 않고
//   · 색을 CSS(text-*)로 바꿀 수 있고 (fill="currentColor")
//   · 표정을 바꾼 그림으로 갈아끼우면 그게 곧 애니메이션이 됩니다.
//
// ┌─ 쓰는 법 ─────────────────────────────────────────────────────────
// │ 가만히 있는 캐릭터 :  <PixelSprite frame={SHANTI_BASE} className="h-5" />
// │ 눈을 깜빡이는 캐릭터:  <BlinkingShanti className="h-5" />
// │ 생각하는 중        :  <BlinkingShanti className="h-5" busy />
// │ 자는 중            :  <SleepingShanti className="h-5" />
// │
// │ · 크기   : className 에 높이(h-5 등)만 주면 가로는 비율대로 따라옵니다
// │ · 색     : className 에 text-* 를 주면 그 색으로 칠해집니다 (기본은 글자색)
// │ · 깜빡임 : BlinkingShanti 의 interval(간격) · duration(감은 시간) 으로 조절
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  SHANTI_BASE,
  SHANTI_BLINK,
  frameSize,
  toRects,
  type SpriteFrame,
} from "@/lib/pixel-sprites"

export function PixelSprite({
  frame,
  className,
  title,
}: {
  frame: SpriteFrame
  className?: string
  /** 읽어줄 이름. 없으면 장식으로 취급해 스크린리더가 건너뜁니다. */
  title?: string
}) {
  const { cols, rows } = frameSize(frame)

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols}
      height={rows}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // shapeRendering: 칸 경계가 흐려지지 않게 (픽셀아트라 또렷해야 합니다)
      shapeRendering="crispEdges"
      className={cn("h-auto w-auto", className)}
    >
      {toRects(frame).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}

/**
 * 눈을 깜빡이는 샨티. 다마고치처럼 "살아있는" 느낌을 주는 최소 단위입니다.
 *
 * 비용이 거의 없습니다 — 타이머 하나로 그림 두 장을 번갈아 보여줄 뿐이고,
 * 그림은 이미 코드 안에 있어서 추가로 받아오는 파일이 없습니다.
 *
 * 움직임을 줄이도록 설정한 사용자(prefers-reduced-motion)에게는 깜빡이지 않습니다.
 */
export function BlinkingShanti({
  className,
  title,
  /** 깜빡임 사이 간격(ms). 매번 ±40% 만큼 흔들어서 기계적으로 안 보이게 합니다. */
  interval = 4000,
  /** 눈을 감고 있는 시간(ms) */
  duration = 130,
  /**
   * 무언가 만들어지는 중인지. 켜면 통통 뜁니다 —
   * 웅크렸다 튀어오르며 살짝 늘어났다 줄어드는 찰진 움직임입니다.
   * (동작 정의는 app/globals.css 의 shanti-hop)
   */
  busy = false,
}: {
  className?: string
  title?: string
  interval?: number
  duration?: number
  busy?: boolean
}) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    // 접근성: 움직임 최소화를 켠 사용자에게는 정지 상태로 둡니다
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let openTimer: ReturnType<typeof setTimeout>
    let closeTimer: ReturnType<typeof setTimeout>

    const schedule = () => {
      // 간격을 매번 조금씩 다르게 (0.6~1.4배) — 일정하면 기계처럼 보입니다
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

  return (
    // 뛰는 동안에도 눈은 계속 깜빡입니다 — 둘은 서로 다른 층이라 겹칩니다.
    <span className={cn("inline-block", busy && "animate-shanti-hop")}>
      <PixelSprite frame={blinking ? SHANTI_BLINK : SHANTI_BASE} className={className} title={title} />
    </span>
  )
}

/**
 * 잠든 샨티 — 눈을 감은 그림에 Zzz 를 얹습니다.
 *
 * 온보딩(샨티 깨우기)의 첫 화면부터 마지막 물음까지 헤더에 이 모습이
 * 있다가, 다 답한 순간 BlinkingShanti 로 바뀝니다. 그 한 번의 교체가
 * 그 화면이 하는 이야기 전부입니다.
 *
 * ⚠️ 깜빡이지 않습니다. 자는 그림(SHANTI_BLINK)은 깨어 있는 그림에서 눈만
 *    메운 것이라, 여기에 깜빡임을 넣으면 눈을 떴다 감는 것이 되어
 *    "자고 있다"가 무너집니다.
 */
export function SleepingShanti({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  return (
    <span className="relative inline-block">
      <PixelSprite frame={SHANTI_BLINK} className={className} title={title} />
      {/* 글꼴로 적습니다 — 도트로 그리면 25칸짜리 그림 밖으로 나가야 해서
          그림 전체를 다시 그려야 합니다. 기울인 소문자가 시안의 모양입니다. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-2.5 left-0 -translate-x-1/2 select-none text-[10px] font-semibold italic leading-none opacity-70"
      >
        Zzz
      </span>
    </span>
  )
}
