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
import { X } from "lucide-react"
import { RowList, type RowItem } from "@/components/ui/row-list"

// 마지막 줄은 로그인 여부에 따라 Login ↔ My 로 바뀝니다.
const baseItems: RowItem[] = [
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
  /** 홈으로 가는 줄(00. Home) 표시 여부. 홈 화면에서만 false 로 둡니다. */
  showHome = true,
}: {
  open: boolean
  onClose: () => void
  anchorTop?: number
  isLoggedIn?: boolean
  showHome?: boolean
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

  const items: RowItem[] = [
    ...(showHome ? [{ number: "00", label: "Home", href: "/" }] : []),
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

          {/* 메뉴 패널 — 행 모양은 공용 RowList 가 담당합니다 */}
          <RowList items={items} variant="panel" onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body
  )
}
