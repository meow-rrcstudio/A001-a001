// app/tarot/astrology/page.tsx
// 카드 아카이브 목록 페이지 (blog-post-list mobile compact 시안 기반).
// 목록 그리드의 생김새는 components/post-list-board.tsx 에서 수정합니다.
import { Asterisk } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { PostListBoard } from "@/components/post-list-board"
import { getAllSlugs } from "@/lib/notion"
import { astrologyDecks, astrologyFilters } from "@/lib/astrology-data"

export const revalidate = 3600

export default async function AstrologyPage() {
  const allSlugs = await getAllSlugs()
  const publishedSet = new Set(allSlugs.map((s) => s.slug))

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 sm:px-8 sm:pt-10">
        {/* 상단 바: 뒤로가기 + 공유 */}
        <PageHeader backHref="/tarot" showShare showSearch className="mb-8" />

        {/* 페이지 제목 — 세리프 이탤릭 + 테라코타 애스터리스크(✳) */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-5xl italic leading-tight text-foreground sm:text-6xl">
              Astrologyㅡ
            </h1>
            <Asterisk
              className="h-12 w-12 shrink-0 text-primary sm:h-14 sm:w-14"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            명상, 요가, 신화, 점성술, 그리고 타로를 통해 기록하고 연결하는 개인적인
            아카이브입니다. 당신의 영적 여정에 영감을 더하는 이야기들을 만나보세요.
          </p>
        </div>

        {/* 필터 칩 — 선택된 것은 테라코타 채움, 나머지는 크림 배경 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {astrologyFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                filter.id === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary hover:bg-secondary/70"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 덱별 그리드 박스 */}
        <div className="space-y-6 pb-8">
          {astrologyDecks.map((deck) => (
            <PostListBoard
              key={deck.id}
              title={deck.name}
              badgeLabel={deck.cardType}
              badgeCount={deck.count}
              badgeClassName={deck.headerBg}
              altBadgeClassName={deck.altHeaderBg}
              items={deck.cards.map((card) => ({
                id: card.id,
                name: card.name,
                meaning: card.meaning,
                href: `/blog/${card.slug}?from=astrology`,
                active: publishedSet.has(card.slug),
              }))}
            />
          ))}
        </div>
      </main>

      {/* 목록 페이지는 시안(Site design.pdf) 기준 다크 브라운 푸터 */}
      <Footer variant="dark" />
    </div>
  )
}
