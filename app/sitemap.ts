import { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/notion'
import { BASE_URL } from '@/lib/seo'

export const revalidate = 60

// 날짜 문자열을 Date 로 바꿉니다. 값이 없거나 이상하면 null 을 돌려줍니다
// (Invalid Date 가 그대로 넘어가면 sitemap 의 lastmod 가 깨집니다)
function toDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// 고정 페이지와 그 무게.
//
// priority 는 "우리 사이트 안에서의 상대적 무게"입니다. 구글이 순위를
// 매기는 점수가 아니라, 한정된 크롤 예산을 어디에 먼저 쓸지 보는 힌트입니다.
// 그래서 전부 1.0 으로 두면 아무 말도 하지 않은 것과 같습니다.
//
// changeFrequency 도 같은 성격의 힌트입니다 — 약관처럼 몇 달에 한 번
// 바뀌는 문서를 매일 훑게 두면 새 글 발견이 그만큼 늦어집니다.
const STATIC_PAGES: {
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/tarot', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tarot/ask', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/archive', priority: 0.9, changeFrequency: 'daily' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/refund', priority: 0.2, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    ...STATIC_PAGES.map((page) => ({
      url: `${BASE_URL}${page.path === '/' ? '' : page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...slugs
      .map((s) => ({ slug: (s.slug ?? '').trim(), publishedDate: s.publishedDate }))
      .filter((s) => s.slug.length > 0)
      .map((s) => ({
        url: `${BASE_URL}/blog/${encodeURIComponent(s.slug)}`,
        lastModified: toDate(s.publishedDate) ?? now,
        changeFrequency: 'monthly' as const,
        // 글이 이 사이트의 본체입니다 — 목록 페이지 바로 다음 무게를 줍니다
        priority: 0.8,
      })),
  ]

  // 중복 URL 제거 (가장 최신 날짜를 남깁니다)
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of entries) {
    const existing = byUrl.get(entry.url)
    if (!existing || (entry.lastModified as Date) > (existing.lastModified as Date)) {
      byUrl.set(entry.url, entry)
    }
  }

  return Array.from(byUrl.values())
}
