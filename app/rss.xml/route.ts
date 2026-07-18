// app/rss.xml/route.ts
// RSS 피드를 동적으로 생성하는 라우트 핸들러입니다. ("/rss.xml" 로 접근)
// 네이버 서치어드바이저 등에 제출하면 새 글이 더 빨리 검색에 반영됩니다.
import { getPublishedPosts } from "@/lib/notion"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz"

// 60초마다 재검증 — 노션에 올린 새 글이 1분 안에 피드에 반영됩니다
export const revalidate = 60

// XML에 넣으면 안 되는 특수문자(<, & 등)를 안전하게 바꿉니다
function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const posts = await getPublishedPosts()

  const items = posts
    .filter((post) => post.slug)
    .slice(0, 50) // 최신 50개만 (피드는 최신 글 위주면 충분합니다)
    .map((post) => {
      const link = `${BASE_URL}/blog/${post.slug}`
      const pubDate = post.publishedDate ? new Date(post.publishedDate).toUTCString() : ""
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""}
      <description>${escapeXml(post.summary || post.title)}</description>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Soul Seoul</title>
    <link>${BASE_URL}</link>
    <description>타로를 중심으로 명상, 요가, 신화, 점성술을 기록하고 연결하는 개인 아카이브</description>
    <language>ko</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  })
}
