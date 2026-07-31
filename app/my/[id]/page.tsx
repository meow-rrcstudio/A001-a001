// app/my/[id]/page.tsx
// 예전에 본 타로점 한 건을 그때 대화 그대로 다시 여는 화면입니다.
//
// 메뉴의 "최근 본 타로점"과 MY 기록의 한 줄이 모두 여기로 옵니다.
// 여기서 이어서 물어본 말도 그 타로점에 계속 쌓입니다.
"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { ReadingResultView, type PickedCard } from "@/components/reading-result-view"
import { Button } from "@/components/ui/button"
import { appendTurn, getReading, replaceTurns, type SavedReading } from "@/lib/reading-archive"
import { PromptReadingView } from "@/components/prompt-reading-view"
import { useAccount } from "@/lib/use-account"
import { CREDIT_UNIT } from "@/lib/credit-packs"
import { CardReadingFlow } from "@/components/card-reading-flow"
import { FREE_QUESTION_SLUG } from "@/lib/free-question"
import { layoutKeyForCount } from "@/lib/ai/reading-plan"
import type { ChatDrawRequest } from "@/lib/ai/reading-chat"
import type { LayoutKey } from "@/lib/spread-layouts"

export default function SavedReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reading, setReading] = useState<SavedReading | null>(null)
  const [ready, setReady] = useState(false)
  const { account } = useAccount()
  // 예전 판을 다시 열어 이어 물을 때도 카드를 더 뽑을 수 있어야 합니다.
  // ⚠️ 이게 없으면 샨티가 "카드를 더 뽑아보자"고 말해도 뽑을 화면이 없어서
  //    대화가 그 자리에서 멈춥니다 (/tarot/ask 에만 있던 문제였습니다).
  const [followup, setFollowup] = useState<{
    draw: ChatDrawRequest
    done: (picked: PickedCard[]) => void
  } | null>(null)
  const [extraCards, setExtraCards] = useState<PickedCard[]>([])

  const handleDrawRequest = useCallback(
    (draw: ChatDrawRequest, done: (picked: PickedCard[]) => void) => {
      setFollowup({ draw, done })
    },
    []
  )

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

  // ── 해석이 없는 판 ──────────────────────────────────────────────
  // 크레딧은 나갔는데 해석이 오지 않고 끝난 판입니다 (하루 한도·시간 초과).
  //
  // ⚠️ 예전에는 이 판을 열면 브라우저가 "This page couldn't load" 를 띄웠습니다.
  //    해석 화면이 result.title 을 읽다 null 에서 터진 것입니다 — 기록
  //    목록에는 멀쩡히 보이는데 누르면 죽어서 원인을 짚기 어려웠습니다.
  //    (지금은 그 판이 새로 생기지 않게 크레딧을 되돌려주지만, 이미 남아
  //     있는 판과 앞으로의 중간 실패를 위해 화면이 필요합니다)
  if (!result?.title) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/my" />
        <main
          className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center ${HEADER_SPACE}`}
        >
          <p className="text-pretty text-reading leading-relaxed text-foreground">
            이 판은 카드까지만 놓이고 해석이 오지 못했다냥.
          </p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {reading.question}
          </p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            쓴 {CREDIT_UNIT.one}은 돌려드렸어요. 다시 물어보면 이 몸이 새로 읽어줄게.
          </p>
          <Button variant="solid" size="pill" className="mt-8" render={<Link href="/tarot/ask" />}>
            다시 물어보기
          </Button>
          <Link
            href="/my"
            className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
          >
            기록으로 돌아가기
          </Link>
        </main>
      </div>
    )
  }

  return (
    <>
      <ReadingResultView
        question={reading.question}
        result={reading.result}
        cards={reading.cards}
        layoutKey={reading.layoutKey}
        readingId={reading.id}
        // 그때 그 판에 딸렸던 몫 그대로 셉니다 (선물 판과 산 판이 다릅니다).
        // 브라우저 보관함에만 있는 옛 기록에는 없어서, 그때는 산 판으로 봅니다.
        followupsAllowed={reading.followupsAllowed}
        resultRating={reading.rating}
        positions={reading.positions}
        backHref="/my"
        initialTurns={reading.turns}
        onTurn={(turn) => appendTurn(reading.id, turn)}
        onTurnsReplace={(turns) => replaceTurns(reading.id, turns)}
        onDrawRequest={handleDrawRequest}
      />

      {/* 이어 묻는 중에 카드를 더 뽑기 — 해석 화면 위에 덮습니다.
          걷어내면 나눈 대화가 사라지기 때문에 화면을 바꾸지 않습니다. */}
      {followup && (
        <div className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-background">
          <main
            className={`relative z-10 mx-auto flex w-full min-h-0 max-w-site flex-1 flex-col px-6 sm:px-8 ${HEADER_SPACE}`}
          >
            {/* 뒤로가기는 이 덮개만 걷습니다 (/my 로 나가면 대화가 사라집니다).
                빈 배열 = 뽑기를 물렀다는 뜻입니다. */}
            <PageHeader
              variant="reading"
              onBack={() => {
                followup.done([])
                setFollowup(null)
              }}
            />
            <CardReadingFlow
              mode="inline"
              topicLabel={reading.question}
              topicSlug="self"
              question={{
                slug: FREE_QUESTION_SLUG,
                label: reading.question,
                layoutKey: layoutKeyForCount(followup.draw.positions.length) as LayoutKey,
                positions: followup.draw.positions,
              }}
              introMessage={followup.draw.intro}
              excludeNames={[...reading.cards, ...extraCards].map((c) => c.name)}
              // 이미 섞어서 펼쳐둔 판입니다 — 다시 섞지 않고 이어서 뽑습니다.
              skipShuffle
              onComplete={(picked) => {
                followup.done(picked)
                setExtraCards((prev) => [...prev, ...picked])
                setFollowup(null)
              }}
            />
          </main>
        </div>
      )}
    </>
  )
}
