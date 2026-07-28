// components/home-category-card.tsx
// 홈의 카테고리 줄 — 이름 + 그 달의 인용구 + 출처 + 화살표.
//
// 6개가 모두 이 컴포넌트를 쓰므로, 모양을 바꿀 일이 생기면 여기만 고치면
// 홈 전체가 함께 바뀝니다. (내용은 lib/home-categories.ts)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 배치      : 앞의 넷은 한 줄 가득, 뒤의 둘은 2열 (시안)
// │ · 이름      : font-myeongjo text-xl font-bold
// │ · 인용구    : text-sm, 두 줄까지만 (line-clamp-2)
// │ · 구분선    : 아래 HomeCategoryGrid 에서 그립니다
// │ · 누르는 중 : 검정 반전 + 우리말 번역으로 바뀝니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { homeCategories, quoteOfMonth } from "@/lib/home-categories"

export function HomeCategoryCard({
  category,
  /** 2열로 놓이는 줄인지 (아래 두 칸) */
  narrow = false,
  /** 미리보기용 — 다른 달의 문구를 보고 싶을 때만 넘깁니다 */
  date,
}: {
  category: (typeof homeCategories)[number]
  narrow?: boolean
  date?: Date
}) {
  const quote = quoteOfMonth(category, date)

  // 누르고 있는 동안 우리말로 바뀝니다.
  // 원문을 지우는 게 아니라 잠깐 바꿔 보여주는 것뿐이라, 손을 떼면
  // 원문이 그대로 돌아옵니다.
  const [pressed, setPressed] = useState(false)
  const release = () => setPressed(false)

  return (
    <Link
      href={`/tarot/reading/${category.slug}`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      // 키보드로 넘어온 사람도 같은 것을 볼 수 있게
      onFocus={() => setPressed(true)}
      onBlur={release}
      className={`group flex flex-col px-6 transition-colors ${
        narrow ? "py-6" : "py-5"
      } ${pressed ? "bg-black" : "hover:bg-black/5"}`}
    >
      <p
        className={`font-myeongjo text-xl font-bold leading-tight ${
          pressed ? "text-white" : "text-black"
        }`}
      >
        {category.label}
      </p>

      <div className="mt-2 min-w-0 flex-1">
        {pressed ? (
          <>
            <p className="line-clamp-2 text-sm leading-snug text-white/90">{quote.ko}</p>
            <p className="mt-0.5 text-[11px] text-white/80">-{quote.koSource}-</p>
          </>
        ) : (
          <>
            {/* dir 을 지정해 히브리어 같은 오른쪽→왼쪽 글도 바르게 정렬됩니다 */}
            <p dir={quote.dir ?? "auto"} className="line-clamp-2 text-sm leading-snug text-black/80">
              {quote.text}
            </p>
            <p dir={quote.dir ?? "auto"} className="mt-0.5 text-[11px] text-black/80">
              -{quote.source}-
            </p>
          </>
        )}
      </div>

      <ArrowRight
        aria-hidden="true"
        className={`ml-auto mt-3 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
          pressed ? "text-white" : "text-black"
        }`}
      />
    </Link>
  )
}

/**
 * 홈의 카테고리 목록.
 *
 * 시안: 앞의 넷(나·일상·사랑·친구)은 한 줄을 가득 쓰고, 뒤의 둘
 * (생산적인 일·생산적인 돈)만 2열로 나란히 놓입니다.
 * 줄 사이에만 얇은 검정 선이 들어갑니다.
 */
export function HomeCategoryGrid({ date }: { date?: Date }) {
  const wide = homeCategories.slice(0, 4)
  const pair = homeCategories.slice(4)

  return (
    <div className="border-y border-black">
      <div className="divide-y divide-black">
        {wide.map((category) => (
          <HomeCategoryCard key={category.slug} category={category} date={date} />
        ))}
      </div>

      {pair.length > 0 && (
        <div className="grid grid-cols-2 border-t border-black">
          {pair.map((category, i) => (
            <div key={category.slug} className={`min-w-0 ${i === 1 ? "border-l border-black" : ""}`}>
              <HomeCategoryCard category={category} narrow date={date} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
