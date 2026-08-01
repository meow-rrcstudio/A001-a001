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
import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { HomeCategoryGrid } from "@/components/home-category-card"
import { HomeArchiveBanner } from "@/components/home-archive-banner"
import { AdBand } from "@/components/ad-band"
import { SITE } from "@/lib/site"
import { canonicalPath, jsonLdScriptProps, siteJsonLd } from "@/lib/seo"

export const metadata: Metadata = {
  // 홈의 제목만은 "%s | SoulSeoul" 틀을 쓰지 않습니다 — 이름이 두 번 나옵니다.
  // 사람이 검색창에 실제로 치는 말(소울서울 / 타로)을 앞쪽에 둡니다.
  title: {
    absolute: "소울서울 SoulSeoul — 타로 아카이브와 무료 타로 리딩",
  },
  description: SITE.tagline,
  alternates: { canonical: canonicalPath("/") },
  openGraph: {
    title: "소울서울 SoulSeoul — 타로 아카이브와 무료 타로 리딩",
    description: SITE.tagline,
    url: canonicalPath("/"),
  },
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      {/* 사이트 자체를 설명하는 표식 — 검색결과에 사이트 이름이 제대로 뜨게 합니다 */}
      <script {...jsonLdScriptProps(siteJsonLd())} />
      <main className="mx-auto flex w-full max-w-site flex-1 flex-col">
        {/* 1) 헤더 — 워드마크 + 햄버거 (화면 위 16px 고정) */}
        <PageHeader variant="home" />

        {/* 홈의 제목. 화면에는 워드마크(그림)가 제목 노릇을 하므로 눈에는
            보이지 않게 두고, 검색엔진과 화면낭독기에만 글자로 전합니다.
            ⚠️ 지우지 마세요 — h1 이 없는 페이지는 구글이 "무엇에 대한
               페이지인지" 를 그림에서 읽어내야 합니다. */}
        <h1 className="sr-only">소울서울 SoulSeoul — 타로 아카이브</h1>

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
