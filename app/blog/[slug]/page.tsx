// app/blog/[slug]/page.tsx
// 게시글 상세 페이지 (동적 라우트 "/blog/[slug]")
import type { Metadata } from "next"
import { getAISummary } from "@/lib/ai-summary"
import { AISummaryBox } from "@/components/ai-summary-box"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Footer } from "@/components/footer"
import { getPostBySlug, getPostContent, getAllSlugs } from "@/lib/notion"
import { MarkdownContent } from "@/components/markdown-content"
import { AdFit } from "@/components/adfit"
import { formatDate } from "@/lib/format-date"
import { PageHeader } from "@/components/page-header"

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
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
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

  return (
    <div className="tarot-detail-light flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-8">
        {/* 상단 바: 뒤로가기 + 공유·검색·더보기 (Site design.pdf 본문 헤더) */}
        <PageHeader backHref={backHref} showShare showSearch showMore className="mb-8" />

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {post.category && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
                  {post.category}
                </span>
              )}
              {post.publishedDate && <time dateTime={post.publishedDate}>{formatDate(post.publishedDate)}</time>}
            </div>

            <h1 className="mt-4 text-balance font-serif text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>

            {post.summary && (
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{post.summary}</p>
            )}
          </header>

          {post.coverImage && (
            <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={post.coverImage || "/placeholder.svg"}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <AISummaryBox summary={summary} />

          {content ? (
            <MarkdownContent content={content} />
          ) : (
            <p className="text-muted-foreground">본문 콘텐츠를 불러올 수 없습니다.</p>
          )}

          <div className="mt-12 flex justify-center border-t border-border pt-8">
            <AdFit adUnit="DAN-6lnjpC7fNfdnSMWd" width={300} height={250} />
          </div>
        </article>
      </main>

      {/* 본문 페이지는 시안(Site design.pdf) 기준 미니멀 푸터 */}
      <Footer variant="minimal" />
    </div>
  )
}