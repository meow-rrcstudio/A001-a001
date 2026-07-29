// app/tarot/reading/page.tsx
// 무엇에 대해 물을지 고르는 화면 — 나 · 일상 · 사랑 · 친구 · 일 · 돈.
//
// 원래 이 목록은 홈에만 있었습니다. 그래서 "Shānti-에게 물어보기" 같은
// 버튼이 갈 곳이 홈밖에 없었는데, 물어보려고 눌렀다가 홈으로 돌아가면
// "뒤로 간" 것처럼 읽힙니다. 같은 목록에 제 주소를 줘서, 타로를 보러
// 들어가는 길을 따로 만들었습니다.
//
// ⚠️ 카테고리 목록은 홈과 같은 컴포넌트(HomeCategoryGrid)를 씁니다.
//    lib/home-categories.ts 를 고치면 홈과 이 화면이 함께 바뀝니다 —
//    목록을 두 벌로 두면 언젠가 반드시 어긋납니다.
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { HomeCategoryGrid } from "@/components/home-category-card"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "타로 보기",
  description: "무엇이 궁금한지 고르면 샨티가 카드로 읽어줍니다.",
}

export default function ReadingTopicsPage() {
  return (
    // 배경은 홈과 같은 라임입니다. 카테고리 줄이 검정 선·검정 글씨라
    // 크림 위에 놓으면 홈에서 보던 것과 다른 물건처럼 보입니다.
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      <main className={`mx-auto flex w-full max-w-site flex-1 flex-col ${HEADER_SPACE}`}>
        <PageHeader variant="reading" backHref="/" scrim={false} />

        <div className="px-6">
          <h1 className="text-[26px] font-bold leading-tight">
            무엇이 궁금하냥?
          </h1>
          {/* 이름 뒤에 조사를 붙이지 않습니다 — 이름이 "Shānti-" 처럼
              하이픈으로 끝나서 "Shānti-이" 가 되면 읽기 어색합니다.
              우리말 안에서는 화면 곳곳에서 쓰는 "샨티"를 씁니다. */}
          <p className="mt-2 max-w-[20rem] text-pretty text-sm leading-relaxed text-brand-ink/75">
            고른 주제로 샨티가 카드를 뽑아 읽어줍니다.
          </p>
        </div>

        <div className="mt-7">
          <HomeCategoryGrid />
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
