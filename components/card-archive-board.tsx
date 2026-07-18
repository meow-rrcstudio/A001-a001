// components/card-archive-board.tsx
// 카드 아카이브 보드 — 노션 글이 자동으로 매칭되어 나타나는 목록 UI입니다.
// (blog-post-list 시안 기준. 데이터 로직은 lib/card-archive.ts)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 대분류 컬럼 폭   : COLUMN_WIDTH = 200 (시안 "200 고정")
// │ · 컬럼 사이 간격   : gap-2 (8px — 시안 측정치)
// │ · 처음 보이는 개수 : PAGE_SIZE = 8, "더 불러오기"마다 +8
// │ · 패널 바탕        : bg-muted/50 → /70이면 더 진하게
// │ · 뱃지 색          : badgeColors 배열 — 컬럼 순서대로 번갈아 사용
// │ · 목록 행 높이     : py-2 (위아래 8px)
// │ · 번호 색          : text-primary/75 (옅은 테라코타 — 시안 #e09278)
// │ · 좌우 스크롤      : 패널 상자(제목·컬럼)가 통째로 스크롤
// │                      시작·끝 여백 16px(px-4) + 상자 안 여백 8px(px-2)
// │ · 더 불러오기 버튼 : 스크롤 안 따라가고 화면에 고정 (좌우 16+8px)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import type { ArchiveDeck } from "@/lib/card-archive"

const COLUMN_WIDTH = 200
const PAGE_SIZE = 8
const badgeColors = ["bg-[#e8d8d2]", "bg-[#cadff6]"]

export function CardArchiveBoard({ decks }: { decks: ArchiveDeck[] }) {
  const [query, setQuery] = useState("")
  const [activeDeck, setActiveDeck] = useState("all")
  // 덱별로 "더 불러오기"를 누른 횟수만큼 8개씩 더 보여줍니다.
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})

  // 메뉴(목록)의 검색에서 넘어온 경우: 주소의 ?q=검색어 를 검색창에 채웁니다.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) setQuery(q)
  }, [])

  // 검색어: 덱 이름, 대분류, 숫자, 글 제목 무엇으로든 걸립니다.
  const normalizedQuery = query.trim().toLowerCase()

  const filteredDecks = useMemo(() => {
    return decks
      .filter((deck) => activeDeck === "all" || deck.key === activeDeck)
      .map((deck) => {
        if (!normalizedQuery) return deck
        const deckHit =
          deck.key.includes(normalizedQuery) || deck.label.toLowerCase().includes(normalizedQuery)
        return {
          ...deck,
          categories: deck.categories
            .map((category) => {
              const categoryHit =
                deckHit ||
                category.key.includes(normalizedQuery) ||
                category.label.toLowerCase().includes(normalizedQuery)
              return {
                ...category,
                cards: categoryHit
                  ? category.cards
                  : category.cards.filter(
                      (card) =>
                        card.title.toLowerCase().includes(normalizedQuery) ||
                        String(card.number) === normalizedQuery
                    ),
              }
            })
            .filter((category) => category.cards.length > 0),
        }
      })
      .filter((deck) => deck.categories.length > 0)
  }, [decks, activeDeck, normalizedQuery])

  return (
    <>
      <PageHeader backHref="/tarot" showShare className="mb-8" />

      {/* 페이지 제목 — 세리프 이탤릭 + 테라코타 애스터리스크(✳) */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-5xl italic leading-tight text-foreground sm:text-6xl">
            Astrologyㅡ
          </h1>
          <span
            aria-hidden="true"
            className="shrink-0 font-serif text-5xl leading-none text-primary sm:text-6xl"
          >
            ✳
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          명상, 요가, 신화, 점성술, 그리고 타로를 통해 기록하고 연결하는 개인적인
          아카이브입니다. 당신의 영적 여정에 영감을 더하는 이야기들을 만나보세요.
        </p>
      </div>

      {/* 검색창 — 항상 표시. 메뉴(목록)의 검색에서 넘어오면 검색어가 채워진 채 열립니다 */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="덱 이름, 대분류, 숫자, 제목으로 검색"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* 필터 칩 — 덱 목록에서 자동 생성. 선택된 것은 테라코타 채움 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[{ key: "all", label: "all" }, ...decks.map((d) => ({ key: d.key, label: d.label }))].map(
          (chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveDeck(chip.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                activeDeck === chip.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary hover:bg-secondary/70"
              }`}
            >
              {chip.label}
            </button>
          )
        )}
      </div>

      {/* 덱 섹션들 */}
      <div className="space-y-6 pb-8">
        {filteredDecks.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {normalizedQuery ? "검색 결과가 없어요." : "아직 등록된 글이 없어요."}
          </p>
        )}

        {filteredDecks.map((deck) => (
          <ArchiveDeckSection
            key={deck.key}
            deck={deck}
            bleed
            // 검색 중에는 개수 제한 없이 결과 전체를 보여줍니다.
            limit={normalizedQuery ? Number.POSITIVE_INFINITY : (visibleCounts[deck.key] ?? PAGE_SIZE)}
            onLoadMore={() =>
              setVisibleCounts((counts) => ({
                ...counts,
                [deck.key]: (counts[deck.key] ?? PAGE_SIZE) + PAGE_SIZE,
              }))
            }
          />
        ))}
      </div>
    </>
  )
}

/** 덱 한 개 섹션 — 스타일가이드(/design-1859)에서도 같은 컴포넌트를 씁니다.
 *
 * 시안 구조: 둥근 패널 상자(제목·컬럼·더 불러오기 전부 포함)가 통째로
 * 좌우 스크롤됩니다. 스크롤 시작·끝에서 화면 가장자리와 상자 사이 16px,
 * 상자 안쪽에 8px 여백이 있습니다 (시안의 16/8 표기).
 *
 * bleed(기본 꺼짐): 아카이브 페이지처럼 페이지 좌우 여백(px-5, sm:px-8)을
 * 뚫고 나가 위의 16px 여백만 남기는 모드입니다. */
export function ArchiveDeckSection({
  deck,
  limit = PAGE_SIZE,
  onLoadMore,
  bleed = false,
}: {
  deck: ArchiveDeck
  limit?: number
  onLoadMore?: () => void
  bleed?: boolean
}) {
  const hasMore = deck.categories.some((category) => category.cards.length > limit)

  return (
    <div className={`relative ${bleed ? "-mx-5 sm:-mx-8" : ""}`}>
      {/* 스크롤 영역 — bleed일 때 페이지 여백을 -mx로 뚫고 화면 끝까지 */}
      <div className="overflow-x-auto">
        {/* 시작·끝 여백 담당 — px-4가 시안의 "화면 가장자리 ↔ 상자 16px" */}
        <div className={`flex w-max min-w-full ${bleed ? "px-4" : ""}`}>
          {/* 패널 상자 — 제목·컬럼이 상자째로 스크롤. px-2/pt-4/pb-2가 상자 안 여백(시안 8px) */}
          <section className="grow rounded-2xl bg-muted/50 px-2 pb-2 pt-4">
            <h2 className="mb-4 font-serif text-3xl italic text-foreground sm:text-4xl">
              {deck.label}
            </h2>

            {/* 대분류 컬럼 — 컬럼 폭 200px 고정, 간격 8px (시안 기준) */}
            <div className="flex gap-2">
              {deck.categories.map((category, columnIndex) => (
                <div key={category.key} className="shrink-0 space-y-2" style={{ width: COLUMN_WIDTH }}>
                  <div
                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium text-foreground ${
                      badgeColors[columnIndex % badgeColors.length]
                    }`}
                  >
                    {category.label}
                    <span className="ml-1.5 font-mono opacity-60">{category.cards.length}</span>
                  </div>

                  {category.cards.slice(0, limit).map((card) => (
                    <Link
                      key={card.slug}
                      href={`/blog/${card.slug}?from=astrology`}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 transition-colors hover:bg-secondary/60"
                    >
                      {/* 번호 — 시안 실측 #e09278: 테라코타를 75%로 옅게 */}
                      <span className="w-4 shrink-0 font-mono text-xs text-primary/75">{card.number}</span>
                      <span className="truncate text-[13px] text-foreground">{card.title}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {/* 아래 고정 버튼이 앉을 자리 — 상자 배경만 남겨둡니다 (버튼 높이 38px) */}
            {hasMore && onLoadMore && <div aria-hidden="true" className="mt-2 h-[38px]" />}
          </section>
        </div>
      </div>

      {/* 더 불러오기 — 스크롤을 따라가지 않고 화면에 고정.
          좌우 위치 = 상자 여백 16px + 상자 안 여백 8px = 24px(inset-x-6) */}
      {hasMore && onLoadMore && (
        <div className={`absolute bottom-2 ${bleed ? "inset-x-6" : "inset-x-2"}`}>
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full rounded-lg border border-border bg-card py-2.5 text-center text-xs text-foreground transition-colors hover:bg-secondary/60"
          >
            더 불러오기
          </button>
        </div>
      )}
    </div>
  )
}
