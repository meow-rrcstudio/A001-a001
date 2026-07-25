// components/site-menu.tsx
// 헤더의 "목록" 버튼을 누르면 열리는 전체 화면 메뉴입니다.
// 사이트맵(페이지 목록) + 검색을 한곳에 모았습니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 메뉴 항목        : 아래 menuItems 배열 — 한 줄 추가하면 메뉴도 추가
// │ · 항목 글자 크기   : text-3xl (모바일) / sm:text-4xl (PC)
// │ · 배경             : bg-background (크림) — /95로 살짝 비치게 가능
// │ · 검색 이동 위치   : Archive(/archive)의 검색으로 연결
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, LogIn, Search, User, X } from "lucide-react"

// 사이트맵 — 시안 기준 2축 구조입니다.
//   Reading = 체험(타로 리딩) · Archive = 읽을거리(카드 해설·리뷰)
// 새 메뉴를 추가할 때는 "실제로 만든 것"만 넣어주세요.
// (비어 있는 항목이 보이면 사이트가 미완성으로 읽힙니다)
const menuItems = [
  { number: "01", label: "Reading", href: "/tarot/reading" },
  { number: "02", label: "Archive", href: "/archive" },
]

export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  // 메뉴가 열려 있는 동안 뒤 페이지 스크롤 잠금.
  // (아이폰 사파리는 overflow:hidden 잠금을 무시하므로,
  //  몸통을 통째로 고정하는 방식을 씁니다 — 닫을 때 원래 위치로 복원)
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const { style } = document.body
    style.position = "fixed"
    style.top = `-${scrollY}px`
    style.left = "0"
    style.right = "0"
    style.width = "100%"
    return () => {
      style.position = ""
      style.top = ""
      style.left = ""
      style.right = ""
      style.width = ""
      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (!open) return null


  // createPortal: 메뉴를 페이지 구조 밖(문서 최상위)에 그립니다.
  // 페이지 내부의 층(z-index) 구조에 갇히지 않아 플로팅 버튼 등
  // 어떤 요소보다도 항상 위에 뜹니다 (z-[100]).
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-8 sm:px-8 sm:pt-10">
        {/* 닫기 버튼 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* 검색 — Archive(카드 해설·리뷰) 안에서만 찾습니다. 리딩은 검색 대상이 아닙니다. */}
        <Link
          href="/search"
          onClick={onClose}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-base text-muted-foreground/60">Archive에서 검색 — 덱, 대분류, 숫자, 제목</span>
        </Link>

        {/* 사이트맵 목록 — 홈 화면 메뉴와 같은 스타일 */}
        <nav className="mt-8 flex flex-col">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="group flex items-center justify-between border-t border-border py-4 last:border-b"
            >
              <span className="flex items-baseline gap-4">
                <span className="text-xs text-primary">{item.number}</span>
                <span className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
                  {item.label}
                </span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        {/* MY · 로그인 — 사이트맵과 구분되는 "계정" 영역입니다.
            ※ 지금은 로그인 기능이 없어서 항상 비로그인으로 보입니다.
               인증을 붙이면 isLoggedIn 만 실제 세션 값으로 바꿔주세요. */}
        <div className="mt-8 flex items-center gap-2">
          <Link
            href="/my"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            MY
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-ink py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            로그인
          </Link>
        </div>

        {/* 하단 작은 링크 */}
        <div className="mt-auto flex items-center gap-4 pb-10 pt-8">
          <Link
            href="/about"
            onClick={onClose}
            className="text-xs text-muted-foreground/70 underline underline-offset-4 transition-colors hover:text-foreground"
          >
            about
          </Link>
          <Link
            href="/privacy"
            onClick={onClose}
            className="text-xs text-muted-foreground/70 underline underline-offset-4 transition-colors hover:text-foreground"
          >
            privacy statement
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
