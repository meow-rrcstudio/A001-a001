// components/site-menu.tsx
// 햄버거(≡) 또는 상단바의 ⋯ 를 누르면 열리는 메뉴 패널입니다.
//
// 시안 기준: 화면을 덮는 게 아니라 페이지 위에 얹히는 "흰 패널"입니다.
// 패널은 오른쪽에 붙고, 그 위에 검정 사각 닫기(X)가 얹힙니다.
// 뒤 배경(라임·돌 사진)은 가리지 않고 그대로 비칩니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 메뉴 항목   : 아래 menuItems — ready:false 로 두면 "준비중"으로 흐리게 표시
// │ · 패널 폭     : w-[55%] (최대 260px)
// │ · 패널 위치   : anchorTop 으로 위에서 몇 px 떨어질지 지정 (버튼 위치에 맞춤)
// │ · 행 높이     : py-2.5 · 이름 크기 text-lg
// │ · 닫기 버튼   : h-10 w-10 bg-foreground (검정 사각)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, X } from "lucide-react"

type MenuRow = {
  number: string
  label: string
  href: string
  /** false 면 "준비중" 꼬리표가 붙고 클릭이 막힙니다 */
  ready?: boolean
}

// 마지막 줄은 로그인 여부에 따라 Login ↔ My 로 바뀝니다.
const baseItems: MenuRow[] = [
  { number: "01", label: "Mind", href: "/tarot/reading" },
  { number: "02", label: "Body", href: "#", ready: false },
  { number: "03", label: "Archiving", href: "/archive" },
]

export function SiteMenu({
  open,
  onClose,
  /** 패널이 화면 위에서 떨어지는 거리(px). 여는 버튼 위치에 맞춥니다. */
  anchorTop = 80,
  /** 로그인 상태. 인증을 붙이면 실제 세션 값을 넘겨주세요. */
  isLoggedIn = false,
}: {
  open: boolean
  onClose: () => void
  anchorTop?: number
  isLoggedIn?: boolean
}) {
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

  const items: MenuRow[] = [
    ...baseItems,
    isLoggedIn
      ? { number: "04", label: "My", href: "/my" }
      : { number: "04", label: "Login", href: "/login" },
    { number: "05", label: "Search", href: "/search" },
  ]

  // createPortal: 메뉴를 페이지 구조 밖(문서 최상위)에 그립니다.
  // 페이지 내부의 층(z-index) 구조에 갇히지 않아 어떤 요소보다도 위에 뜹니다.
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* 바깥을 누르면 닫힘 — 시안처럼 뒤 배경을 가리지 않습니다 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="pointer-events-none absolute inset-0 mx-auto max-w-md">
        <div
          className="pointer-events-auto absolute right-5 w-[55%] max-w-[260px]"
          style={{ top: anchorTop }}
        >
          {/* 닫기 — 패널 위에 얹힌 검정 사각 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="메뉴 닫기"
              className="inline-flex h-10 w-10 items-center justify-center bg-foreground text-white transition-opacity hover:opacity-80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 메뉴 패널 — 흰 바탕 + 얇은 검정 테두리 (시안) */}
          <nav className="border border-foreground bg-card">
            {items.map((item, i) => {
              const ready = item.ready !== false
              const rowClass = `group flex items-center gap-3 px-3.5 py-2.5 ${
                i > 0 ? "border-t border-foreground" : ""
              } ${ready ? "transition-colors hover:bg-muted/60" : "cursor-not-allowed"}`

              const inner = (
                <>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {item.number}
                  </span>
                  <span className="flex flex-1 items-baseline gap-1.5">
                    <span className={`text-lg ${ready ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                    {!ready && <span className="text-[11px] text-muted-foreground">준비중</span>}
                  </span>
                  <ArrowUpRight
                    className={`h-4 w-4 shrink-0 ${
                      ready
                        ? "text-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        : "text-muted-foreground/50"
                    }`}
                  />
                </>
              )

              return ready ? (
                <Link key={item.label} href={item.href} onClick={onClose} className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <span key={item.label} aria-disabled="true" className={rowClass}>
                  {inner}
                </span>
              )
            })}
          </nav>
        </div>
      </div>
    </div>,
    document.body
  )
}
