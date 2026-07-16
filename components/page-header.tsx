// components/page-header.tsx
// 콘텐츠 페이지 상단 바 — icon.pdf 시안의 헤더입니다.
// 왼쪽에 뒤로가기, 오른쪽에 공유 → 검색 → 홈 → 더보기(⋯) 순서.
// (사이트 로고 헤더는 components/header.tsx)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 아이콘 크기 : h-7 w-7 (28px)
// │ · 아이콘 색   : text-muted-foreground → 올리면 text-foreground
// │ · 공유 버튼   : showShare, 검색 버튼: showSearch 로 켜고 끕니다
// │ · 홈 버튼     : 기본으로 항상 표시 — 끄려면 showHome={false}
// └──────────────────────────────────────────────────────────────────
"use client"

import Link from "next/link"
import { ArrowLeft, Share, Search, Home, MoreHorizontal } from "lucide-react"

export function PageHeader({
  backHref,
  showShare = false,
  showSearch = false,
  showHome = true,
  showMore = false,
  onSearchClick,
  onMoreClick,
  className = "",
}: {
  backHref: string
  showShare?: boolean
  showSearch?: boolean // 검색 기능이 생기면 onSearchClick과 함께 켜세요
  showHome?: boolean //  홈(/)으로 가는 집 아이콘 — 홈이 아닌 페이지에서 기본 표시
  showMore?: boolean //   "⋯" 더보기 — 시안의 블로그 본문 헤더에 있음
  onSearchClick?: () => void
  onMoreClick?: () => void
  className?: string
}) {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href })
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 무시
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Link
        href={backHref}
        className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="뒤로"
      >
        <ArrowLeft className="h-7 w-7" />
      </Link>

      <div className="flex items-center gap-4">
        {showShare && (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="공유"
          >
            <Share className="h-7 w-7" />
          </button>
        )}
        {showSearch && (
          <button
            type="button"
            onClick={onSearchClick}
            className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="검색"
          >
            <Search className="h-7 w-7" />
          </button>
        )}
        {showHome && (
          <Link
            href="/"
            className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="홈으로"
          >
            <Home className="h-7 w-7" />
          </Link>
        )}
        {showMore && (
          <button
            type="button"
            onClick={onMoreClick}
            className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="더보기"
          >
            <MoreHorizontal className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  )
}
