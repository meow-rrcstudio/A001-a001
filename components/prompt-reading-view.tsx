// components/prompt-reading-view.tsx
// 무료 흐름으로 본 타로점을 기록에서 다시 열었을 때 보이는 화면.
//
// 해석은 우리가 만들지 않았으니 보여줄 글이 없습니다. 대신
//   · 그때 뽑은 카드
//   · 복사해 갔던 프롬프트 (다시 복사할 수 있게)
//   · 샨티에게 직접 들어보라는 권유
// 를 보여줍니다.
//
// ⚠️ AI 해석 화면(ReadingResultView)을 그대로 쓰면 제목·요약·섹션이 다
//    비어 있어 "고장난 기록"처럼 보입니다. 그래서 화면을 따로 둡니다.
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Copy } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { CREDIT_UNIT } from "@/lib/credit-packs"
import { formatDate } from "@/lib/format-date"
import type { PickedCard } from "@/components/reading-result-view"

export function PromptReadingView({
  question,
  at,
  cards,
  promptText,
  result,
  isLoggedIn,
  backHref = "/my",
}: {
  question: string
  at?: string
  cards: PickedCard[]
  promptText?: string
  /**
   * 그때 받은 맛보기 해석 (있으면).
   *
   * 카드만 뽑고 프롬프트만 복사해 간 옛 기록에는 없습니다. 그때는 지금처럼
   * "카드만 뽑아둔 판"으로 그립니다.
   */
  result?: { title?: string; summary?: string; sections?: { heading: string; body: string }[] }
  isLoggedIn: boolean
  backHref?: string
}) {
  const hasReading = Boolean(result?.title && result.sections?.length)
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!promptText) return
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 클립보드가 막힌 환경 — 아래 글을 직접 골라 복사할 수 있습니다
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto w-full max-w-site flex-1 px-6 pb-16 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader backHref={backHref} title={question} />

        <p className="mt-1 text-xs text-muted-foreground">
          {at ? formatDate(at) : ""} · {hasReading ? "맛보기로 본 타로점" : "프롬프트로 본 타로점"}
        </p>
        <h1 className="mt-2 text-reading-xl font-bold leading-snug text-foreground">{question}</h1>

        {/* 그때 뽑은 카드 */}
        {cards.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {cards.map((card, i) => (
              <div key={`${card.name}-${i}`} className="w-[64px]">
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className={`w-full rounded-md outline outline-[0.5px] outline-black/20 ${
                      card.reversed ? "rotate-180" : ""
                    }`}
                  />
                )}
                <p className="mt-1 text-center text-[11px] leading-tight text-muted-foreground">
                  {card.name}
                  {card.reversed && " (역)"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 그때 받은 맛보기 해석 — 없으면(옛 기록) 통째로 건너뜁니다 */}
        {hasReading && (
          <article className="mt-6">
            <h2 className="text-reading-xl font-bold leading-snug tracking-tight text-foreground">
              {result?.title}
            </h2>
            {result?.summary && (
              <p className="mt-3 text-reading leading-relaxed text-foreground/90">
                {result.summary}
              </p>
            )}
            {result?.sections?.map((s, i) => (
              <section key={`${s.heading}-${i}`} className="mt-5">
                <h3 className="text-reading-lg font-semibold text-foreground">{s.heading}</h3>
                <p className="mt-1.5 whitespace-pre-line text-reading leading-relaxed text-foreground/90">
                  {s.body}
                </p>
              </section>
            ))}
          </article>
        )}

        {/* 다음 걸음 — 이 화면의 주된 목적입니다 */}
        <div className="mt-7 rounded-2xl bg-card p-4 shadow-raised">
          <p className="text-reading leading-relaxed text-foreground">
            {hasReading
              ? "여기까지가 맛보기라네. 이 몸이 더 오래 들여다보면 궁금한 걸 이어서 물을 수도 있다냥."
              : "이 판은 카드만 뽑아둔 것이라네. 이 몸이 직접 읽어주면 궁금한 걸 이어서 물을 수도 있다냥."}
          </p>
          {isLoggedIn ? (
            <Link
              href="/my/credits"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {CREDIT_UNIT.one}으로 샨티에게 직접 듣기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/login?next=/my"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              가입하고 이어서 물어보기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* 그때 복사해 간 프롬프트 — 다시 쓸 수 있게 그대로 둡니다 */}
        {promptText && (
          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">복사한 프롬프트</p>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "복사했어냥!" : "복사"}
              </button>
            </div>
            {/* 클립보드가 막힌 환경에서는 길게 눌러 직접 고를 수 있어야 합니다 */}
            <div className="mt-2 max-h-72 select-all overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {promptText}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
