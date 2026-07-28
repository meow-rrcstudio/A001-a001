// components/composer-preview.tsx
// 스타일가이드(/design-1859)에서 입력 상자를 실제로 쳐볼 수 있게 하는 견본입니다.
// 이것 하나만 클라이언트 컴포넌트라, 가이드 페이지는 서버 컴포넌트로 둘 수 있습니다.
"use client"

import { useState } from "react"
import { ChatInput } from "@/components/chat-input"

export function ComposerPreview() {
  const [value, setValue] = useState("")
  const [sent, setSent] = useState<string | null>(null)

  return (
    <div>
      <ChatInput
        value={value}
        onChange={setValue}
        onSubmit={() => {
          setSent(value)
          setValue("")
        }}
        placeholder="무엇이든 물어보세요."
        ariaLabel="견본 입력"
      />
      <p className="mt-2 px-1 font-mono text-[11px] text-muted-foreground">
        {sent === null ? "보내기를 누르면 여기에 보인 글이 찍힙니다" : `보냄: ${sent}`}
      </p>
    </div>
  )
}
