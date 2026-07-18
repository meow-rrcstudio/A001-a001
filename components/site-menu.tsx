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

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Search, X } from "lucide-react"

const menuItems = [
  { number: "01", label: "Home", href: "/" },
  { number: "02", label: "Tarot", href: "/tarot" },
  { number: "03", label: "Reading", href: "/tarot/reading" },
  { number: "04", label: "Archive", href: "/tarot/astrology" },
  { number: "05", label: "About", href: "/about" },
]

export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  // 메뉴가 열려 있는 동안 뒤 페이지 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  // 검색하면 카드 아카이브 페이지의 검색으로 연결됩니다 (?q=검색어)
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    onClose()
    router.push(q ? `/tarot/astrology?q=${encodeURIComponent(q)}` : "/tarot/astrology")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
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

        {/* 검색 — 카드 아카이브의 검색으로 이동 */}
        <form
          onSubmit={handleSearch}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="덱 이름, 대분류, 숫자, 제목으로 검색"
            autoFocus
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </form>

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
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  )
}
