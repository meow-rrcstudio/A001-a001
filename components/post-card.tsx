// components/post-card.tsx
// 게시글 목록에서 각 게시글을 표시하는 카드 컴포넌트입니다.
import Link from "next/link"
import Image from "next/image"
import type { Post } from "@/lib/notion"
import { formatDate } from "@/lib/format-date"

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* 썸네일 (Files 속성) - 있을 때만 렌더링 */}
        {post.coverImage && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted sm:w-48 sm:shrink-0">
            <Image
              src={post.coverImage || "/placeholder.svg"}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="block h-full w-full object-cover opacity-100 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          {/* 카테고리 + 발행일 메타 정보 */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {post.category && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
                {post.category}
              </span>
            )}
            {post.publishedDate && <time dateTime={post.publishedDate}>{formatDate(post.publishedDate)}</time>}
          </div>

          {/* 제목 (Name) */}
          <h2 className="text-pretty font-serif text-xl font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </h2>

          {/* 요약 (Summary) */}
          {post.summary && <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">{post.summary}</p>}
        </div>
      </Link>
    </article>
  )
}