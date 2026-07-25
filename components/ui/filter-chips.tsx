// components/ui/filter-chips.tsx
// 사이트 공용 필터 칩 — 아카이브의 덱 필터(all / Universal waite / …)처럼
// 목록을 좁혀 보는 데 쓰는 알약 버튼 줄입니다.
//
// 페이지마다 따로 마크업을 쓰지 않기 위한 것이므로, 칩 모양을 바꿀 일이
// 생기면 여기만 고치면 모든 칩이 함께 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 선택된 칩   : bg-primary(검정) + 흰 글자 — 시안의 선택 상태
// │ · 선택 안 됨  : bg-secondary(연라임) + 기본 글자
// │ · 칩 크기     : px-4 py-2 · text-xs
// │ · 줄 넘김     : 기본은 좌우 스크롤. wrap 을 주면 여러 줄로 접힙니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { cn } from "@/lib/utils"

export type FilterChip = {
  /** 값 (선택 비교용) */
  key: string
  label: string
}

export function FilterChips({
  chips,
  value,
  onChange,
  wrap = false,
  className,
  ariaLabel = "필터",
}: {
  chips: FilterChip[]
  value: string
  onChange: (key: string) => void
  wrap?: boolean
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-2",
        wrap ? "flex-wrap" : "overflow-x-auto pb-1",
        className
      )}
    >
      {chips.map((chip) => {
        const selected = value === chip.key
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(chip.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:opacity-80"
            )}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
