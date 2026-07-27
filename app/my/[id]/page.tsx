// app/my/[id]/page.tsx
// 예전에 본 타로점 한 건을 그때 대화 그대로 다시 여는 화면입니다.
//
// 메뉴의 "최근 본 타로점"과 MY 기록의 한 줄이 모두 여기로 옵니다.
// 여기서 이어서 물어본 말도 그 타로점에 계속 쌓입니다.
"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ReadingResultView } from "@/components/reading-result-view"
import { Button } from "@/components/ui/button"
import { appendTurn, getReading, replaceTurns, type SavedReading } from "@/lib/reading-archive"
import { sampleReading } from "@/lib/mock-reading-history"

export default function SavedReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reading, setReading] = useState<SavedReading | null>(null)
  const [ready, setReady] = useState(false)

  // 보관함은 브라우저에 있어서 화면이 뜬 뒤에 읽습니다
  useEffect(() => {
    setReading(getReading(id) ?? (sampleReading(id) as SavedReading | null))
    setReady(true)
  }, [id])

  if (!ready) return <div className="min-h-screen bg-background" />

  // 지운 기록이거나 다른 기기에서 본 타로점
  if (!reading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/my" />
        <main
          className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center ${HEADER_SPACE}`}
        >
          <p className="text-pretty leading-relaxed text-muted-foreground">
            이 타로점은 찾을 수 없어요. 다른 기기에서 본 기록일 수 있어요.
          </p>
          <Button variant="solid" size="pill" className="mt-8" render={<Link href="/my" />}>
            기록으로 돌아가기
          </Button>
        </main>
      </div>
    )
  }

  return (
    <ReadingResultView
      question={reading.question}
      result={reading.result}
      cards={reading.cards}
      layoutKey={reading.layoutKey}
      positions={reading.positions}
      backHref="/my"
      initialTurns={reading.turns}
      onTurn={(turn) => appendTurn(reading.id, turn)}
      onTurnsReplace={(turns) => replaceTurns(reading.id, turns)}
    />
  )
}
