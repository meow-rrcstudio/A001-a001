// components/site-menu.tsx
// 상단바의 ⋯(또는 홈의 ≡)를 누르면 열리는 메뉴입니다.
//
// 시안(Main_메뉴) 기준: 화면 전체를 덮는 게 아니라, 페이지 위에 얹히는
// "흰 패널" 하나입니다. 패널 오른쪽 위에 검정 사각 닫기 버튼이 붙어 있고,
// 뒤 배경(라임·돌 사진)은 그대로 비칩니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 메뉴 항목   : 아래 menuItems 배열 — 한 줄 추가하면 메뉴도 추가됩니다.
// │                 검색·로그인도 별도 컴포넌트가 아니라 같은 형식의 한 줄입니다.
// │ · 패널 위치   : top-24 (상단에서 96px) · right-4 · 폭 74%
// │ · 패널 테두리 : border-foreground (시안의 얇은 검정 선)
// │ · 행 높이     : py-3.5 · 이름 크기 text-2xl
// │ · 닫기 버튼   : h-14 w-14 bg-foreground (검정 사각)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, X } from "lucide-react"

// 메뉴 항목 — 검색·MY·로그인도 Reading·Archive 와 같은 한 줄로 통일했습니다.
const menuItems = [
  { number: "01", label: "Home", href: "/" },
  { number: "02", label: "Reading", href: "/tarot/reading" },
  { number: "03", label: "Archive", href: "/archive" },
  { number: "04", label: "Search", href: "/search" },
  { number: "05", label: "My", href: "/my" },
  { number: "06", label: "Login", href: "/login" },
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

  // Esc 로 닫기 (키보드 사용자)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  // createPortal: 메뉴를 페이지 구조 밖(문서 최상위)에 그립니다.
  // 페이지 내부의 층(z-index) 구조에 갇히지 않아 어떤 요소보다도 위에 뜹니다.
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* 바깥을 누르면 닫힘 — 시안처럼 뒤 배경을 가리지 않고 그대로 비춥니다 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="pointer-events-none absolute inset-0 mx-auto max-w-md">
        <div className="pointer-events-auto absolute right-4 top-24 w-[74%] max-w-[300px]">
          {/* 닫기 — 패널 오른쪽 위에 얹힌 검정 사각 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="메뉴 닫기"
              className="inline-flex h-14 w-14 items-center justify-center bg-foreground text-white transition-opacity hover:opacity-80"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 메뉴 패널 — 흰 바탕 + 얇은 검정 테두리 (시안) */}
          <nav className="border border-foreground bg-card">
            {menuItems.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/60 ${
                  i > 0 ? "border-t border-foreground" : ""
                }`}
              >
                <span className="shrink-0 font-mono text-sm text-muted-foreground">
                  {item.number}
                </span>
                <span className="flex-1 text-2xl text-foreground">{item.label}</span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>,
    document.body
  )
}
