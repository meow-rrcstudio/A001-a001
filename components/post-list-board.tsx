// components/post-list-board.tsx
// 카드/글 목록을 2단 그리드로 보여주는 "그리드 박스" 공용 컴포넌트입니다.
// (blog-post-list mobile compact 시안 기반)
// /tarot/astrology 페이지와 스타일가이드(/design-1859)가 함께 씁니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 패널 바탕      : bg-muted/50 → /50은 50% 투명도. /70이면 더 진해짐
// │ · 패널 모서리    : rounded-2xl / 안쪽 여백: p-4 (16px)
// │ · 섹션 제목      : font-serif italic text-3xl (모바일) sm:text-4xl (PC)
// │ · 목록 단 수     : grid-cols-2 → 모바일에서도 2단 (시안 기준)
// │ · 목록 행 높이   : py-2 (위아래 8px) → py-2.5로 늘리면 여유
// │ · 번호 색        : text-primary (테라코타)
// │ · 제목 글자      : text-[13px] → 크기 13px
// │ · 비활성(글 없음): opacity-40 으로 흐리게, 클릭 불가
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"

export interface PostListItem {
  id: string | number //  왼쪽에 작게 표시되는 번호
  name: string //         제목 (예: "The Fool")
  meaning?: string //     제목 뒤에 붙는 짧은 설명 (예: "새로운 시작") — 없으면 생략
  href: string //         이동할 주소
  active?: boolean //     false면 흐리게 표시되고 클릭해도 이동하지 않음
}

export function PostListBoard({
  title,
  badgeLabel,
  badgeCount,
  badgeClassName = "bg-secondary",
  altBadgeClassName = "bg-secondary",
  items,
  loadMoreLabel = "더 불러오기",
  showLoadMore = true,
}: {
  title: string //            패널 상단의 세리프 이탤릭 제목 (예: "Universal waite")
  badgeLabel: string //       뱃지 글자 (예: "minor arcana")
  badgeCount?: number //      뱃지 오른쪽의 개수 숫자
  badgeClassName?: string //  왼쪽 단 뱃지 배경색 (예: "bg-[#e8d8d2]")
  altBadgeClassName?: string // 오른쪽 단 뱃지 배경색 (예: "bg-[#cadff6]")
  items: PostListItem[]
  loadMoreLabel?: string
  showLoadMore?: boolean
}) {
  // 목록을 절반으로 나눠 왼쪽/오른쪽 단에 배치합니다.
  const half = Math.ceil(items.length / 2)
  const columns = [items.slice(0, half), items.slice(half)]

  return (
    <section className="rounded-2xl bg-muted/50 p-4 sm:p-5">
      <h2 className="mb-4 font-serif text-3xl italic text-foreground sm:text-4xl">{title}</h2>

      <div className="grid grid-cols-2 gap-3">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-2">
            <div
              className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium text-foreground ${
                columnIndex === 0 ? badgeClassName : altBadgeClassName
              }`}
            >
              {badgeLabel}
              {badgeCount !== undefined && (
                <span className="ml-1.5 font-mono opacity-60">{badgeCount}</span>
              )}
            </div>

            {column.map((item) => {
              const disabled = item.active === false
              return (
                <Link
                  key={`${item.id}-${item.name}`}
                  href={disabled ? "#" : item.href}
                  aria-disabled={disabled}
                  className={`flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 transition-colors ${
                    disabled ? "cursor-default opacity-40" : "hover:bg-secondary/60"
                  }`}
                >
                  <span className="w-4 shrink-0 font-mono text-xs text-primary">{item.id}</span>
                  <span className="truncate text-[13px] text-foreground">
                    {item.name}
                    {item.meaning && (
                      <span className="text-muted-foreground"> – {item.meaning}</span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {showLoadMore && (
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-border bg-card py-2.5 text-center text-xs text-foreground transition-colors hover:bg-secondary/60"
        >
          {loadMoreLabel}
        </button>
      )}
    </section>
  )
}
