// components/site-menu.tsx
// 헤더의 "목록" 버튼을 누르면 열리는 전체 화면 메뉴입니다.
// 사이트맵(페이지 목록) + 검색을 한곳에 모았습니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 메뉴 항목        : 아래 menuItems 배열 — 한 줄 추가하면 메뉴도 추가
// │ · 항목 글자 크기   : text-3xl (모바일) / sm:text-4xl (PC)
// │ · 배경             : bg-brand-lime (시안의 Main_메뉴 라임 전체화면)
// │ · 검색 이동 위치   : Archive(/archive)의 검색으로 연결
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, LogIn, Search, User, X } from "lucide-react"
import { Wordmark } from "@/components/brand-mark"

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
    // 시안(Main_메뉴) 기준 — 라임 전체화면 + 흰 카드 행
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-brand-lime">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-8">
        {/* 닫기 — 시안의 검정 사각 버튼 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="inline-flex h-10 w-10 items-center justify-center bg-brand-ink text-white transition-opacity hover:opacity-80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 워드마크 + 소개 */}
        <div className="mt-2 text-center">
          <Wordmark className="mx-auto h-11" />
          <p className="mx-auto mt-5 max-w-xs text-pretty text-sm leading-relaxed text-brand-ink/80">
            타로를 중심으로 마음과 몸, 여러가지 일상의 경험을 기록하고 연결하는 개인
            아카이브입니다.
          </p>
        </div>

        {/* 검색 — Archive(카드 해설·리뷰) 안에서만 찾습니다. 리딩은 검색 대상이 아닙니다. */}
        <Link
          href="/search"
          onClick={onClose}
          className="mt-8 flex items-center gap-2 rounded-full bg-background/80 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-background"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          Archive에서 검색 — 덱, 대분류, 숫자, 제목
        </Link>

        {/* 사이트맵 — 시안의 흰 카드 행 (번호 + 이름 + ↗) */}
        <nav className="mt-3 overflow-hidden rounded-xl bg-background">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="w-5 shrink-0 text-xs text-muted-foreground">{item.number}</span>
              <span className="flex-1 text-lg text-foreground">{item.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        {/* MY · 로그인 — 사이트맵과 구분되는 "계정" 영역입니다.
            ※ 지금은 로그인 기능이 없어서 항상 비로그인으로 보입니다. */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/my"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-background/80 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
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

        {/* 하단 — 시안 푸터와 같은 ✳ URL ✳ + 링크 */}
        <div className="mt-auto pt-10 text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-brand-ink/80">
            ✳ www.soulseoul.xyz ✳
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link
              href="/about"
              onClick={onClose}
              className="text-xs text-brand-ink/70 underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              about
            </Link>
            <Link
              href="/privacy"
              onClick={onClose}
              className="text-xs text-brand-ink/70 underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              privacy statement
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
