import Link from "next/link"
import { allTarotCards } from "@/lib/tarot-cards"
import { TarotCardImage } from "@/components/tarot-card-image"
import { getAllSlugs } from "@/lib/notion"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"
import { Footer } from "@/components/footer"
import { AdBand } from "@/components/ad-band"
// gemini 수정: Button 스타일 재사용을 위한 import
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const revalidate = 3600

export default async function TarotListPage() {
  const publishedSlugs = await getAllSlugs()
  const publishedSet = new Set(publishedSlugs.map((s) => s.slug))

  return (
    <div className="flex min-h-screen flex-col">
      <PageBackground variant="aurora" />
      {/* 하단 여백은 광고 띠배너 래퍼(py-10)가 담당 — 40px 간격 유지 */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pt-10 sm:px-8">
        <PageHeader backHref="/tarot/reading" showShare className="mb-8" />

        <div className="mb-8">
          <h1 className="font-serif text-5xl italic tracking-tight text-foreground">Tarot</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            카드 한 장 한 장의 의미를 깊게 들여다보는 아카이브입니다.
          </p>

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
                // 비율은 저장된 카드 이미지(300x527)와 동일하게 — 다르면 잘리며 확대되어 보임.
                // 라인은 안쪽 border 가 아니라 바깥쪽 outline 으로 — 그림을 먹지 않음.
                // 카드 그림의 검정 외곽선에 맞춰 1px 블랙 · 라운드 6px · 그림자 0 2px 6px
                className="group relative aspect-[300/527] overflow-hidden rounded-lg outline outline-1 outline-black bg-muted shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-1"
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

      {/* 광고(카카오 애드핏) — 푸터 위, 본문(카드 그리드)과 같은 좌우 여백(px-6). 위아래 40px */}
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8">
        <AdBand adUnit="DAN-Cbt3AipfM4hs85GG" width={320} height={100} />
      </div>

      {/* gemini 수정: 기존 Floating 버튼 삭제 후 하단 고정 버튼 구현
          (이 버튼 컴포넌트는 asChild를 지원하지 않아, 같은 스타일을 Link에 직접 입힘) */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 px-6">
        <Link
          href="/tarot/reading"
          className={cn(
            buttonVariants({ variant: "connect", size: "lg" }),
            "h-14 rounded-full px-8 font-serif text-xl italic shadow-lg"
          )}
        >
          go to a tarot reading
        </Link>
      </div>

      <Footer variant="light" />
    </div>
  )
}