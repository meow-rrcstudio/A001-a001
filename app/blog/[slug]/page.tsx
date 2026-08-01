// app/blog/[slug]/page.tsx
// 게시글 상세 페이지 (동적 라우트 "/blog/[slug]")
import type { Metadata } from "next"
import { getAISummary } from "@/lib/ai-summary"
import { AISummaryBox } from "@/components/ai-summary-box"
import { notFound } from "next/navigation"
import { getPostBySlug, getPostContent, getAllSlugs, getAdjacentPosts } from "@/lib/notion"
import { MarkdownContent } from "@/components/markdown-content"
import { AdBand } from "@/components/ad-band"
import { CardDetailView, type AdjacentCard } from "@/components/card-detail-view"
import { allTarotCards } from "@/lib/tarot-cards"
import { BASE_URL, breadcrumbJsonLd, canonicalPath, jsonLdScriptProps } from "@/lib/seo"

export const revalidate = 60

// 슬러그 → 정적 카드 이미지(위키미디어). 노션 Files가 비어 있을 때 폴백으로 씁니다.
const cardImageBySlug = new Map(allTarotCards.map((c) => [c.slug, c.imageUrl]))
function resolveCardImage(slug: string, notionCover: string | null): string | null {
  return notionCover || cardImageBySlug.get(slug) || null
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.filter((s) => s.slug).map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: "게시글을 찾을 수 없습니다" }
  }

  return {
    title: post.title,
    description: post.summary,
    // 같은 글이 /blog/x 와 /blog/x?from=archive 두 주소로 열립니다.
    // 진짜 주소는 꼬리표 없는 쪽 하나뿐이라고 알려 순위가 나뉘지 않게 합니다.
    alternates: { canonical: canonicalPath(`/blog/${slug}`) },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: canonicalPath(`/blog/${slug}`),
      type: "article",
      publishedTime: post.publishedDate ?? undefined,
      // 커버 이미지가 없는 글은 사이트 공통 미리보기 이미지를 사용
      images: [{ url: post.coverImage || "/og-image.png?v=2" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [post.coverImage || "/og-image.png?v=2"],
    },
  }
}

// 대략적인 읽기 시간(분) — 한글 기준 분당 약 500자
function estimateReadMinutes(content: string): number {
  return Math.max(1, Math.round(content.replace(/\s/g, "").length / 500))
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug } = await params
  const { from } = await searchParams
  const backHref = from === "astrology" ? "/archive" : "/tarot"

  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const content = await getPostContent(post.id)
  const summary = content
    ? await getAISummary(content, post.title, post.id)
    : ({ status: "unavailable" } as const)

  // 앞뒤 카드 (같은 그룹 내 이전/다음) — 시안의 Related Stories 용
  const { prev, next } = await getAdjacentPosts(slug)
  const toAdjacent = (p: typeof prev): AdjacentCard | null =>
    p
      ? {
        slug: p.slug,
        title: p.title,
        coverImage: resolveCardImage(p.slug, p.coverImage),
        arcana: p.arcana,
        suit: p.suit,
      }
      : null

  // 구조화 데이터(JSON-LD) — 구글이 글의 제목·날짜·이미지를 정확히 이해하도록 돕는 표식.
  const pageUrl = canonicalPath(`/blog/${slug}`)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || undefined,
    datePublished: post.publishedDate || undefined,
    // 수정일이 따로 없으면 발행일을 씁니다. 구글은 두 날짜가 다 있을 때
    // "언제 쓰고 언제 손봤는지"를 검색결과에 반영합니다.
    dateModified: post.publishedDate || undefined,
    image: resolveCardImage(slug, post.coverImage) || `${BASE_URL}/og-image.png`,
    inLanguage: "ko-KR",
    articleSection: post.category || post.arcana || undefined,
    author: { "@type": "Person", name: "Shānti", url: canonicalPath("/about") },
    publisher: { "@type": "Organization", "@id": `${BASE_URL}/#organization`, name: "SoulSeoul", url: BASE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  }

  // 이동 경로 — 검색결과 주소 자리에 "SoulSeoul › Archive › 글제목"으로 보입니다
  const breadcrumb = breadcrumbJsonLd([
    { name: "SoulSeoul", path: "/" },
    { name: "Archive", path: "/archive" },
    { name: post.title, path: `/blog/${slug}` },
  ])

  return (
    <div>
      <script {...jsonLdScriptProps(jsonLd)} />
      <script {...jsonLdScriptProps(breadcrumb)} />
      <CardDetailView
        title={post.title}
        publishedDate={post.publishedDate}
        arcana={post.arcana}
        suit={post.suit}
        element={post.element}
        readMinutes={content ? estimateReadMinutes(content) : 1}
        coverImage={resolveCardImage(slug, post.coverImage)}
        backHref={backHref}
        fromParam={from ?? null}
        prev={toAdjacent(prev)}
        next={toAdjacent(next)}
        summaryNode={<AISummaryBox summary={summary} />}
        contentNode={
          content ? (
            <MarkdownContent content={content} />
          ) : (
            <p className="text-muted-foreground">본문 콘텐츠를 불러올 수 없습니다.</p>
          )
        }
        adNode={<AdBand adUnit="DAN-Cbt3AipfM4hs85GG" width={320} height={100} />}
      />
    </div>
  )
}
