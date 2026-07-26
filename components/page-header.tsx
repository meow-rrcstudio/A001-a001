// components/page-header.tsx
// 사이트 공용 상단바. 화면 성격에 따라 세 가지 케이스가 있습니다.
//
// ┌─ 헤더 케이스 ─────────────────────────────────────────────────────
// │ variant="sub"     뒤로 + 샨티 + 더보기 — 대부분의 하위 화면
// │                   (타로보기·아카이빙·글 상세·기록·설정·리딩 전 과정)
// │ variant="home"    워드마크 + 햄버거 — 홈 전용
// │ variant="minimal" 뒤로만 — 로그인처럼 나갈 길만 필요한 화면
// │
// │ 세 케이스 모두 화면 위에서 16px 떨어진 자리에 "고정"됩니다.
// │ 스크롤해도 따라 내려오지 않고 그 자리에 그대로 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 고정 위치   : top-4 (16px)
// │ · 라임 스크림 : h-24 (96px) — 헤더 뒤에 깔려 아래로 투명해집니다
// │ · 버튼 크기   : h-11 w-11 (44px — 손가락 최소 터치 크기)
// │ · 본문 여백   : 헤더가 떠 있으므로 페이지는 HEADER_SPACE 만큼 위를 비웁니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Menu, MoreHorizontal, Share } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"
import { BlinkingShanti } from "@/components/pixel-sprite"
import { Wordmark } from "@/components/brand-mark"

/** 고정 헤더가 떠 있는 만큼 페이지 위쪽에 비워야 하는 높이 (홈은 필요 없습니다) */
export const HEADER_SPACE = "pt-[76px]"

const roundButton =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/70 text-brand-ink backdrop-blur-sm transition-colors hover:bg-background"

export function PageHeader({
  backHref,
  showShare = false,
  variant = "sub",
  /** 화면 위에 고정할지. 홈은 고정하지 않고 함께 스크롤됩니다. */
  fixed,
  className = "",
}: {
  backHref?: string
  showShare?: boolean
  variant?: "sub" | "home" | "minimal"
  fixed?: boolean
  className?: string
}) {
  // 홈은 고정하지 않는 것이 기본입니다 (시안 기준)
  const isFixed = fixed ?? variant !== "home"
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
    <>
      {/* 라임 스크림 — 헤더 뒤에 깔려 위에서 아래로 투명해집니다.
          화면 폭에 정확히 맞추려고 fixed + inset-x-0 을 씁니다. */}
      {isFixed && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-gradient-to-b from-brand-lime via-brand-lime-soft/70 to-transparent"
        />
      )}

      <div
        className={`${
          isFixed ? "fixed inset-x-0 top-4 z-50" : "relative pt-4"
        } mx-auto w-full max-w-md px-6 ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* 왼쪽 — 홈은 워드마크, 나머지는 뒤로가기 */}
          {variant === "home" ? (
            <Wordmark className="h-10" priority />
          ) : (
            <Link href={backHref ?? "/"} className={roundButton} aria-label="뒤로">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          {/* 가운데 — 하위 화면에만 샨티가 있습니다 */}
          {variant === "sub" && (
            <Link
              href="/"
              aria-label="홈으로"
              className="text-brand-ink transition-opacity hover:opacity-70"
            >
              <BlinkingShanti className="h-5" />
            </Link>
          )}

          {/* 오른쪽 — 홈은 햄버거, 하위 화면은 (공유 +) 더보기, 최소형은 없음 */}
          {variant === "minimal" ? (
            <span className="h-11 w-11" aria-hidden="true" />
          ) : (
            <div className="flex items-center gap-2">
              {showShare && (
                <button type="button" onClick={handleShare} className={roundButton} aria-label="공유">
                  <Share className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="메뉴 열기"
                className={
                  variant === "home"
                    ? "inline-flex h-11 w-11 items-center justify-center text-brand-ink transition-opacity hover:opacity-70"
                    : roundButton
                }
              >
                {variant === "home" ? (
                  <Menu className="h-7 w-7" />
                ) : (
                  <MoreHorizontal className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
