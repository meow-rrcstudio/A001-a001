// components/home-category-card.tsx
// 홈의 카테고리 줄.
//
// 모양은 components/ui/list-item-card.tsx 가 맡고, 여기서는 내용과
// 누름 반응만 다룹니다.
//
// ┌─ 누르면 ──────────────────────────────────────────────────────────
// │ 검정이 왼쪽에서 오른쪽으로 3초에 걸쳐 천천히 차오르고, 지나간 자리의
// │ 글이 우리말로 바뀝니다. (속도는 duration-[3000ms] 한 곳)
// │ 일정한 속도로 쓸리도록 ease-linear 입니다 — ease-out 이면 앞부분이
// │ 훅 지나가고 뒤가 늘어져서 "3초에 걸쳐 차오른다"는 느낌이 안 납니다.
// │
// │ 만드는 법: 같은 줄을 두 겹 겹칩니다.
// │   아래 겹 — 원문 (검정 글씨)
// │   위  겹 — 우리말 (검정 바탕 + 흰 글씨), clip-path 로 왼쪽부터 열림
// │ 글자를 하나씩 물들일 수는 없으니, 두 겹을 같은 자리에 두고 위 겹을
// │ 잘라 여는 것입니다. 경계선에서 색과 글이 정확히 같이 바뀝니다.
// │
// │ ⚠️ 이 반응 자체가 효과라, 마우스 올렸을 때의 기본 배경 효과는
// │    넣지 않습니다 (두 개가 겹치면 지저분합니다).
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { homeCategories, quoteOfMonth } from "@/lib/home-categories"
import { ListItemCard } from "@/components/ui/list-item-card"

export function HomeCategoryCard({
  category,
  /** 미리보기용 — 다른 달의 문구를 보고 싶을 때만 넘깁니다 */
  date,
}: {
  category: (typeof homeCategories)[number]
  date?: Date
}) {
  const quote = quoteOfMonth(category, date)

  const [pressed, setPressed] = useState(false)
  const release = () => setPressed(false)

  return (
    <Link
      // 타로보기 화면으로 가되, 이 주제가 이미 골라진 채로 시작합니다.
      // 한 번 고른 것을 또 고르게 하지 않으려는 것입니다.
      href={`/tarot/ask?topic=${category.slug}`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      // 키보드로 넘어온 사람도 같은 것을 봅니다
      onFocus={() => setPressed(true)}
      onBlur={release}
      // 이 줄은 스스로 누름 효과를 가지고 있습니다. 전역 기본 효과
      // (opacity 0.65 · scale 축소)를 끄지 않으면 검정이 올리브로 뜨고
      // 크기가 튀어 깜빡이는 것처럼 보입니다. (app/globals.css)
      data-press-fx="off"
      className="relative block overflow-hidden text-black"
    >
      {/* 아래 겹 — 원문 */}
      <ListItemCard
        title={category.label}
        description={quote.text}
        source={quote.source}
        dir={quote.dir}
      />

      {/* 위 겹 — 우리말. 왼쪽부터 차오릅니다 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black text-white transition-[clip-path] duration-[3000ms] ease-linear"
        style={{ clipPath: pressed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
      >
        <ListItemCard title={category.label} description={quote.ko} source={quote.koSource} />
      </div>
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
              <HomeCategoryCard category={category} date={date} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
