// components/page-background.tsx
// 페이지 배경 공용 컴포넌트. 푸터처럼 페이지 성격에 맞게 골라 씁니다.
//
// · variant="plain"        : 아무 효과 없음 — 단색 크림 배경 (globals.css --background)
// · variant="aurora" (기본) : 크림 위에 웜톤 블러가 천천히 떠다니는 효과
// · variant="aurora-dark"  : 어두운 잉크색 배경 + 은은한 블러 (몰입형 화면용)
//   ※ 어두운 배경 위 글자색까지 바꾸려면 페이지 래퍼에 className="dark"를 함께 주세요
// · variant="image"        : 이미지 배경 + 가독성용 딤 처리 (imageSrc 필수)
//
// 카드가 흩뿌려지는 연출(components/scattered-cards-bg.tsx)은 배경이 아니라
// "장면 연출" 레이어라서 별도 컴포넌트로 유지합니다. (aurora 위에 겹쳐 사용)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 블러 원 크기   : h-64 w-64 (모바일) / sm:h-[36rem] (PC)
// │ · 블러 강도      : blur-3xl → blur-[100px] 처럼 숫자가 클수록 부드러움
// │ · 떠다니는 속도  : animate-[drift-a_22s...] 의 22s → 숫자가 클수록 느긋함
// │ · 색 농도        : bg-primary/8 의 /8 (8% 불투명) → /15면 더 진하게
// │ · 이미지 딤 농도 : image variant의 bg-background/70 → /50이면 이미지가 더 보임
// └──────────────────────────────────────────────────────────────────
import Image from "next/image"
import { cn } from "@/lib/utils"

export function PageBackground({
  variant = "aurora",
  imageSrc,
  imageAlt = "",
  className,
}: {
  variant?: "plain" | "aurora" | "aurora-dark" | "image"
  imageSrc?: string // variant="image"일 때 배경 이미지 경로
  imageAlt?: string
  className?: string // 딤/블러 레이어를 덮어쓰는 추가 클래스 (예: "backdrop-blur-sm bg-black/30")
}) {
  if (variant === "plain") return null

  if (variant === "image") {
    if (!imageSrc) return null
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="100vw" />
        {/* 글자 가독성을 위한 딤 처리 — className으로 농도/블러를 조절할 수 있음 */}
        <div className={cn("absolute inset-0 bg-background/70 backdrop-blur-[2px]", className)} />
      </div>
    )
  }

  if (variant === "aurora-dark") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* 어두운 잉크색 바탕 (기존 다크 네이비 팔레트) */}
        <div className="absolute inset-0 bg-[oklch(0.15_0.018_265)]" />
        <div className="absolute -top-20 left-1/4 h-64 w-64 animate-[drift-a_22s_ease-in-out_infinite] rounded-full bg-[oklch(0.62_0.16_280)]/20 blur-3xl sm:-top-40 sm:h-[36rem] sm:w-[36rem] sm:blur-[100px]" />
        <div className="absolute top-1/3 -right-16 h-56 w-56 animate-[drift-b_28s_ease-in-out_infinite] rounded-full bg-[oklch(0.85_0.13_88)]/15 blur-3xl sm:-right-32 sm:h-[30rem] sm:w-[30rem] sm:blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-52 w-52 animate-[drift-c_25s_ease-in-out_infinite] rounded-full bg-[oklch(0.62_0.16_280)]/12 blur-3xl sm:h-[28rem] sm:w-[28rem] sm:blur-[110px]" />
      </div>
    )
  }

  // 기본: 크림 배경 위 웜톤 오로라 (시안의 종이 질감 느낌)
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -top-20 left-1/4 h-64 w-64 animate-[drift-a_22s_ease-in-out_infinite] rounded-full bg-primary/8 blur-3xl sm:-top-40 sm:h-[36rem] sm:w-[36rem] sm:blur-[100px]" />
      <div className="absolute top-1/3 -right-16 h-56 w-56 animate-[drift-b_28s_ease-in-out_infinite] rounded-full bg-[oklch(0.8_0.08_80)]/15 blur-3xl sm:-right-32 sm:h-[30rem] sm:w-[30rem] sm:blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-52 w-52 animate-[drift-c_25s_ease-in-out_infinite] rounded-full bg-primary/6 blur-3xl sm:h-[28rem] sm:w-[28rem] sm:blur-[110px]" />
    </div>
  )
}
