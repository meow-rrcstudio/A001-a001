// components/site-menu.tsx
// 헤더의 "목록" 버튼을 누르면 열리는 전체 화면 메뉴입니다.
// 사이트맵(페이지 목록) + 검색을 한곳에 모았습니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 메뉴 항목        : 아래 menuItems 배열 — 한 줄 추가하면 메뉴도 추가
// │ · 항목 글자 크기   : text-3xl (모바일) / sm:text-4xl (PC)
// │ · 배경             : bg-background (크림) — /95로 살짝 비치게 가능
// │ · 검색 이동 위치   : 카드 아카이브(/tarot/astrology)의 검색으로 연결
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, Search, X } from "lucide-react"

const menuItems = [
  { number: "01", label: "Home", href: "/" },
  { number: "02", label: "Tarot", href: "/tarot" },
  { number: "03", label: "Reading", href: "/tarot/reading" },
  { number: "04", label: "Archive", href: "/tarot/astrology" },
  { number: "05", label: "About", href: "/About" },
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

        {/* 검색 — 누르면 전용 검색 화면(/search)으로 이동합니다 */}
        <Link
          href="/search"
          onClick={onClose}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-base text-muted-foreground/60">덱 이름, 대분류, 숫자, 제목으로 검색</span>
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

        {/* 하단 작은 링크 */}
        <div className="mt-auto pb-10 pt-8">
          <Link
            href="/privacy"
            onClick={onClose}
            className="text-xs text-muted-foreground/70 underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Privacy Statement
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
