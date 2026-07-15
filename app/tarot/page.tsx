import Link from "next/link"
import { allTarotCards } from "@/lib/tarot-cards"
import { TarotCardImage } from "@/components/tarot-card-image"
import { FloatingReadingButton } from "@/components/floating-reading-button"
import { getAllSlugs } from "@/lib/notion"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"

export const revalidate = 3600

export default async function TarotListPage() {
  const publishedSlugs = await getAllSlugs()
  const publishedSet = new Set(publishedSlugs.map((s) => s.slug))

  return (
    <div className="flex min-h-screen flex-col">
      <PageBackground variant="aurora" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 pb-28 sm:px-8">
        <PageHeader backHref="/tarot/reading" className="mb-8" />
        
        <div className="mb-8">
          <h1 className="font-serif text-5xl tracking-tight text-foreground">Tarot ☀︎</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            카드 한 장 한 장의 의미를 깊게 들여다보는 아카이브입니다.
          </p>
          
          {/* Astrology 링크 추가 */}
          <div className="mt-6 flex gap-4">
            <Link
              href="/tarot/astrology"
              className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              → Astrology
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
          {allTarotCards.map((card) => {
            const isPublished = publishedSet.has(card.slug)
            return (
              <Link
                key={card.slug}
                href={`/blog/${card.slug}`}
                className="group relative aspect-[1144/1919] overflow-hidden rounded-lg bg-muted transition-transform hover:-translate-y-1"
              >
                <TarotCardImage
                  src={card.imageUrl}
                  alt={`${card.nameKo} (${card.nameEn})`}
                  className={isPublished ? undefined : "opacity-40"}
                />
              </Link>
            )
          })}
        </div>
      </main>

      <FloatingReadingButton />
    </div>
  )
}