// components/card-detail-view.tsx
// 카드 상세 페이지의 스크롤 연출 + 레이아웃을 담당하는 클라이언트 컴포넌트입니다.
//
// 동작 (시안 기준):
//   1. 진입 시 카드 이미지가 화면 위쪽에 보이고, 설명 패널이 그 아래에서 살짝 걸쳐 있습니다.
//   2. 아래로 스크롤하면 설명 패널이 고정된 이미지를 덮으며 위로 올라옵니다.
//   3. 패널이 맨 위까지 올라오면 헤더가 (플로팅 뒤로가기 → 솔리드 바 : 뒤로·공유·목록) 로 바뀝니다.
//   · 카드 이미지가 없는 글은 처음부터 3번(솔리드 헤더) 상태로 시작합니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 이미지 영역 높이 : IMAGE_VH (기본 64vh)
// │ · 패널 시작 위치   : PANEL_TOP_VH (기본 56vh) — 작을수록 이미지를 더 덮음
// │ · 칩 색            : bg-secondary + text-primary (연분홍 배경 + 테라코타 글자)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { formatDate } from "@/lib/format-date"

const IMAGE_VH = 64 //     고정 카드 이미지 영역 높이 (vh)
const PANEL_TOP_VH = 56 // 설명 패널이 시작하는 위치 (vh)
const HEADER_H = 56 //     솔리드 헤더 높이 (px) — 헤더 전환 임계값 계산에 사용
const MAX_SCALE = 0.28 //  스크롤 끝에서 이미지가 얼마나 더 커지는지 (1 + 0.28 = 1.28배)
const MAX_BLUR = 10 //     스크롤 끝에서 이미지 블러 강도 (px)

export interface AdjacentCard {
  slug: string
  title: string
  coverImage: string | null
  arcana: string | null
  suit: string | null
}

export function CardDetailView({
  title,
  publishedDate,
  arcana,
  suit,
  element,
  readMinutes,
  coverImage,
  backHref,
  fromParam,
  prev,
  next,
  summaryNode,
  contentNode,
  adNode,
}: {
  title: string
  publishedDate: string | null
  arcana: string | null
  suit: string | null
  element: string[]
  readMinutes: number
  coverImage: string | null
  backHref: string
  fromParam: string | null
  prev: AdjacentCard | null
  next: AdjacentCard | null
  summaryNode: ReactNode
  contentNode: ReactNode
  adNode: ReactNode
}) {
  const hasImage = Boolean(coverImage)
  // 이미지가 없으면 처음부터 솔리드 헤더(스크롤 완료) 상태로 시작합니다.
  const [scrolled, setScrolled] = useState(!hasImage)
  const panelRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null) // 스크롤에 따라 확대·블러할 이미지 래퍼

  useEffect(() => {
    if (!hasImage) return
    const onScroll = () => {
      const top = panelRef.current?.offsetTop ?? 0
      setScrolled(window.scrollY + HEADER_H >= top)

      // 스크롤 진행도(0~1): 패널이 이미지를 덮기까지의 비율.
      // 진행할수록 카드 이미지를 확대하고 블러를 걸어 배경처럼 흐려지게 합니다.
      // (리렌더 없이 요소 스타일을 직접 조작 → 스크롤이 부드러움)
      if (imageRef.current && top > 0) {
        const progress = Math.min(Math.max(window.scrollY / top, 0), 1)
        imageRef.current.style.transform = `scale(${1 + progress * MAX_SCALE})`
        imageRef.current.style.filter = `blur(${(progress * MAX_BLUR).toFixed(1)}px)`
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [hasImage])

  // 상단 칩 = Suit + Element(다중) (있는 것만)
  const chips = [suit, ...element].filter(Boolean) as string[]

  const metaParts = [
    publishedDate ? formatDate(publishedDate) : null,
    `${readMinutes} min read`,
    arcana,
  ].filter(Boolean) as string[]

  return (
    <div className={`relative min-h-screen ${hasImage ? "" : "bg-background"}`}>
      {/* 뒤에 고정으로 깔리는 카드 이미지 (스크롤할수록 확대+블러 — imageRef가 조작) */}
      {hasImage && (
        <div className="fixed inset-x-0 top-0 z-0 overflow-hidden" style={{ height: `${IMAGE_VH}vh` }}>
          <div ref={imageRef} className="relative h-full w-full will-change-transform">
            <Image
              src={coverImage as string}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-top"
            />
          </div>
        </div>
      )}

      {/* 플로팅 뒤로가기 (이미지 상태) */}
      {hasImage && (
        <Link
          href={backHref}
          aria-label="뒤로"
          className={`fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-foreground backdrop-blur transition-opacity duration-200 ${
            scrolled ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}

      {/* 솔리드 헤더 (스크롤 완료 상태) — 뒤로 · 공유 · 목록 */}
      <div
        className={`fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-opacity duration-200 ${
          scrolled ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-3 sm:px-8">
          <PageHeader backHref={backHref} />
        </div>
      </div>

      {/* 이미지가 보이는 투명 스페이서 (마진 상쇄 방지를 위해 margin 대신 실제 높이 사용) */}
      {hasImage && <div aria-hidden="true" style={{ height: `${PANEL_TOP_VH}vh` }} />}

      {/* 이미지를 덮으며 올라오는 설명 패널 */}
      <div ref={panelRef} className="relative z-10 rounded-t-3xl bg-background">

        <div className="mx-auto w-full max-w-3xl px-6 pt-16 sm:px-8">
          <h1 className="font-serif text-3xl font-bold italic leading-tight tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>

          {metaParts.length > 0 && (
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {metaParts.join(" · ")}
            </p>
          )}

          {/* 상단 칩 — Suit + Element */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* AI 요약 */}
          <div className="mt-8">{summaryNode}</div>

          {/* 본문 */}
          <div className="mt-6">{contentNode}</div>

          {/* 앞뒤 카드 이동 — Related Stories */}
          {(prev || next) && (
            <section className="mt-14">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl italic text-foreground">Related Stories</h2>
                <Link
                  href={backHref}
                  className="font-mono text-xs tracking-widest text-primary underline underline-offset-4"
                >
                  VIEW ALL
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AdjacentLink card={prev} direction="prev" fromParam={fromParam} />
                <AdjacentLink card={next} direction="next" fromParam={fromParam} />
              </div>
            </section>
          )}
        </div>

        {/* 카카오 광고 — 푸터 위, 본문과 같은 좌우 여백(px-6). 위아래 40px (adNode에 AdBand가 들어옵니다) */}
        <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8">{adNode}</div>

        <Footer variant="minimal" />
      </div>
    </div>
  )
}

/** 앞/뒤 카드 한 칸. card가 없으면 자리만 비워 둡니다(레이아웃 유지). */
function AdjacentLink({
  card,
  direction,
  fromParam,
}: {
  card: AdjacentCard | null
  direction: "prev" | "next"
  fromParam: string | null
}) {
  if (!card) return <div aria-hidden="true" />

  const href = `/blog/${card.slug}${fromParam ? `?from=${fromParam}` : ""}`
  const label = card.arcana ?? card.suit ?? "Tarot"
  const isPrev = direction === "prev"

  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 transition-colors hover:bg-secondary/50"
    >
      {isPrev && <ChevronLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
      {card.coverImage && (
        <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={card.coverImage} alt="" fill sizes="36px" className="object-cover" />
        </span>
      )}
      <span className={`min-w-0 flex-1 ${isPrev ? "" : "text-right"}`}>
        <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-xs font-medium text-foreground">{card.title}</span>
      </span>
      {!isPrev && <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
    </Link>
  )
}
