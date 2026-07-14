// app/tarot/astrology/page.tsx
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { getAllSlugs } from '@/lib/notion'
import { astrologyDecks, astrologyFilters } from '@/lib/astrology-data'

export const revalidate = 3600

export default async function AstrologyPage() {
  const allSlugs = await getAllSlugs()
  const publishedSet = new Set(allSlugs.map((s) => s.slug))

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-10 pb-28 sm:px-8">
        {/* 헤더 */}
        <PageHeader backHref="/tarot" className="mb-8" />

        {/* 페이지 제목 */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-5xl italic leading-tight text-foreground sm:text-6xl">
              Astrologyㅡ
            </h1>
            <div className="h-12 w-12 flex-shrink-0 text-accent">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <g fill="currentColor">
                  <polygon points="50,10 61,40 90,40 68,60 79,90 50,70 21,90 32,60 10,40 39,40" />
                </g>
              </svg>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            명상, 요가, 신화, 점성술, 그리고 타로를 통해 기록하고 연결하는 개인적인
            아카이브입니다. 당신의 영적 여정에 영감을 더하는 이야기들을 만나보세요.
          </p>
        </div>

        {/* 필터 바 */}
        <div className="mb-8 space-y-4 border-t border-border py-4">
          <div className="flex flex-wrap gap-2">
            {astrologyFilters.map((filter) => (
              <button
                key={filter.id}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  filter.id === 'all'
                    ? 'bg-accent text-background'
                    : 'bg-muted text-accent'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 보드 뷰 */}
        <div className="space-y-8">
          {astrologyDecks.map((deck) => (
            <div key={deck.id} className="space-y-4">
              <h2 className="font-serif text-4xl italic text-foreground">{deck.name}</h2>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* 첫 번째 컬럼 */}
                <div className="space-y-4 rounded-lg bg-muted p-4">
                  <div className={`inline-block rounded px-3 py-1 text-xs font-medium text-foreground ${deck.headerBg}`}>
                    <span>{deck.cardType}</span>
                    <span className="ml-2 font-mono text-xs opacity-60">{deck.count}</span>
                  </div>

                  <div className="space-y-2">
                    {deck.cards.slice(0, Math.ceil(deck.cards.length / 2)).map((card) => {
                      const isPublished = publishedSet.has(card.slug)
                      return (
                        <Link
                          key={card.slug}
                          href={isPublished ? `/blog/${card.slug}?from=astrology` : '#'}
                          className={`flex gap-2 rounded-lg border border-border bg-background p-2 transition-opacity ${
                            isPublished ? 'cursor-pointer hover:bg-muted' : 'cursor-default opacity-40'
                          }`}
                        >
                          <span className="w-4 flex-shrink-0 font-mono text-xs text-accent opacity-80">
                            {card.id}
                          </span>
                          <span className="flex-1 text-xs text-foreground">{card.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* 두 번째 컬럼 */}
                <div className="space-y-4 rounded-lg bg-muted p-4">
                  <div className={`inline-block rounded px-3 py-1 text-xs font-medium text-foreground ${deck.altHeaderBg}`}>
                    <span>{deck.cardType}</span>
                    <span className="ml-2 font-mono text-xs opacity-60">{deck.count}</span>
                  </div>

                  <div className="space-y-2">
                    {deck.cards.slice(Math.ceil(deck.cards.length / 2)).map((card) => {
                      const isPublished = publishedSet.has(card.slug)
                      return (
                        <Link
                          key={card.slug}
                          href={isPublished ? `/blog/${card.slug}` : '#'}
                          className={`flex gap-2 rounded-lg border border-border bg-background p-2 transition-opacity ${
                            isPublished ? 'cursor-pointer hover:bg-muted' : 'cursor-default opacity-40'
                          }`}
                        >
                          <span className="w-4 flex-shrink-0 font-mono text-xs text-accent opacity-80">
                            {card.id}
                          </span>
                          <span className="flex-1 text-xs text-foreground">{card.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button className="w-full rounded-lg border border-border bg-background py-2 text-center text-xs text-foreground transition-colors hover:bg-muted">
                더 불러오기
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}