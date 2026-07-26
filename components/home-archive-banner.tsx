// components/home-archive-banner.tsx
// 홈 아래쪽 검정 아카이빙 배너.
// 리딩(라임 카드)과 아카이브(검정 배너)를 색으로 구분하는 자리입니다.
// 내용은 lib/home-categories.ts 의 archiveBanner 에서 가져옵니다.
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { archiveBanner } from "@/lib/home-categories"

export function HomeArchiveBanner() {
  return (
    <Link
      href={archiveBanner.href}
      className="group flex items-center gap-4 bg-black p-6 transition-opacity hover:opacity-90"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-myeongjo text-xl font-bold text-white">
          {archiveBanner.title}
        </span>
        <span className="mt-2 block text-sm text-white/80">{archiveBanner.subtitle}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-white transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
