// app/archive/page.tsx
// Archive — 카드 해설·리뷰 등 "읽을거리"를 모은 곳입니다. (구 /tarot/astrology)
//
// 시안의 2축 구조에서 Archive 는 "읽을거리" 축을 담당합니다.
//   · 타로보기(/tarot/ask) = 체험 — 카드를 뽑고 해석받는 곳
//   · Archive(여기)           = 읽을거리 — 카드 한 장씩의 의미와 기록
//
// 새 글을 추가하는 법: 노션에 글을 올릴 때 Slug만 규칙에 맞추면 끝.
//   Slug 규칙: 덱이름-대분류-숫자 (예: universal-swords-5, lenormand-heart-1)
// 덱·대분류 섹션과 필터 칩은 등록된 글에서 자동으로 생성됩니다.
// (파싱 규칙은 lib/card-archive.ts, 화면은 components/card-archive-board.tsx)
import type { Metadata } from "next"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import { Footer } from "@/components/footer"
import { AdBand } from "@/components/ad-band"
import { CardArchiveBoard } from "@/components/card-archive-board"
import { HEADER_SPACE } from "@/lib/layout"
import { getPublishedPosts } from "@/lib/notion"
import { buildCardArchive } from "@/lib/card-archive"

export const metadata: Metadata = {
  title: "Archive",
  description: "타로 카드 한 장 한 장의 의미와 기록을 모은 아카이브입니다.",
}

// 노션에 올린 글이 최대 1분 안에 반영되도록 캐시를 짧게 유지
export const revalidate = 60

export default async function ArchivePage() {
  const posts = await getPublishedPosts()
  const decks = buildCardArchive(posts)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto w-full max-w-site flex-1 px-5 sm:px-8 ${HEADER_SPACE}`}>
        <CardArchiveBoard decks={decks} />

        {/* 78장 카드 그림으로 훑어보고 싶은 사람을 위한 진입점 —
            목록(글) 대신 카드 이미지 그리드로 보여줍니다. */}
        <Link
          href="/tarot"
          className="mb-8 flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          78장 카드 그림으로 보기
        </Link>
      </main>

      {/* 광고(카카오 애드핏) — 푸터 위 띠배너. 좌우 16px, 위아래 40px */}
      <div className="mx-auto w-full max-w-site px-4 py-10">
        <AdBand adUnit="DAN-Cbt3AipfM4hs85GG" width={320} height={100} />
      </div>

      <Footer variant="lime" />
    </div>
  )
}
