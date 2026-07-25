// components/ui/row-list.tsx
// 사이트 공용 "목록 행" — 번호 + 이름(+설명/꼬리표) + 화살표 한 줄.
//
// 메뉴 패널, MY 메뉴, 스타일가이드가 전부 이 컴포넌트를 씁니다.
// 페이지마다 따로 마크업을 쓰지 않기 위한 것이므로, 행 모양을 바꿀 일이
// 생기면 여기만 고치면 모든 목록이 함께 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ variant="panel" : 흰 상자 + 얇은 검정 테두리 (메뉴 오버레이)
// │ variant="plain" : 테두리 없이 옅은 구분선만 (MY 메뉴 등 본문 안 목록)
// │
// │ · 행 높이   : panel py-2.5 / plain py-4
// │ · 이름 크기 : panel text-lg / plain text-base
// │ · 준비중    : ready:false 를 주면 흐려지고 클릭이 막힙니다
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type RowItem = {
  /** 왼쪽 작은 번호 (예: "01"). 없으면 표시하지 않습니다 */
  number?: string
  label: string
  href: string
  /** 이름 아래 한 줄 설명 */
  desc?: string
  /** 이름 옆 작은 꼬리표 (기본: 준비중일 때 "준비중") */
  tag?: string
  /** false 면 흐려지고 클릭이 막힙니다 */
  ready?: boolean
}

export function RowList({
  items,
  variant = "panel",
  onNavigate,
  className,
}: {
  items: RowItem[]
  variant?: "panel" | "plain"
  /** 행을 눌렀을 때 추가로 할 일 (예: 메뉴 닫기) */
  onNavigate?: () => void
  className?: string
}) {
  const panel = variant === "panel"

  return (
    <nav
      className={cn(panel && "border border-foreground bg-card", "flex flex-col", className)}
    >
      {items.map((item, i) => {
        const ready = item.ready !== false
        const tag = item.tag ?? (ready ? undefined : "준비중")

        const rowClass = cn(
          "group flex items-center",
          panel ? "gap-3 px-3.5 py-2.5" : "gap-4 py-4",
          i > 0 && (panel ? "border-t border-foreground" : "border-t border-border"),
          ready ? "transition-colors hover:bg-muted/60" : "cursor-not-allowed"
        )

        const body = (
          <>
            {item.number && (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {item.number}
              </span>
            )}
            <span className="flex flex-1 flex-col">
              <span className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    panel ? "text-lg" : "text-base font-medium",
                    ready ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                {tag && <span className="text-[11px] text-muted-foreground">{tag}</span>}
              </span>
              {item.desc && (
                <span className="mt-0.5 text-sm text-muted-foreground">{item.desc}</span>
              )}
            </span>
            <ArrowUpRight
              className={cn(
                "h-4 w-4 shrink-0",
                panel ? "text-foreground" : "h-5 w-5 text-accent",
                ready && "transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                !ready && "text-muted-foreground/50"
              )}
            />
          </>
        )

        return ready ? (
          <Link key={item.label} href={item.href} onClick={onNavigate} className={rowClass}>
            {body}
          </Link>
        ) : (
          <span key={item.label} aria-disabled="true" className={rowClass}>
            {body}
          </span>
        )
      })}
    </nav>
  )
}
