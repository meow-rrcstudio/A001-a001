// components/page-header.tsx
// 콘텐츠 페이지 상단 바 — 시안(Site Redesign) 기준으로 다시 만들었습니다.
// 왼쪽 뒤로가기, 오른쪽 (공유) + 더보기(⋯). ⋯ 를 누르면 메뉴가 열립니다.
// (사이트 로고 헤더는 components/header.tsx)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 라임 스크림 높이 : h-24 (96px — 시안 실측). 버튼 뒤에 깔리는 라임 그라데이션
// │ · 버튼 크기        : h-11 w-11 (44px — 손가락 최소 터치 크기)
// │ · 버튼 배경        : bg-background/70 — 라임 위에 뜨는 밝은 원
// │ · 아이콘 크기      : h-5 w-5 (20px)
// │ · 스티키 끄기      : 아래 sticky top-0 z-40 을 지우면 함께 스크롤됩니다
// │ · 라임 끄기        : globals.css 의 --brand-lime 을 바꾸면 전체가 함께 바뀜
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Share, MoreHorizontal } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"

const buttonClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/70 text-brand-ink backdrop-blur-sm transition-colors hover:bg-background"

export function PageHeader({
  backHref,
  showShare = false,
  className = "",
  sticky = true,
}: {
  backHref: string
  showShare?: boolean
  className?: string
  /** 화면 상단 고정 여부. 스타일가이드처럼 상자 안에 견본으로 넣을 때만 false 로 둡니다. */
  sticky?: boolean
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
    // isolate: 스크림의 -z-10 이 이 상자 밖(부모 배경 뒤)으로 밀려나지 않게 가둡니다.
    <div className={`isolate ${sticky ? "sticky top-0 z-40" : "relative"} ${className}`}>
      {/* 라임 스크림 — 버튼 뒤에 깔려 위에서 아래로 투명해집니다 (시안의 96px 그라데이션).
          고정(sticky) 모드에서 fixed 를 쓰는 이유: 페이지마다 좌우 여백(px-5/px-6/px-8)이
          달라서, 음수 마진으로 뚫으면 어떤 페이지에선 화면 밖으로 넘쳐 가로 스크롤이 생깁니다.
          fixed + inset-x-0 은 항상 화면 폭에 정확히 맞습니다.
          견본(sticky=false)일 때는 absolute 로 두어 상자 안에 그대로 그려집니다. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none -z-10 h-24 bg-gradient-to-b from-brand-lime via-brand-lime-soft/70 to-transparent ${
          sticky ? "fixed inset-x-0 top-0" : "absolute inset-x-0 top-0"
        }`}
      />

      <div className="relative flex items-center justify-between py-3">
        <Link href={backHref} className={buttonClass} aria-label="뒤로">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          {showShare && (
            <button type="button" onClick={handleShare} className={buttonClass} aria-label="공유">
              <Share className="h-5 w-5" />
            </button>
          )}
          {/* 더보기(⋯) — 메뉴 + 검색 + MY + 로그인 */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={buttonClass}
            aria-label="메뉴 열기"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
