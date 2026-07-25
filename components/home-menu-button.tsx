// components/home-menu-button.tsx
// 홈의 햄버거(≡) 버튼. 누르면 메뉴 패널(components/site-menu.tsx)이 열립니다.
// 홈은 뒤로가기가 필요 없어서 상단바(PageHeader) 대신 이 버튼만 씁니다.
"use client"

import { useRef, useState } from "react"
import { Menu } from "lucide-react"
import { SiteMenu } from "@/components/site-menu"

export function HomeMenuButton() {
  const [open, setOpen] = useState(false)
  // 패널을 햄버거와 같은 높이에서 열기 위해 버튼 위치를 재둡니다
  const [anchorTop, setAnchorTop] = useState(80)
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setAnchorTop(Math.round(rect.top))
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        aria-label="메뉴 열기"
        className="inline-flex h-11 w-11 items-center justify-center text-brand-ink transition-opacity hover:opacity-70"
      >
        <Menu className="h-7 w-7" />
      </button>
      <SiteMenu open={open} onClose={() => setOpen(false)} anchorTop={anchorTop} showHome={false} />
    </>
  )
}
