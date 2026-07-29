// app/sitemap.xml/route.ts
// sitemap.xml 을 동적으로 생성하는 라우트 핸들러입니다. ("/sitemap.xml" 로 접근)
// Notion 의 게시글 Slug 를 기반으로 URL 목록을 만듭니다.
//
// 출력 규칙 (sitemaps.org 0.9 표준):
//  1. 파일 맨 앞은 반드시 <?xml ... ?> 선언으로 시작합니다. (앞에 공백·BOM·다른 태그 금지)
//  2. <urlset> 안에는 <url> 요소만 들어갑니다. (script/style 등 다른 태그 금지)
//  3. 같은 <loc> 이 두 번 나오면 안 됩니다. (중복 URL 제거)
//  4. URL 안의 &, <, > 같은 문자는 XML 엔티티로 escape 합니다.
import { getAllSlugs } from "@/lib/notion"

// 환경 변수가 없어도 실제 서비스 주소로 만들어지도록 기본값을 실주소로 둡니다
// 끝에 슬래시가 붙어 있으면 "https://.../ /tarot" 처럼 깨지므로 잘라냅니다
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz").replace(/\/+$/, "")

// 60초마다 재검증
export const revalidate = 60

// XML 에 넣으면 안 되는 특수문자를 안전하게 바꿉니다
function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// 날짜를 W3C Datetime(ISO 8601) 로 만듭니다. 값이 이상하면 null 을 돌려줍니다
function toIsoDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function GET() {
  const slugs = await getAllSlugs()
  const now = new Date().toISOString()

  // 정적 페이지(홈·목록·about 등) + 동적 게시글 페이지 URL 목록 구성
  const staticPaths = ["/", "/tarot", "/archive", "/about", "/privacy"]

  const entries: { loc: string; lastmod: string }[] = [
    ...staticPaths.map((path) => ({ loc: `${BASE_URL}${path}`, lastmod: now })),
    ...slugs
      // 슬러그 앞뒤 공백을 정리하고, 빈 값은 버립니다
      .map((s) => ({ slug: (s.slug ?? "").trim(), publishedDate: s.publishedDate }))
      .filter((s) => s.slug.length > 0)
      .map((s) => ({
        loc: `${BASE_URL}/blog/${encodeURIComponent(s.slug)}`,
        lastmod: toIsoDate(s.publishedDate) ?? now,
      })),
  ]

  // 중복 URL 제거 — 같은 loc 이 여러 번 있으면 가장 최근 lastmod 만 남깁니다
  const byLoc = new Map<string, string>()
  for (const entry of entries) {
    const existing = byLoc.get(entry.loc)
    if (!existing || entry.lastmod > existing) byLoc.set(entry.loc, entry.lastmod)
  }

  const body = Array.from(byLoc, ([loc, lastmod]) =>
    ["  <url>", `    <loc>${escapeXml(loc)}</loc>`, `    <lastmod>${lastmod}</lastmod>`, "  </url>"].join("\n"),
  ).join("\n")

  // 선언이 무조건 첫 바이트에 오도록 배열로 조립합니다 (템플릿 리터럴 들여쓰기 사고 방지)
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
