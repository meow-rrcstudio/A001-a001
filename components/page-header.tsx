// components/page-header.tsx
// 콘텐츠 페이지 상단 바 — 왼쪽 뒤로가기, 오른쪽 (공유) + 목록으로 통일했습니다.
// 목록(≡) 버튼을 누르면 사이트맵 + 검색 메뉴(components/site-menu.tsx)가 열립니다.
// (사이트 로고 헤더는 components/header.tsx)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 아이콘 크기 : h-7 w-7 (28px)
// │ · 아이콘 색   : text-muted-foreground → 올리면 text-foreground
// │ · 공유 버튼   : showShare 로 켜고 끕니다 (목록 버튼은 항상 표시)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Share, Menu } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"

export function PageHeader({
  backHref,
  showShare = false,
  minimal = false,
  className = "",
}: {
  backHref: string
  showShare?: boolean
  /** 리딩(카드 뽑기)처럼 몰입이 중요한 화면 — 뒤로가기만 남기고 공유·메뉴 숨김 */
  minimal?: boolean
  className?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)

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

      {!minimal && (
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
        {/* 목록 — 사이트맵 + 검색 메뉴 열기 */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="메뉴 열기"
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>
      )}

      {!minimal && <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
