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
import { AdBand } from "@/components/ad-band"
import { readingTopics } from "@/lib/reading-topics"

// 홈 아래쪽 큰 메뉴 — 실제로 만든 것만 넣습니다.
const menuItems = [
  { number: "01", label: "Reading", href: "/tarot/reading", desc: "카드를 뽑고 지금 상황을 읽어보기" },
  { number: "02", label: "Archive", href: "/archive", desc: "카드 한 장 한 장의 의미와 기록" },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── 1) 라임 히어로 ─────────────────────────────────────────
          배경색은 globals.css 의 --brand-lime 하나로 조절합니다. */}
      <header className="bg-brand-lime">
        <div className="mx-auto w-full max-w-2xl px-6 pb-14 pt-16 sm:px-8">
          {/* TODO(자산): 시안의 손글씨 워드마크 이미지가 준비되면 이 h1 을 <Image> 로 교체 */}
          <h1 className="font-serif text-6xl font-medium italic leading-[1.05] tracking-tight text-brand-ink sm:text-7xl">
            Soul
            <br />
            Seoul
            <br />
            <span className="border-b-2 border-brand-ink/40">—Shanti</span>
          </h1>

          <p className="mt-7 max-w-md text-pretty leading-relaxed text-brand-ink/75">
            타로를 중심으로 마음과 몸, 여러가지 일상의 경험을 기록하고 연결하는 개인 아카이브입니다.
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

        {/* ── 3) 큰 메뉴 ────────────────────────────────────────────── */}
        <nav className="mt-14 flex flex-col">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center justify-between border-t border-border py-5 last:border-b"
            >
              <span className="flex items-baseline gap-4">
                <span className="text-xs text-primary">{item.number}</span>
                <span className="flex flex-col">
                  <span className="font-serif text-4xl italic tracking-tight sm:text-5xl">
                    {item.label}
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">{item.desc}</span>
                </span>
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>
      </main>

      {/* ── 4) 광고 · 푸터 ──────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-10 sm:px-8">
        <AdBand adUnit="DAN-lbLAE5kPgKDh1dxL" width={320} height={50} />
      </div>

      <Footer variant="lime" />
    </div>
  )
}
