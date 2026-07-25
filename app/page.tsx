// app/page.tsx
// 홈 — 시안(Main_메뉴)의 닫힌 상태와 같은 구성입니다.
//
// ┌─ 시안 구성 ───────────────────────────────────────────────────────
// │ 1) 라임 영역 — 워드마크 + 소개 두 줄, 오른쪽에 햄버거(≡)
// │ 2) 흰 카드   — 돌 사진
// │ 3) 라임 푸터
// │
// │ 메뉴(Reading·Archive·Search·My·Login)는 ≡ 를 눌러 나오는
// │ 패널에 들어 있습니다 (components/site-menu.tsx).
// └──────────────────────────────────────────────────────────────────
import Image from "next/image"
import { Footer } from "@/components/footer"
import { Wordmark } from "@/components/brand-mark"
import { HomeMenuButton } from "@/components/home-menu-button"
import { AdBand } from "@/components/ad-band"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-10">
        <h1>
          <Wordmark className="mx-auto h-12" priority />
          <span className="sr-only">Soul Seoul</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xs text-pretty text-center text-[15px] leading-relaxed text-brand-ink/80">
          타로를 중심으로 마음과 몸, 여러가지 일상의 경험을 기록하고 연결하는 개인
          아카이브입니다.
        </p>

        {/* 햄버거 — 시안처럼 소개 아래 오른쪽 */}
        <div className="mt-3 flex justify-end">
          <HomeMenuButton />
        </div>

        {/* 돌 사진 — 흰 카드 */}
        <div className="mt-2 overflow-hidden bg-white">
          <Image
            src="/menu-stone.jpg"
            alt=""
            aria-hidden="true"
            width={900}
            height={1181}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* 광고 — 사진 아래, 푸터 위 */}
        <div className="py-8">
          <AdBand adUnit="DAN-lbLAE5kPgKDh1dxL" width={320} height={50} />
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
