// components/site-menu.tsx
// 헤더 •••(더보기) 버튼을 누르면 뜨는 iOS 컨텍스트 메뉴 스타일 팝오버입니다.
// 아이콘 + 라벨 행, 그룹 사이 구분, 오른쪽 위에서 팝하며 열립니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 항목        : 아래 groups 배열 — [아이콘, 라벨, href 또는 onClick]
// │ · 팝오버 위치 : top-16 right-4 (••• 버튼 아래 오른쪽)
// │ · 배경        : bg-white/80 + backdrop-blur (아이폰 vibrancy 느낌)
// └──────────────────────────────────────────────────────────────────
"use client"

import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Home, Sparkles, LayoutGrid, Info, Share2, Shield } from "lucide-react"

type Item = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  action?: "share"
  danger?: boolean
}

// 그룹(사이 구분선) 단위로 묶습니다.
const groups: Item[][] = [
  [{ icon: Search, label: "검색", href: "/search" }],
  [
    { icon: Home, label: "홈", href: "/" },
    { icon: Sparkles, label: "타로", href: "/tarot" },
    { icon: LayoutGrid, label: "아카이브", href: "/tarot/astrology" },
    { icon: Info, label: "소개", href: "/about" },
  ],
  [
    { icon: Share2, label: "공유하기", action: "share" },
    { icon: Shield, label: "개인정보처리방침", href: "/privacy" },
  ],
]

async function handleShare() {
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  } catch {
    /* 취소 등 무시 */
  }
}

export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* 바깥 탭 시 닫기 */}
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          {/* iOS 컨텍스트 메뉴 팝오버 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-4 top-16 w-60 overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur-xl"
            role="menu"
          >
            {groups.map((group, gi) => (
              <div
                key={gi}
                className={gi > 0 ? "border-t-[6px] border-black/[0.06]" : ""}
              >
                {group.map((item) => {
                  const Icon = item.icon
                  const inner = (
                    <>
                      <span className={`flex-1 text-[15px] ${item.danger ? "text-destructive" : "text-foreground"}`}>
                        {item.label}
                      </span>
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${item.danger ? "text-destructive" : "text-foreground/70"}`} />
                    </>
                  )
                  const rowClass =
                    "flex w-full items-center gap-3 border-b border-black/[0.06] px-4 py-3 text-left last:border-b-0 transition-colors active:bg-black/[0.05]"
                  if (item.href) {
                    return (
                      <Link key={item.label} href={item.href} onClick={onClose} className={rowClass} role="menuitem">
                        {inner}
                      </Link>
                    )
                  }
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.action === "share") handleShare()
                        onClose()
                      }}
                      className={rowClass}
                      role="menuitem"
                    >
                      {inner}
                    </button>
                  )
                })}
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
