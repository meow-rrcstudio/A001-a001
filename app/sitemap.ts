import { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/notion'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz").replace(/\/+$/, "")

export const revalidate = 60

// 날짜 문자열을 Date 로 바꿉니다. 값이 없거나 이상하면 null 을 돌려줍니다
// (Invalid Date 가 그대로 넘어가면 sitemap 의 lastmod 가 깨집니다)
function toDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs()
  const now = new Date()

  const staticPaths = ["/", "/tarot", "/archive", "/about", "/privacy"]

  const entries: { url: string; lastModified: Date }[] = [
    ...staticPaths.map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
    })),
    ...slugs
      .map((s) => ({ slug: (s.slug ?? "").trim(), publishedDate: s.publishedDate }))
      .filter((s) => s.slug.length > 0)
      .map((s) => ({
        url: `${BASE_URL}/blog/${encodeURIComponent(s.slug)}`,
        lastModified: toDate(s.publishedDate) ?? now,
      })),
  ]

  // 중복 URL 제거 (가장 최신 날짜 유지)
  const byUrl = new Map<string, Date>()
  for (const entry of entries) {
    const existing = byUrl.get(entry.url)
    if (!existing || entry.lastModified > existing) {
      byUrl.set(entry.url, entry.lastModified)
    }
  }

  return Array.from(byUrl, ([url, lastModified]) => ({
    url,
    lastModified,
  }))
}
