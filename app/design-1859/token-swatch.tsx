// app/design-1859/token-swatch.tsx
// 색상 견본 카드. 브라우저에서 실제 적용 중인 CSS 변수 값을 읽어와 표시하므로
// globals.css 를 고치면 이 페이지의 값 표기도 자동으로 따라옵니다.
"use client"

import { useEffect, useState } from "react"

export function TokenSwatch({
  varName,
  label,
  description,
}: {
  varName: string // 예: "--primary"
  label: string
  description: string
}) {
  const [value, setValue] = useState("")

  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName)
    setValue(v.trim())
  }, [varName])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="h-16 w-full border-b border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="space-y-1 p-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{varName}</p>
        <p className="break-all font-mono text-[11px] text-muted-foreground/70">{value}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
