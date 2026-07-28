// app/page.tsx
// 홈 — 시안(Home.pdf) 기준입니다.
//
// ┌─ 구조 ────────────────────────────────────────────────────────────
// │ 1) 라임 헤더   — 워드마크 + 햄버거, 그 아래 한 줄 소개
// │ 2) 카테고리 6칸 — 이름 + 그 달의 인용구 + 화살표 (2열 격자)
// │ 3) 검정 배너   — 아카이빙 (Tarot · Oracle · Yoga · Movie · Book)
// │ 4) 광고 · 라임 푸터
// │
// │ 메뉴를 거치지 않고 홈에서 바로 리딩에 들어갑니다.
// │ 카드를 누르면 그 주제의 세부 질문 화면으로 갑니다.
// │
// │ 내용은 전부 lib/ 에 있습니다 —
// │   카테고리·인용구 : lib/home-categories.ts
// │   소개 문구       : lib/site.ts
// └──────────────────────────────────────────────────────────────────
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { HomeCategoryGrid } from "@/components/home-category-card"
import { HomeArchiveBanner } from "@/components/home-archive-banner"
import { AdBand } from "@/components/ad-band"
import { SITE } from "@/lib/site"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      <main className="mx-auto flex w-full max-w-site flex-1 flex-col">
        {/* 1) 헤더 — 워드마크 + 햄버거 (화면 위 16px 고정) */}
        <PageHeader variant="home" />

        <div className="mt-3 px-6">
          <p className="max-w-[19rem] text-pretty text-sm leading-relaxed text-black">
            {SITE.tagline}
          </p>
        </div>

        {/* 2) 카테고리 6칸 */}
        <div className="mt-7">
          <HomeCategoryGrid />
        </div>

        {/* 3) 아카이빙 배너 */}
        <HomeArchiveBanner />

        {/* 4) 광고 */}
        <div className="px-6 py-8">
          <AdBand adUnit="DAN-lbLAE5kPgKDh1dxL" width={320} height={50} />
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
