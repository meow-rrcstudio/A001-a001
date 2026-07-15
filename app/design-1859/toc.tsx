// app/design-1859/toc.tsx
// 스타일가이드 오른쪽에 고정되는 점프 목차입니다.
// 스크롤 위치에 따라 현재 보고 있는 섹션이 포인트색으로 표시됩니다.
"use client"

import { useEffect, useState } from "react"

export interface TocGroup {
  label: string // 그룹 이름 (예: "파운데이션")
  items: { id: string; label: string }[] // id = 섹션의 HTML id
}

export function Toc({ groups }: { groups: TocGroup[] }) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    const ids = groups.flatMap((group) => group.items.map((item) => item.id))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      // 화면 위쪽 20% ~ 35% 사이에 들어온 섹션을 "현재 위치"로 판정
      { rootMargin: "-20% 0px -65% 0px" }
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [groups])

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav aria-label="목차" className="text-sm">
      <p className="mb-3 font-semibold text-foreground">목차</p>
      {groups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
            {group.label}
          </p>
          <ul>
            {group.items.map((item) => {
              const active = activeId === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(item.id)}
                    className={`block w-full border-l-2 py-1 pl-3 text-left transition-colors ${
                      active
                        ? "border-primary font-medium text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
