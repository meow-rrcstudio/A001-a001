// components/page-header.tsx
// 사이트 공용 상단바. 화면 성격에 따라 세 가지 케이스가 있습니다.
//
// ┌─ 헤더 케이스 ─────────────────────────────────────────────────────
// │ variant="sub"     뒤로 + 더보기 — 대부분의 하위 화면
// │                   (아카이빙·타로 목록·글 상세·기록·설정·about·privacy)
// │ variant="reading" 뒤로 + 제목 + 더보기 — 타로를 보는 동안만
// │                   (질문 고르기 → 섞기 → 카드 뽑기 → 해석 → 대화)
// │ variant="home"    워드마크 + 햄버거 — 홈 전용
// │ variant="minimal" 뒤로만 — 로그인처럼 나갈 길만 필요한 화면
// │
// │ ⚠️ 공유 버튼은 글 상세(노션 글)에만 답니다. 목록 화면에서 "이 페이지를
// │    공유"는 뜻이 흐릿하고, 헤더가 버튼으로 붐빕니다.
// │
// │ ⚠️ 캐릭터(샨티)는 이제 헤더에 없습니다. 대화 영역으로 내려갔습니다
// │    (클로드가 답변 옆에 로고를 두는 것과 같은 자리).
// │    헤더 가운데는 제목 자리입니다.
// │
// │ 홈을 뺀 세 케이스는 화면 위에서 16px 떨어진 자리에 "고정"됩니다.
// │ 스크롤해도 따라 내려오지 않고 그 자리에 그대로 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 고정 위치   : top-4 (16px) — 떠 있든 아니든 위 여백은 같습니다
// │ · 라임 스크림 : h-24 (96px) — 헤더 뒤에 깔려 아래로 투명해집니다
// │ · 버튼 크기   : h-11 w-11 (44px — 손가락 최소 터치 크기)
// │ · 본문 여백   : 헤더가 떠 있으므로 페이지는 HEADER_SPACE 만큼 위를 비웁니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Menu, MoreHorizontal, Share } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"
import { Wordmark } from "@/components/brand-mark"

// 고정 헤더가 떠 있는 만큼 페이지 위쪽에 비워야 하는 높이 (홈은 필요 없습니다).
// 값은 lib/layout.ts 에 있습니다 — 서버 컴포넌트도 읽어야 하기 때문입니다.
// 여기서 다시 내보내면 서버 쪽에서 스텁이 잡히므로 다시 내보내지 않습니다.

// 라임 스크림 위에 뜨는 둥근 버튼 — 반투명 유리면 + 아래로 살짝 지는 그림자.
// 값은 globals.css 의 --glass / --elevation-raised 에서 옵니다.
const roundButton =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-glass text-brand-ink shadow-raised backdrop-blur-[var(--glass-blur)] transition-colors hover:bg-background"

export function PageHeader({
  backHref,
  showShare = false,
  title,
  variant = "sub",
  /** 화면 위에 고정할지. 홈은 고정하지 않고 함께 스크롤됩니다. */
  fixed,
  className = "",
}: {
  backHref?: string
  showShare?: boolean
  /** 헤더 가운데에 놓을 제목. 길면 말줄임 (글 상세·타로 리딩) */
  title?: string
  variant?: "sub" | "reading" | "home" | "minimal"
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
          className="pointer-events-none fixed inset-x-0 top-0 z-40"
          style={{ height: "var(--scrim-height)", backgroundImage: "var(--scrim)" }}
        />
      )}

      <div
        className={`${
          isFixed ? "fixed inset-x-0 top-4 z-50" : "relative pt-4"
        } mx-auto w-full max-w-site px-6 ${className}`}
      >
        <div className="relative flex items-center justify-between gap-3">
          {/* 왼쪽 — 홈은 워드마크, 나머지는 뒤로가기 */}
          {variant === "home" ? (
            <Wordmark className="h-10" priority />
          ) : (
            <Link href={backHref ?? "/"} className={roundButton} aria-label="뒤로">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          {/* 가운데 — 제목.
              양옆 버튼 폭에 상관없이 화면 한가운데 오도록 절대 위치로 놓습니다.
              좌우 여백은 "넓은 쪽"에 맞춰 양쪽 같은 값을 씁니다 — 한쪽만
              넓히면 글이 가운데에서 밀려나기 때문입니다.
                버튼 하나  44 + 사이 16 = 60
                버튼 둘    44 + 8 + 44 + 사이 16 = 112 (공유가 붙는 글 상세) */}
          {title && (
            <p
              className={`pointer-events-none absolute inset-x-0 mx-auto max-w-site truncate text-center text-[15px] font-semibold text-brand-ink ${
                showShare ? "px-[112px]" : "px-[60px]"
              }`}
            >
              {title}
            </p>
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
