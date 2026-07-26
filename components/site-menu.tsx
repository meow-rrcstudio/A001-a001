// components/site-menu.tsx
// 오른쪽에서 밀려 나오는 서랍(drawer) 메뉴입니다. 시안 기준.
//
// ┌─ 구성 ────────────────────────────────────────────────────────────
// │ · 워드마크
// │ · 아이콘 + 이름 목록 — 지금 보고 있는 화면은 라임 알약으로 표시
// │ · 구분선
// │ · "최근 본 타로점" — 최근 질문 목록
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 서랍 폭   : w-[78%] (최대 300px)
// │ · 배경      : bg-muted (따뜻한 옅은 회색)
// │ · 활성 표시 : bg-brand-lime-soft 알약
// │ · 메뉴 추가 : 아래 menuItems 배열에 한 줄
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, FolderClosed, Layers, SlidersHorizontal, TerminalSquare } from "lucide-react"
import { Wordmark } from "@/components/brand-mark"
import { getRecentQuestions } from "@/lib/recent-questions"

/** 서랍이 드러나는 폭 — 페이지가 이만큼 왼쪽으로 밀립니다 */
const DRAWER_WIDTH = "78%"

const menuItems = [
  { label: "홈", href: "/", icon: TerminalSquare },
  { label: "타로보기", href: "/tarot/reading/self", icon: Archive },
  { label: "기록 보기", href: "/my", icon: FolderClosed },
  { label: "아카이빙", href: "/archive", icon: Layers },
  { label: "설정", href: "/my/settings", icon: SlidersHorizontal },
]

export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [recent, setRecent] = useState<string[]>([])

  // 메뉴가 열리면
  //   · 뒤 페이지 스크롤을 잠그고 (아이폰 사파리는 overflow:hidden 을 무시해서 몸통을 고정)
  //   · 페이지(app-shell)를 왼쪽으로 밀어 뒤에 있는 서랍이 드러나게 합니다
  useEffect(() => {
    if (!open) return
    setRecent(getRecentQuestions())

    const scrollY = window.scrollY
    const { style } = document.body
    style.position = "fixed"
    style.top = `-${scrollY}px`
    style.left = "0"
    style.right = "0"
    style.width = "100%"

    const shell = document.getElementById("app-shell")
    if (shell) {
      shell.style.transition = "transform 0.28s ease, border-radius 0.28s ease"
      shell.style.transform = `translateX(-${DRAWER_WIDTH})`
      shell.style.borderTopRightRadius = "24px"
      shell.style.borderBottomRightRadius = "24px"
      shell.style.boxShadow = "0 0 40px rgba(0,0,0,0.18)"
      shell.style.overflow = "hidden"
    }

    return () => {
      style.position = ""
      style.top = ""
      style.left = ""
      style.right = ""
      style.width = ""
      window.scrollTo(0, scrollY)
      if (shell) {
        shell.style.transform = ""
        shell.style.borderTopRightRadius = ""
        shell.style.borderBottomRightRadius = ""
        shell.style.boxShadow = ""
        shell.style.overflow = ""
      }
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

  return createPortal(
    <div className="fixed inset-0 z-0">
      {/* 바깥을 누르면 닫힘 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {/* 서랍 — 오른쪽에서 밀려 나옵니다 */}
      <nav
        aria-label="사이트 메뉴"
        className="absolute inset-y-0 right-0 flex w-[78%] flex-col overflow-y-auto bg-muted px-6 pb-10 pt-6"
      >
        <Wordmark className="h-9" />

        <ul className="mt-8 space-y-1">
          {menuItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    active ? "bg-brand-lime-soft" : "hover:bg-black/5"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="font-myeongjo text-lg text-foreground">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 최근 본 타로점 — 기록이 없으면 이 영역은 나오지 않습니다 */}
        {recent.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">최근 본 타로점</p>
            <ul className="mt-3 space-y-3">
              {recent.map((q, i) => (
                <li key={`${q}-${i}`}>
                  <Link
                    href="/my"
                    onClick={onClose}
                    className="block truncate text-[15px] text-foreground transition-opacity hover:opacity-70"
                  >
                    {q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </div>,
    document.body
  )
}
