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
import { PromptReadingView } from "@/components/prompt-reading-view"
import { useAccount } from "@/lib/use-account"

export default function SavedReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reading, setReading] = useState<SavedReading | null>(null)
  const [ready, setReady] = useState(false)
  const { account } = useAccount()

  // 서버에 있으면 서버 것을, 없으면 브라우저 보관함을 봅니다.
  // (연결 전에 본 타로점은 아직 브라우저에만 있습니다)
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch(`/api/readings/${id}`, { cache: "no-store" })
        // 서버가 못 준 이유를 삼키지 않습니다. 예전에는 조용히 브라우저
        // 보관함으로 넘어가 "찾을 수 없어요"만 떴고, 왜인지 알 길이
        // 없었습니다 (실제 원인은 서버 쪽 조회 실패였습니다).
        if (!response.ok) {
          console.error("[my/:id] 서버가 타로점을 주지 않았습니다:", response.status)
        }
        const data = (await response.json()) as { reading: SavedReading | null }
        if (!alive) return
        setReading(data.reading ?? getReading(id))
      } catch {
        if (alive) setReading(getReading(id))
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
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

  // 무료 흐름(프롬프트 복사)으로 본 판은 해석이 없습니다. AI 해석 화면을
  // 그대로 쓰면 제목·요약·섹션이 다 비어 "고장난 기록"처럼 보이므로 따로 그립니다.
  const result = reading.result as (typeof reading.result & { kind?: string; promptText?: string }) | null
  if (result?.kind === "prompt" || reading.kind === "prompt") {
    return (
      <PromptReadingView
        question={reading.question}
        at={reading.at}
        cards={reading.cards}
        promptText={result?.promptText ?? reading.promptText}
        isLoggedIn={account.isLoggedIn}
      />
    )
  }

  return (
    <ReadingResultView
      question={reading.question}
      result={reading.result}
      cards={reading.cards}
      layoutKey={reading.layoutKey}
      readingId={reading.id}
      resultRating={reading.rating}
      positions={reading.positions}
      backHref="/my"
      initialTurns={reading.turns}
      onTurn={(turn) => appendTurn(reading.id, turn)}
      onTurnsReplace={(turns) => replaceTurns(reading.id, turns)}
    />
  )
}
