// app/tarot/astrology/page.tsx
// 카드 아카이브 목록 — 노션 글이 자동으로 매칭되어 나타납니다.
//
// 새 카드를 추가하는 법: 노션에 글을 올릴 때 Slug만 규칙에 맞추면 끝.
//   Slug 규칙: 덱이름-대분류-숫자 (예: universal-swords-5, lenormand-heart-1)
// 덱·대분류 섹션과 필터 칩은 등록된 글에서 자동으로 생성됩니다.
// (파싱 규칙은 lib/card-archive.ts, 화면은 components/card-archive-board.tsx)
import { Footer } from "@/components/footer"
import { CardArchiveBoard } from "@/components/card-archive-board"
import { getPublishedPosts } from "@/lib/notion"
import { buildCardArchive } from "@/lib/card-archive"

// 노션에 올린 글이 최대 1분 안에 반영되도록 캐시를 짧게 유지
export const revalidate = 60

export default async function AstrologyPage() {
  const posts = await getPublishedPosts()
  const decks = buildCardArchive(posts)

  return (
    // archive-light: 이 페이지에서만 시안(blogpostlist) 실측 색상으로 덮어씀 (globals.css 하단)
    <div className="archive-light flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 sm:px-8 sm:pt-10">
        <CardArchiveBoard decks={decks} />
      </main>

      {/* 시안 기준 밝은 푸터 (✳ 모노 URL + 카피라이트) */}
      <Footer variant="light" />
    </div>
  )
}
