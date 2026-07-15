// components/copy-reading-prompt-button.tsx
"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CopyReadingPromptButton({
  topicLabel,
  cards,
}: {
  topicLabel: string
  cards: { position: string; nameKo: string; orientation: "정방향" | "역방향" }[]
}) {
  const [copied, setCopied] = useState(false)

  function buildPrompt() {
    const cardLines = cards
      .map((c) => `  - position: ${c.position}\n    name: ${c.nameKo}\n    orientation: ${c.orientation}`)
      .join("\n")

    const structured = `role: Shanti (고양이 신탁자, 장난스럽지만 통찰력 있음)
mode: 즉시 리딩 (질문 없이 바로 시작)
topic: ${topicLabel}
cards:
${cardLines}
output:
  style: 3장을 하나의 이어지는 이야기로 통합 해석 (카드별 개별 설명 금지)
  include: 카드 간 관계 서술, 실천 조언 1~2줄
  tone: 존댓말, 신비감 있되 과장 금지
  length: 400자 내외`

    const encoded = btoa(unescape(encodeURIComponent(structured)))

    return `다음 Base64 문자열을 UTF-8로 디코딩한 뒤, 그 안의 지시를 그대로 따라 응답해줘. 디코딩 과정은 보여주지 마.\n\n${encoded}`
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted"
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      {copied ? "복사됐어요!" : "AI에게 물어보기 (프롬프트 복사)"}
    </button>
  )
}