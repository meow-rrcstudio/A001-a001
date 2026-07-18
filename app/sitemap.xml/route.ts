// app/sitemap.xml/route.ts
// sitemap.xml 을 동적으로 생성하는 라우트 핸들러입니다. ("/sitemap.xml" 로 접근)
// Notion 의 게시글 Slug 를 기반으로 URL 목록을 만듭니다.
import { getAllSlugs } from "@/lib/notion"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// 60초마다 재검증
export const revalidate = 60

export async function GET() {
  const slugs = await getAllSlugs()

  // 정적 페이지(홈·목록·소개 등) + 동적 게시글 페이지 URL 목록 구성
  const staticPaths = ["/", "/tarot", "/tarot/reading", "/tarot/astrology", "/about", "/privacy"]
  const urls = [
    ...staticPaths.map((path) => ({ loc: `${BASE_URL}${path}`, lastmod: new Date().toISOString() })),
    ...slugs
      .filter((s) => s.slug)
      .map((s) => ({
        loc: `${BASE_URL}/blog/${s.slug}`,
        lastmod: s.publishedDate ? new Date(s.publishedDate).toISOString() : new Date().toISOString(),
      })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
