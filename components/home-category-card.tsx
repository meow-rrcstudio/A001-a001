// components/home-category-card.tsx
// 홈 화면의 카테고리 카드 — 이름 + 그 달의 인용구 + 출처 + 화살표.
//
// 6개 카드가 전부 이 컴포넌트를 쓰므로, 카드 모양을 바꿀 일이 생기면
// 여기만 고치면 홈 전체가 함께 바뀝니다. (내용은 lib/home-categories.ts)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 카드 높이   : h-40 (160px 고정 — 시안)
// │ · 안쪽 여백   : p-6 (24px 전방향)
// │ · 카테고리명  : font-myeongjo text-xl font-bold (나눔명조 20px)
// │ · 인용구      : text-sm text-black/80, 두 줄까지만 (line-clamp-2)
// │ · 출처        : text-[11px] text-black/80
// │ · 구분선      : 그리드에서 divide-* 로 그립니다 (아래 HomeCategoryGrid)
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { homeCategories, quoteOfMonth } from "@/lib/home-categories"

export function HomeCategoryCard({
  category,
  /** 미리보기용 — 다른 달의 문구를 보고 싶을 때만 넘깁니다 */
  date,
}: {
  category: (typeof homeCategories)[number]
  date?: Date
}) {
  const quote = quoteOfMonth(category, date)

  return (
    <Link
      href={`/tarot/reading/${category.slug}`}
      className="group flex h-40 flex-col p-6 transition-colors hover:bg-black/5"
    >
      <p className="font-myeongjo text-xl font-bold leading-tight text-black">{category.label}</p>

      <div className="mt-3 min-w-0 flex-1">
        {/* dir 을 지정해 히브리어 같은 오른쪽→왼쪽 글도 바르게 정렬됩니다 */}
        <p dir={quote.dir ?? "auto"} className="line-clamp-2 text-sm leading-snug text-black/80">
          {quote.text}
        </p>
        <p dir={quote.dir ?? "auto"} className="mt-0.5 text-[11px] text-black/80">
          -{quote.source}-
        </p>
      </div>

      <ArrowRight
        aria-hidden="true"
        className="ml-auto h-5 w-5 shrink-0 text-black transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

/** 카드 6개를 2열 격자로. 카드 사이에만 얇은 검정 선이 들어갑니다 (시안) */
export function HomeCategoryGrid({ date }: { date?: Date }) {
  return (
    <div className="grid grid-cols-2 border-y border-black">
      {homeCategories.map((category, i) => (
        <div
          key={category.slug}
          className={`min-w-0 ${i % 2 === 1 ? "border-l border-black" : ""} ${
            i >= 2 ? "border-t border-black" : ""
          }`}
        >
          <HomeCategoryCard category={category} date={date} />
        </div>
      ))}
    </div>
  )
}
