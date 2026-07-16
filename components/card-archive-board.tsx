// components/card-archive-board.tsx
// 카드 아카이브 보드 — 노션 글이 자동으로 매칭되어 나타나는 목록 UI입니다.
// (blog-post-list 시안 기준. 데이터 로직은 lib/card-archive.ts)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 대분류 컬럼 폭   : COLUMN_WIDTH = 200 (시안 "200 고정")
// │ · 처음 보이는 개수 : PAGE_SIZE = 8, "더 불러오기"마다 +8
// │ · 패널 바탕        : bg-muted/50 → /70이면 더 진하게
// │ · 뱃지 색          : badgeColors 배열 — 컬럼 순서대로 번갈아 사용
// │ · 목록 행 높이     : py-2 (위아래 8px)
// │ · 번호 색          : text-primary (테라코타)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import type { ArchiveDeck } from "@/lib/card-archive"

const COLUMN_WIDTH = 200
const PAGE_SIZE = 8
const badgeColors = ["bg-[#e8d8d2]", "bg-[#cadff6]"]

export function CardArchiveBoard({ decks }: { decks: ArchiveDeck[] }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeDeck, setActiveDeck] = useState("all")
  // 덱별로 "더 불러오기"를 누른 횟수만큼 8개씩 더 보여줍니다.
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})

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
      <PageHeader
        backHref="/tarot"
        showShare
        showSearch
        onSearchClick={() => setSearchOpen((open) => !open)}
        className="mb-8"
      />

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

      {/* 검색창 — 헤더 돋보기를 누르면 열립니다 */}
      {searchOpen && (
        <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="덱 이름, 대분류, 숫자, 제목으로 검색"
            autoFocus
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      )}

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

/** 덱 한 개 섹션 — 스타일가이드(/design-1859)에서도 같은 컴포넌트를 씁니다. */
export function ArchiveDeckSection({
  deck,
  limit = PAGE_SIZE,
  onLoadMore,
}: {
  deck: ArchiveDeck
  limit?: number
  onLoadMore?: () => void
}) {
  const hasMore = deck.categories.some((category) => category.cards.length > limit)

  return (
    <section className="rounded-2xl bg-muted/50 p-4 sm:p-5">
      <h2 className="mb-4 font-serif text-3xl italic text-foreground sm:text-4xl">{deck.label}</h2>

      {/* 대분류 컬럼 — 좌우 스크롤, 컬럼 폭 200px 고정 (시안 기준) */}
      <div className="flex gap-3 overflow-x-auto pb-2">
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
                <span className="w-4 shrink-0 font-mono text-xs text-primary">{card.number}</span>
                <span className="truncate text-[13px] text-foreground">{card.title}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-3 w-full rounded-lg border border-border bg-card py-2.5 text-center text-xs text-foreground transition-colors hover:bg-secondary/60"
        >
          더 불러오기
        </button>
      )}
    </section>
  )
}
