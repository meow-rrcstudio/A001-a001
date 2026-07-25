// components/wordmark.svg.tsx
// 손글씨 워드마크 — 리디자인 시안(PDF)에서 벡터를 추출해 만든 이미지입니다.
//
// <Wordmark /> : 손글씨 "Soulseoul ✦" 로고. 검정 단색이라 라임 위·크림 위 모두 얹힙니다.
//
// ※ 픽셀 고양이(샨티)는 여기가 아니라 components/pixel-sprite.tsx 에 있습니다.
//    이미지가 아니라 도트 데이터로 그려야 표정을 코드로 움직일 수 있어서입니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 크기 조절 : className 으로 높이만 주면 가로는 비율대로 따라옵니다
// │               예) <Wordmark className="h-10" />
// │ · 색 바꾸기 : 이미지라 CSS 로 색을 못 바꿉니다. 밝은 배경 위 검정 전용입니다.
// │               어두운 배경에 얹어야 하면 invert 클래스를 쓰세요 (예: "invert")
// └──────────────────────────────────────────────────────────────────
import Image from "next/image"
import { cn } from "@/lib/utils"

export function Wordmark({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/wordmark.png"
      alt="Soul Seoul"
      width={1229}
      height={287}
      priority={priority}
      // h-* 로 높이를 주면 w-auto 가 비율을 지켜줍니다
      className={cn("w-auto", className)}
    />
  )
}
