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
import { listRecent } from "@/lib/reading-archive"

/** 서랍이 드러나는 폭 — 페이지가 이만큼 왼쪽으로 밀립니다 */
const DRAWER_WIDTH = "78%"

const menuItems = [
  { label: "홈", href: "/", icon: TerminalSquare },
  // 주제를 고르는 화면으로 보냅니다. 예전에는 /tarot/reading/self 로
  // 바로 들어가서, 누구나 "나" 주제로 시작하게 됐습니다.
  { label: "타로보기", href: "/tarot/reading", icon: Archive },
  { label: "기록 보기", href: "/my", icon: FolderClosed },
  { label: "아카이빙", href: "/archive", icon: Layers },
  { label: "설정", href: "/my/settings", icon: SlidersHorizontal },
]

/**
 * 디자인시스템 페이지용 견본. 서랍은 화면 전체를 덮고 페이지를 밀기 때문에
 * 상자 안에 그대로 넣을 수 없어, 같은 menuItems 로 속만 그려 보여줍니다.
 * 항목을 고치면 실제 서랍과 이 견본이 함께 바뀝니다.
 */
export function SiteMenuPreview() {
  return (
    <div className="flex justify-end bg-background">
      {/* 왼쪽 = 밀려난 페이지, 오른쪽 = 드러난 서랍 */}
      <div className="flex-1 rounded-r-3xl bg-card shadow-overlay" />
      <nav aria-label="사이트 메뉴 견본" className="w-[78%] max-w-[300px] bg-muted px-6 pb-10 pt-6">
        {/* self-start 가 없으면 flex 가 폭을 늘려 로고가 옆으로 퍼집니다 */}
        <Wordmark className="h-9 self-start" />
        <ul className="mt-8 space-y-1">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <li key={item.label}>
                <span
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    i === 0 ? "bg-brand-lime-soft" : ""
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="font-myeongjo text-lg text-foreground">{item.label}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">최근 본 타로점</p>
          <p className="mt-3 truncate text-[15px] text-foreground">최근 질문이 여기에 쌓입니다</p>
        </div>
      </nav>
    </div>
  )
}

export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  // 지금 어느 메뉴에 있는지 — 딱 하나만 켜져야 합니다.
  //
  // ⚠️ startsWith 만 쓰면 안 됩니다. /my/settings 에서는 "/my"(기록)와
  //    "/my/settings"(설정)가 둘 다 걸려서 두 개가 동시에 켜집니다.
  //    걸리는 것 중 가장 긴 것(=가장 구체적인 것) 하나만 고릅니다.
  const activeHref = menuItems
    .filter((item) =>
      item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
  // 메뉴에 띄울 최근 타로점 (제목만 있으면 됩니다)
  const [recent, setRecent] = useState<{ id: string; question: string }[]>([])

  // 메뉴가 열리면
  //   · 뒤 페이지 스크롤을 잠그고 (아이폰 사파리는 overflow:hidden 을 무시해서 몸통을 고정)
  //   · 페이지(app-shell)를 왼쪽으로 밀어 뒤에 있는 서랍이 드러나게 합니다
  useEffect(() => {
    if (!open) return
    // 서버에 기록이 있으면 그것을, 없으면 브라우저 보관함을 봅니다.
    // (기록 화면과 같은 출처를 봐야 목록이 서로 어긋나지 않습니다)
    void (async () => {
      try {
        const response = await fetch("/api/readings?limit=4", { cache: "no-store" })
        // 로그아웃 상태(401)에서는 브라우저 보관함을 보지 않습니다 —
        // 앞 사람이 본 타로점이 남아 보이기 때문입니다 (lib/reading-history.ts 와 같은 규칙)
        if (response.status === 401 || !response.ok) {
          setRecent([])
          return
        }
        const data = (await response.json()) as {
          readings: { id: string; question: string }[] | null
        }
        setRecent(
          data.readings
            ? data.readings.slice(0, 4)
            : listRecent().map((r) => ({ id: r.id, question: r.question }))
        )
      } catch {
        setRecent(listRecent().map((r) => ({ id: r.id, question: r.question })))
      }
    })()

    const scrollY = window.scrollY
    const { style } = document.body
    style.position = "fixed"
    style.top = `-${scrollY}px`
    style.left = "0"
    style.right = "0"
    style.width = "100%"

    // 페이지 위에 흰 막을 씌워 메뉴에 눈이 가게 합니다 (globals.css)
    document.body.classList.add("menu-open")

    const shell = document.getElementById("app-shell")
    if (shell) {
      shell.style.transition = "transform 0.28s ease, border-radius 0.28s ease"
      shell.style.transform = `translateX(-${DRAWER_WIDTH})`
      shell.style.borderTopRightRadius = "24px"
      shell.style.borderBottomRightRadius = "24px"
      shell.style.boxShadow = "var(--elevation-overlay)"
      shell.style.overflow = "hidden"
    }

    return () => {
      style.position = ""
      style.top = ""
      style.left = ""
      style.right = ""
      style.width = ""
      window.scrollTo(0, scrollY)
      document.body.classList.remove("menu-open")
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
    <div className="fixed inset-0 z-0 bg-muted">
      {/* 뒤판을 메뉴와 같은 색(bg-muted)으로 깔아둡니다.
          페이지가 왼쪽으로 밀릴 때 둥근 모서리 안쪽으로 이 색이 비칩니다 —
          다른 색이면 모서리에 엉뚱한 색 조각이 보입니다. */}

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
        {/* self-start 가 없으면 flex 가 폭을 늘려 로고가 옆으로 퍼집니다 */}
        <Wordmark className="h-9 self-start" />

        <ul className="mt-8 space-y-1">
          {menuItems.map((item) => {
            const active = item.href === activeHref
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

        {/* 최근 본 타로점 — 누르면 그때 나눈 대화가 그대로 열립니다.
            기록이 없으면 이 영역은 나오지 않습니다 */}
        {recent.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">최근 본 타로점</p>
            <ul className="mt-3 space-y-3">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/my/${r.id}`}
                    onClick={onClose}
                    className="block truncate text-[15px] text-foreground transition-opacity hover:opacity-70"
                  >
                    {r.question}
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
