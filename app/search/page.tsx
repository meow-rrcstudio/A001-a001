// app/search/page.tsx
// 전용 검색 페이지 — 메뉴(목록)의 검색창에서 들어옵니다.
// 노션의 발행 글 전체를 대상으로 제목·요약·슬러그·카테고리를 검색합니다.
import type { Metadata } from "next"
import { getPublishedPosts } from "@/lib/notion"
import { SearchScreen } from "@/components/search-screen"

export const metadata: Metadata = {
  title: "검색",
  robots: { index: false }, // 검색 화면 자체는 검색엔진에 노출할 필요가 없습니다
}

// 새 글이 1분 안에 검색 대상에 반영되도록 캐시를 짧게 유지
export const revalidate = 60

export default async function SearchPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="flex min-h-screen flex-col">
      <SearchScreen
        posts={posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          category: post.category,
          publishedDate: post.publishedDate,
        }))}
      />
    </div>
  )
}
