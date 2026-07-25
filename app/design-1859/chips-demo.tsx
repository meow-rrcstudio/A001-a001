// app/design-1859/chips-demo.tsx
// 스타일가이드에서 필터 칩을 눌러볼 수 있게 하는 데모용 래퍼입니다.
// (칩 자체는 components/ui/filter-chips.tsx — 여기서는 상태만 들고 있습니다)
"use client"

import { useState } from "react"
import { FilterChips } from "@/components/ui/filter-chips"

export function ChipsDemo() {
  const [value, setValue] = useState("all")
  return (
    <FilterChips
      ariaLabel="견본 필터"
      value={value}
      onChange={setValue}
      chips={[
        { key: "all", label: "all" },
        { key: "universal", label: "Universal waite" },
        { key: "lenormand", label: "Lenormand" },
        { key: "oracle", label: "Oracle" },
      ]}
    />
  )
}
