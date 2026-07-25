// app/page.tsx
// 홈(비로그인 진입 화면). 시안 기준으로 "리딩 진입"이 주인공입니다.
//
// ┌─ 구조 ────────────────────────────────────────────────────────────
// │ 1) 라임 히어로  — 워드마크 + 한 줄 소개
// │ 2) 리딩 진입    — 주제 4개를 바로 노출 (여기가 전환 지점)
// │ 3) Archive 진입 — 카드 해설·리뷰 읽을거리
// │ 4) 광고 · 푸터
// │
// │ ※ 로그인 홈(내 기록·포인트)은 /my 로 분리했습니다.
// │    검색으로 처음 온 사람이 보는 화면이라, 로그인 없이 바로 쓸 수 있어야 합니다.
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Footer } from "@/components/footer"
import { Wordmark } from "@/components/brand-mark"
import { MenuList, type MenuItem } from "@/components/menu-list"
import { AdBand } from "@/components/ad-band"
import { readingTopics } from "@/lib/reading-topics"

// 홈 아래쪽 큰 메뉴 — 실제로 만든 것만 넣습니다.
// 생김새(글자 크기·간격·색)는 components/menu-list.tsx에서 수정합니다.
const menuItems: MenuItem[] = [
  {
    number: "01",
    label: "Reading",
    href: "/tarot/reading",
    desc: "카드를 뽑고 지금 상황을 읽어보기",
    active: true,
  },
  {
    number: "02",
    label: "Archive",
    href: "/archive",
    desc: "카드 한 장 한 장의 의미와 기록",
    active: true,
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── 1) 라임 히어로 ─────────────────────────────────────────
          배경색은 globals.css 의 --brand-lime 하나로 조절합니다. */}
      {/* 시안(Main_메뉴)과 같은 구성 — 워드마크 가운데, 그 아래 소개 두 줄 */}
      <header className="bg-brand-lime">
        <div className="mx-auto w-full max-w-2xl px-6 pb-14 pt-14 text-center sm:px-8">
          <h1>
            <Wordmark className="mx-auto h-12 sm:h-14" priority />
            <span className="sr-only">Soul Seoul</span>
          </h1>

          <p className="mx-auto mt-6 max-w-sm text-pretty text-[15px] leading-relaxed text-brand-ink/80">
            타로를 중심으로 마음과 몸, 여러가지 일상의 경험을
            <br className="hidden sm:block" /> 기록하고 연결하는 개인 아카이브입니다.
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 sm:px-8">
        {/* ── 2) 리딩 진입 — 화면에서 가장 먼저 눈에 띄어야 하는 자리 ──── */}
        <section className="-mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="font-serif text-2xl italic tracking-tight text-foreground">
            지금 카드 한 장 뽑아볼까요?
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            로그인 없이 바로 볼 수 있어요. 끌리는 주제를 골라보세요.
          </p>

          {/* 주제 4개 — lib/reading-topics.ts 한 곳에서만 관리됩니다 */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {readingTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/tarot/reading/${topic.slug}`}
                className="group flex items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-muted/60"
              >
                <span className="flex flex-col">
                  <span className="font-serif text-xl italic tracking-tight text-foreground">
                    {topic.enLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">{topic.label}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3) 큰 메뉴 — 스타일가이드(/design-1859)와 같은 공용 컴포넌트 ── */}
        <div className="mt-14">
          <MenuList items={menuItems} />
        </div>
      </main>

      {/* ── 4) 광고 · 푸터 ──────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-10 sm:px-8">
        <AdBand adUnit="DAN-lbLAE5kPgKDh1dxL" width={320} height={50} />
      </div>

      <Footer variant="lime" />
    </div>
  )
}
