// components/search-screen.tsx
// 전용 검색 화면 — 네이버 블로그 검색 UX를 참고한 구성입니다.
//   · 검색 전: 최근 검색어 칩 (기기에 저장, 개별 삭제 · 전체삭제)
//   · 검색 후: 결과 개수 + 글 목록 (제목·요약 속 검색어를 테라코타로 하이라이트)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 최근 검색어 개수 : RECENT_MAX = 10
// │ · 하이라이트 색    : text-primary (테라코타)
// │ · 입력창 글자 크기 : text-base(16px) 고정 — 아이폰 자동 확대 방지.
// │                      15px 이하로 줄이면 아이폰에서 화면이 확대되니 주의!
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, X } from "lucide-react"
import { formatDate } from "@/lib/format-date"

export interface SearchPost {
  slug: string
  title: string
  summary: string
  category: string | null
  publishedDate: string | null
}

const RECENT_KEY = "soulseoul-recent-searches"
const RECENT_MAX = 10

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : []
  } catch {
    return []
  }
}

function saveRecent(terms: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(terms))
  } catch {
    // 시크릿 모드 등 저장 불가 환경 — 무시
  }
}

/** 텍스트 속 검색어를 테라코타색으로 강조해서 돌려줍니다. */
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>
  const lower = text.toLowerCase()
  const needle = term.toLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  let index = lower.indexOf(needle)
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index))
    parts.push(
      <mark key={index} className="bg-transparent font-medium text-primary">
        {text.slice(index, index + term.length)}
      </mark>
    )
    cursor = index + term.length
    index = lower.indexOf(needle, cursor)
  }
  parts.push(text.slice(cursor))
  return <>{parts}</>
}

export function SearchScreen({ posts }: { posts: SearchPost[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("") //      입력창에 적고 있는 글자
  const [submitted, setSubmitted] = useState("") // 실제로 검색된 단어 ("")이면 검색 전
  const [recent, setRecent] = useState<string[]>([])

  // 첫 진입: 최근 검색어 불러오기 + 메뉴에서 ?q=로 넘어온 검색어 실행
  useEffect(() => {
    setRecent(loadRecent())
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) {
      setQuery(q)
      setSubmitted(q.trim().toLowerCase())
    } else {
      inputRef.current?.focus()
    }
  }, [])

  function runSearch(term: string) {
    const trimmed = term.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setSubmitted(trimmed.toLowerCase())
    // 최근 검색어 맨 앞에 추가 (중복 제거, 최대 RECENT_MAX개)
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, RECENT_MAX)
      saveRecent(next)
      return next
    })
    inputRef.current?.blur()
  }

  function clearInput() {
    setQuery("")
    setSubmitted("")
    inputRef.current?.focus()
  }

  function removeRecent(term: string) {
    setRecent((prev) => {
      const next = prev.filter((t) => t !== term)
      saveRecent(next)
      return next
    })
  }

  const results = submitted
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(submitted) ||
          post.summary.toLowerCase().includes(submitted) ||
          post.slug.toLowerCase().includes(submitted) ||
          (post.category ?? "").toLowerCase().includes(submitted)
      )
    : []

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 sm:px-8 sm:pt-10">
      {/* 상단 바: 뒤로가기 + 검색창 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          runSearch(query)
        }}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-7 w-7" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이 블로그 검색"
            // text-base(16px): 아이폰에서 입력창 탭 시 화면이 자동 확대되지 않게 하는 최소 크기
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              type="button"
              onClick={clearInput}
              aria-label="지우기"
              className="shrink-0 rounded-full bg-muted p-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* ── 검색 전: 최근 검색어 ── */}
      {!submitted && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">최근 검색어</h2>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRecent([])
                  saveRecent([])
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                전체삭제
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground/70">최근 검색어가 없어요.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {recent.map((term) => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-4 pr-2.5 text-sm text-foreground"
                >
                  <button type="button" onClick={() => runSearch(term)}>
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(term)}
                    aria-label={`${term} 삭제`}
                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 검색 후: 결과 목록 ── */}
      {submitted && (
        <section className="mt-6 pb-12">
          <p className="text-sm text-muted-foreground">{results.length}개</p>

          {results.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              &ldquo;{query}&rdquo; 검색 결과가 없어요.
            </p>
          )}

          <div className="divide-y divide-border">
            {results.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-5">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  <Highlight text={post.title} term={query} />
                </h3>
                {post.summary && (
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    <Highlight text={post.summary} term={query} />
                  </p>
                )}
                {post.publishedDate && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {formatDate(post.publishedDate)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
