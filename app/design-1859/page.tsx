// app/design-1859/page.tsx
// [비공개] 디자인시스템 스타일가이드 페이지.
// 어떤 메뉴에도 링크하지 않고, 검색엔진 색인도 막아둔 "주소를 아는 사람만" 보는 페이지입니다.
// 여기 보이는 모든 색·글꼴·모양은 app/globals.css 의 변수를 그대로 쓰므로,
// globals.css 를 수정하면 실제 사이트와 이 페이지가 함께 바뀝니다.
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Sparkle, Copy } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TokenSwatch } from "./token-swatch"

export const metadata: Metadata = {
  title: "Design System (비공개)",
  robots: { index: false, follow: false, nocache: true },
}

const colorTokens = [
  { varName: "--background", label: "배경", description: "사이트 전체 바탕. 크림/아이보리 종이 느낌." },
  { varName: "--foreground", label: "글자색", description: "본문 기본 글자. 다크 브라운 잉크." },
  { varName: "--primary", label: "포인트색", description: "링크·버튼·강조. 테라코타 오렌지." },
  { varName: "--card", label: "카드 배경", description: "카드·팝업의 바탕. 배경보다 살짝 밝음." },
  { varName: "--muted", label: "연한 배경", description: "인용문·코드 블록 등의 옅은 바탕." },
  { varName: "--muted-foreground", label: "보조 글자색", description: "설명·날짜 등 흐린 글자. 웜 그레이 브라운." },
  { varName: "--border", label: "선 색", description: "구분선·테두리." },
  { varName: "--destructive", label: "경고색", description: "삭제·오류 등 위험 동작." },
]

export default function DesignSystemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="mb-2 font-serif text-sm italic text-primary">Private Styleguide</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Soul Seoul 디자인시스템
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          이 페이지는 링크되지 않은 비공개 페이지입니다. 여기 보이는 모든 색과 글꼴은{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">app/globals.css</code>{" "}
          한 파일의 변수와 연결되어 있어서, 변수를 고치면 사이트 전체가 함께 바뀝니다.
        </p>

        {/* ── 1. 색상 ───────────────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">1. 색상</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            견본 아래 작은 글씨가 실제 적용 중인 값입니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colorTokens.map((t) => (
              <TokenSwatch key={t.varName} {...t} />
            ))}
          </div>
        </section>

        {/* ── 2. 타이포그래피 ───────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">2. 타이포그래피</h2>
          <div className="mt-5 space-y-6 rounded-xl border border-border bg-card p-6">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                제목 (세리프 · Lora)
              </p>
              <p className="font-serif text-5xl font-medium tracking-tight text-foreground">
                Soul Seoul
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                섹션 제목
              </p>
              <p className="font-serif text-2xl font-semibold text-foreground">
                타로를 중심으로 기록하는 아카이브
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                본문 (산세리프 · Geist)
              </p>
              <p className="max-w-lg leading-relaxed text-muted-foreground">
                본문 글자는 이 정도 크기와 줄 간격으로 보입니다. 타로를 중심으로 영화, 책, 신화,
                천문학, 점성술, 명상 등을 기록하고 연결합니다.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                이탤릭 라벨 / 대문자 라벨
              </p>
              <p className="font-serif text-sm italic text-primary">The 12th Annual</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Personal Archive
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. 버튼 & 링크 ────────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">3. 버튼 · 링크</h2>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-6">
            <Button>기본 버튼</Button>
            <Button variant="secondary">보조 버튼</Button>
            <Button variant="outline">테두리 버튼</Button>
            <Button variant="ghost">고스트 버튼</Button>
            <Button variant="destructive">삭제</Button>
            <Button variant="link">링크 버튼</Button>
            <Button size="icon" aria-label="복사">
              <Copy />
            </Button>
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-6">
            <p className="leading-relaxed text-foreground/80">
              본문 속 링크는{" "}
              <a href="#" className="font-medium text-primary underline underline-offset-4">
                이런 모습
              </a>
              으로 표시됩니다.
            </p>
          </div>
        </section>

        {/* ── 4. 메뉴 리스트 (홈 화면 스타일) ────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">4. 메뉴 리스트</h2>
          <p className="mt-1 text-sm text-muted-foreground">홈 화면에서 쓰는 큰 메뉴 스타일.</p>
          <nav className="mt-5 flex flex-col">
            <Link
              href="#"
              className="group flex items-center justify-between border-t border-border py-5"
            >
              <span className="flex items-baseline gap-4">
                <span className="text-xs text-primary">01</span>
                <span className="font-serif text-4xl tracking-tight">Tarot</span>
              </span>
              <ArrowUpRight className="h-6 w-6 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <div className="flex cursor-not-allowed items-center justify-between border-y border-border py-5 opacity-40">
              <span className="flex items-baseline gap-4">
                <span className="text-xs text-primary">02</span>
                <span className="font-serif text-4xl tracking-tight">Meditation</span>
              </span>
            </div>
          </nav>
        </section>

        {/* ── 5. 본문(블로그) 스타일 ─────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">5. 블로그 본문</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            글 상세 페이지의 본문(.prose-blog) 스타일.
          </p>
          <div className="prose-blog mt-5 rounded-xl border border-border bg-card p-6">
            <h3>글 안의 소제목</h3>
            <p>
              본문 문단은 이렇게 보입니다. <strong>굵은 강조</strong>와{" "}
              <a href="#">본문 링크</a>, 그리고 <code>인라인 코드</code>가 섞일 수 있습니다.
            </p>
            <blockquote>인용문은 이렇게 왼쪽에 포인트색 선이 붙습니다.</blockquote>
          </div>
        </section>

        {/* ── 6. 모서리 둥글기 ───────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">6. 모서리 둥글기</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            기준값 하나(--radius)에서 단계별로 계산됩니다.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-6">
            {(["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl"] as const).map(
              (r) => (
                <div key={r} className="flex flex-col items-center gap-2">
                  <div className={`h-16 w-16 border border-primary/40 bg-primary/15 ${r}`} />
                  <span className="font-mono text-[11px] text-muted-foreground">{r}</span>
                </div>
              )
            )}
          </div>
        </section>

        <div className="mt-16 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
          <Sparkle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            고치고 싶은 게 보이면 &ldquo;포인트색을 더 연하게&rdquo;처럼 말로 알려주세요. 변수
            한 줄만 바꾸면 사이트 전체에 반영됩니다.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
