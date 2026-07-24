// components/page-header.tsx
// 콘텐츠(메인 제외) 페이지 상단 바 — 시안(Soul Seoul Redesign) 기준.
// 왼쪽: 뒤로가기(‹), 오른쪽: 더보기(•••) — 둘 다 흰 동그란 버튼.
// •••를 누르면 사이트맵 + 검색 메뉴(components/site-menu.tsx)가 열립니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 버튼 크기 : h-11 w-11 (44px) 원형, 흰 배경 + 옅은 그림자
// │ · 아이콘    : ChevronLeft / MoreHorizontal, h-6 w-6
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, MoreHorizontal } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"

export function PageHeader({
  backHref,
  minimal = false,
  className = "",
}: {
  backHref: string
  /** 더보기(•••)까지 숨기고 뒤로가기만 두고 싶을 때 */
  minimal?: boolean
  className?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Link
        href={backHref}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
        aria-label="뒤로"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>

      {!minimal && (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
          aria-label="메뉴 열기"
        >
          <MoreHorizontal className="h-6 w-6" />
        </button>
      )}

      {!minimal && <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
