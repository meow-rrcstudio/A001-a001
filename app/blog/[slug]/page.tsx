// app/blog/[slug]/page.tsx
// 게시글 상세 페이지 (동적 라우트 "/blog/[slug]")
import type { Metadata } from "next"
import { getAISummary } from "@/lib/ai-summary"
import { AISummaryBox } from "@/components/ai-summary-box"
import { notFound } from "next/navigation"
import { getPostBySlug, getPostContent, getAllSlugs, getAdjacentPosts } from "@/lib/notion"
import { MarkdownContent } from "@/components/markdown-content"
import { AdFit } from "@/components/adfit"
import { CardDetailView, type AdjacentCard } from "@/components/card-detail-view"

export const revalidate = 60

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
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedDate ?? undefined,
      // 커버 이미지가 없는 글은 사이트 공통 미리보기 이미지를 사용
      images: [{ url: post.coverImage || "/og-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [post.coverImage || "/og-image.png"],
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
  const backHref = from === "astrology" ? "/tarot/astrology" : "/tarot"

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
      ? { slug: p.slug, title: p.title, coverImage: p.coverImage, arcana: p.arcana, suit: p.suit }
      : null

  // 구조화 데이터(JSON-LD) — 구글이 글의 제목·날짜·이미지를 정확히 이해하도록 돕는 표식.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || undefined,
    datePublished: post.publishedDate || undefined,
    image: post.coverImage || `${baseUrl}/og-image.png`,
    author: { "@type": "Person", name: "Shānti", url: `${baseUrl}/about` },
    publisher: { "@type": "Organization", name: "Soul Seoul", url: baseUrl },
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
  }

  return (
    <div className="tarot-detail-light">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardDetailView
        title={post.title}
        publishedDate={post.publishedDate}
        arcana={post.arcana}
        suit={post.suit}
        element={post.element}
        readMinutes={content ? estimateReadMinutes(content) : 1}
        coverImage={post.coverImage}
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
        adNode={<AdFit adUnit="DAN-6lnjpC7fNfdnSMWd" width={300} height={250} />}
      />
    </div>
  )
}
