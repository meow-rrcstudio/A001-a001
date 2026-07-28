// app/design-1859/page.tsx
// [비공개] 디자인시스템 스타일가이드 페이지.
// 어떤 메뉴에도 링크하지 않고, 검색엔진 색인도 막아둔 "주소를 아는 사람만" 보는 페이지입니다.
// 여기 보이는 모든 색·글꼴·모양은 app/globals.css 의 변수를 그대로 쓰므로,
// globals.css 를 수정하면 실제 사이트와 이 페이지가 함께 바뀝니다.
//
// 구성: 파운데이션(1~4) → 컴포넌트(5~12). 오른쪽 목차(toc.tsx)로 점프할 수 있습니다.
// 섹션을 추가할 때: <section id="..."> 를 만들고 아래 tocGroups 에도 같은 id를 추가하세요.
import type { Metadata } from "next"
import { Sparkle, Copy } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { RowList } from "@/components/ui/row-list"
import { SettingsGroup } from "@/components/ui/settings-list"
import { HomeCategoryGrid } from "@/components/home-category-card"
import { HomeArchiveBanner } from "@/components/home-archive-banner"
import { homeCategories } from "@/lib/home-categories"
import { ChipsDemo } from "./chips-demo"
import { SITE, copyrightLine } from "@/lib/site"
import { Wordmark } from "@/components/brand-mark"
import { PixelSprite, BlinkingShanti } from "@/components/pixel-sprite"
import { SHANTI_BASE, SHANTI_BLINK } from "@/lib/pixel-sprites"
import { PageHeader } from "@/components/page-header"
import { SiteMenuPreview } from "@/components/site-menu"
import { ComposerPreview } from "@/components/composer-preview"
import { ArchiveDeckSection } from "@/components/card-archive-board"
import { TarotCardFront, TarotCardBack, TarotCardSlot } from "@/components/tarot-card"
import { CardSpread } from "@/components/card-spread"
import { PageBackground } from "@/components/page-background"
import { TokenSwatch } from "./token-swatch"
import { Toc, type TocGroup } from "./toc"

export const metadata: Metadata = {
  title: "Design System (비공개)",
  robots: { index: false, follow: false, nocache: true },
}

// 본문 색 — 글·카드처럼 "읽는 영역"에 쓰는 색입니다.
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

// 크롬 색 — 상단바·푸터·로그인처럼 "콘텐츠를 감싸는 틀"에만 쓰는 색입니다.
// 본문 색과 분리해 둔 이유: 라임을 켜고 꺼도 글 읽는 화면은 그대로 유지하기 위해서입니다.
const brandTokens = [
  { varName: "--brand-lime", label: "시그니처 라임", description: "상단바·푸터·로그인 배경. 리디자인 시안 실측값." },
  { varName: "--brand-lime-soft", label: "라임 흐림", description: "라임이 흰색으로 옅어지는 중간색. 그라데이션용." },
  { varName: "--brand-ink", label: "크롬 글자색", description: "라임 위 글자. 순검정보다 살짝 부드럽습니다." },
]

// 오른쪽 목차 — 섹션 id와 짝을 이룹니다.
const tocGroups: TocGroup[] = [
  {
    label: "파운데이션",
    items: [
      { id: "colors", label: "1. 색상" },
      { id: "brand", label: "2. 브랜드 크롬" },
      { id: "typography", label: "3. 타이포그래피" },
      { id: "radius", label: "4. 모서리 둥글기" },
      { id: "elevation", label: "5. 그림자 · 선 · 유리면" },
    ],
  },
  {
    label: "컴포넌트",
    items: [
      { id: "buttons", label: "6. 버튼 · 링크" },
      { id: "menu", label: "7. 목록 행" },
      { id: "settings", label: "8. 설정 행" },
      { id: "home-cards", label: "9. 홈 카테고리" },
      { id: "chips", label: "10. 필터 칩" },
      { id: "prose", label: "11. 블로그 본문" },
      { id: "chrome", label: "12. 헤더 · 푸터" },
      { id: "board", label: "13. 카드 아카이브" },
      { id: "cards", label: "14. 타로 카드" },
      { id: "spreads", label: "15. 카드 스프레드" },
      { id: "backgrounds", label: "16. 배경" },
    ],
  },
]

// 섹션 제목 스타일 (공통)
const h2Class = "font-serif text-2xl font-semibold text-foreground"
// 그룹 라벨 스타일 (파운데이션 / 컴포넌트)
const groupLabelClass =
  "mt-16 mb-[-1.5rem] text-xs font-medium uppercase tracking-[0.2em] text-primary"

export default function DesignSystemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 gap-10 px-4 py-12 sm:px-6">
        <main className="min-w-0 max-w-site flex-1">
          <p className="mb-2 font-serif text-sm text-primary">Private Styleguide</p>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Soul Seoul 디자인시스템
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            이 페이지는 링크되지 않은 비공개 페이지입니다. 여기 보이는 모든 색과 글꼴은{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              app/globals.css
            </code>{" "}
            한 파일의 변수와 연결되어 있어서, 변수를 고치면 사이트 전체가 함께 바뀝니다.
          </p>

          <p className={groupLabelClass}>파운데이션</p>

          {/* ── 1. 색상 ───────────────────────────── */}
          <section id="colors" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>1. 색상</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              견본 아래 작은 글씨가 실제 적용 중인 값입니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {colorTokens.map((t) => (
                <TokenSwatch key={t.varName} {...t} />
              ))}
            </div>
          </section>

          {/* ── 2. 브랜드 크롬 ─────────────────────── */}
          <section id="brand" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>2. 브랜드 크롬</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;크롬&rdquo;은 상단바·푸터·로그인처럼 콘텐츠를 감싸는 틀을 말합니다. 리디자인
              시안의 라임은 이 틀에만 칠하고, 글을 읽는 본문 영역은 위의 크림 팔레트를 그대로
              씁니다. 덕분에 라임을 바꾸거나 꺼도 본문 가독성은 영향을 받지 않습니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brandTokens.map((t) => (
                <TokenSwatch key={t.varName} {...t} />
              ))}
            </div>

            {/* 브랜드 마크 — 시안 PDF에서 벡터를 추출해 만든 이미지 자산 */}
            <p className="mt-5 text-xs font-medium text-muted-foreground">
              브랜드 마크 (components/brand-mark.tsx) — 시안 PDF에서 추출한 검정 단색 이미지라
              라임 위·크림 위 어디든 그대로 얹힙니다. 크기는 높이(h-*)만 주면 가로가 따라옵니다.
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-brand-lime p-6">
                <Wordmark className="h-10" />
                <span className="font-mono text-[11px] text-brand-ink/60">
                  &lt;Wordmark /&gt; · /wordmark.png
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
                <div className="flex items-end gap-6">
                  <BlinkingShanti className="h-10" title="샨티" />
                  <BlinkingShanti className="h-10" title="샨티 (생각 중)" busy />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  &lt;BlinkingShanti /&gt; · &lt;BlinkingShanti busy /&gt;
                </span>
              </div>
            </div>

            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              눈은 <strong className="font-semibold text-foreground">언제나</strong> 깜박입니다.
              글을 받아오는 동안에는 <code className="font-mono">busy</code> 를 켜면 제자리에서
              통통 뜁니다 — 웅크렸다(납작) 뛰어올랐다(길쭉) 착지하며 다시 납작해지는, 발밑을
              축으로 삼은 찰진 반동입니다 (<code className="font-mono">.animate-shanti-hop</code>,
              app/globals.css). 움직임을 줄이도록 설정한 기기에서는 뛰지 않습니다.
            </p>

            {/* 상단바 스크림 견본 — 실제로 페이지 위에 깔리는 그라데이션 */}
            <p className="mt-5 text-xs font-medium text-muted-foreground">
              상단바 스크림 — 라임에서 아래로 투명해집니다 (높이 96px)
            </p>
            <div className="mt-2 h-24 rounded-xl border border-border bg-gradient-to-b from-brand-lime via-brand-lime-soft/70 to-transparent" />

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              사이트 문구 — lib/site.ts 한 곳에서 관리합니다 (푸터·홈·메타데이터 공용)
            </p>
            <div className="mt-2 space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-mono text-xs text-muted-foreground">SITE.displayUrl</p>
              <p className="text-foreground">{SITE.star} {SITE.displayUrl} {SITE.star}</p>
              <p className="pt-2 font-mono text-xs text-muted-foreground">SITE.tagline</p>
              <p className="text-foreground">{SITE.tagline}</p>
              <p className="pt-2 font-mono text-xs text-muted-foreground">copyrightLine()</p>
              <p className="text-foreground">{copyrightLine()}</p>
            </div>

            <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              라임을 끄고 예전 크림 룩으로 되돌리려면{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">app/globals.css</code> 의{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">--brand-lime</code> 값을{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">var(--background)</code> 로
              바꾸면 됩니다. 사이트 전체가 한 번에 바뀝니다.
            </p>
          </section>

          {/* ── 3. 타이포그래피 ───────────────────── */}
          <section id="typography" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>3. 타이포그래피</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              시안 지정 글꼴은 두 가지입니다 — 한글·영문 본문과 제목은 <strong className="font-semibold">SF Pro</strong>,
              캘리그라피 영문은 <strong className="font-semibold">Shadows Into Light</strong>.
            </p>
            <p className="mt-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              SF Pro 는 애플 글꼴이라 웹으로 배포할 수 없습니다. 그래서 시스템 글꼴로 불러옵니다 —
              아이폰·맥에서는 진짜 SF Pro(한글은 Apple SD Gothic Neo)가 나오고, 안드로이드·윈도우에서는{" "}
              <strong className="font-semibold">Pretendard</strong> 가 대신합니다. Pretendard 는 애초에 애플
              시스템 글꼴의 웹 대체용으로 만들어진 글꼴이라 인상이 거의 같습니다. 지정은{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">app/globals.css</code> 의{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">--font-sans</code>.
            </p>
            <div className="mt-5 space-y-6 rounded-xl border border-border bg-card p-6">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  워드마크 — 로고는 글꼴이 아니라 이미지입니다 (components/brand-mark.tsx)
                </p>
                <Wordmark className="h-10" />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  큰 제목 (SF Pro · Bold) — 메뉴 이름, 페이지 제목
                </p>
                <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Reading
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  명조 (Nanum Myeongjo · font-myeongjo) — 홈 카테고리·아카이빙 제목
                </p>
                <p className="font-myeongjo text-xl font-bold text-foreground">
                  나 · 일상 · 사랑 · 친구
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  캘리그라피 (Shadows Into Light · font-script) — 영문 강조에만
                </p>
                <p className="font-script text-4xl leading-none text-foreground">
                  Love &nbsp; Career &nbsp; Money
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  ※ 한글은 지원하지 않는 글꼴입니다. 영문에만 쓰세요.
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  섹션 제목
                </p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  타로를 중심으로 기록하는 아카이브
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  본문 (SF Pro → 대체 Pretendard)
                </p>
                <p className="max-w-lg leading-relaxed text-muted-foreground">
                  본문 글자는 이 정도 크기와 줄 간격으로 보입니다. 타로를 중심으로 영화, 책,
                  신화, 천문학, 점성술, 명상 등을 기록하고 연결합니다.
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  메뉴 설명 · 보조 문구 (14px)
                </p>
                <p className="text-sm text-muted-foreground">카드를 뽑고 지금 상황을 읽어보기</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  대문자 라벨 · 모노 라벨
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
                  www.soulseoul.xyz
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Personal Archive
                </p>
              </div>
            </div>
          </section>

          {/* ── 3. 모서리 둥글기 ───────────────────── */}
          <section id="radius" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>4. 모서리 둥글기</h2>
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

          {/* ── 5. 그림자 · 선 · 유리면 ───────────────── */}
          <section id="elevation" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>5. 그림자 · 선 · 유리면</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              시안 이미지에서 그림자 가장자리와 구분선의 색을 한 줄씩 읽어 만든 값입니다. 여기
              세 가지 말고는 새로 만들지 말고, 맞는 것을 골라 쓰세요.
            </p>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ① 그림자 2단계 — <code className="font-mono">shadow-raised</code> ·{" "}
              <code className="font-mono">shadow-overlay</code>
            </p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted p-6">
                <div className="rounded-2xl bg-card px-4 py-6 text-center shadow-raised">
                  <p className="text-sm text-foreground">raised</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    0 2px 8px rgba(0,0,0,.14)
                  </p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  배경 위로 조금 떠 있는 것 — 샨티 말풍선, 라임 위 둥근 버튼, 제안 칩.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-6">
                <div className="rounded-2xl bg-card px-4 py-6 text-center shadow-overlay">
                  <p className="text-sm text-foreground">overlay</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    0 0 16px rgba(0,0,0,.36)
                  </p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  다른 면을 덮고 있는 것 — 메뉴 서랍 위로 밀려난 페이지.
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ② 선 2단계 — 시안의 구분선은 배경 대비 약 11% 잉크입니다. 예전 값(#ededed)은 그
              절반이라 화면에서 선이 거의 사라져 보였습니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
              <div className="px-5 py-4 text-sm text-foreground">border — 목록 구분선·카드 테두리</div>
              <div className="border-t border-border px-5 py-4 text-sm text-foreground">
                border — 같은 성격의 행이 이어질 때
              </div>
              <div className="border-t border-border-strong px-5 py-4 text-sm text-foreground">
                border-strong — 구획이 바뀔 때
              </div>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ③ 유리면 — <code className="font-mono">bg-glass</code> +{" "}
              <code className="font-mono">backdrop-blur-[var(--glass-blur)]</code>. 라임 스크림
              위에 뜨는 둥근 버튼, 하단 손잡이 줄, 입력창 줄에 씁니다. 불투명하게 두면 뒤의
              그라데이션이 그 자리에서 끊겨 보입니다
            </p>
            <div
              className="mt-2 flex items-center justify-center gap-4 rounded-xl border border-border p-6"
              style={{ backgroundImage: "var(--scrim)" }}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-glass text-brand-ink shadow-raised backdrop-blur-[var(--glass-blur)]">
                <Sparkle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-background px-4 py-2.5 text-xs text-muted-foreground">
                불투명 (비교용)
              </span>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ④ 라임 스크림 — 고정 헤더 뒤에 깔려 글이 헤더를 지날 때 읽히게 해줍니다.
              높이 <code className="font-mono">--scrim-height</code> (100px)
            </p>
            <div
              className="mt-2 rounded-xl border border-border"
              style={{ height: "var(--scrim-height)", backgroundImage: "var(--scrim)" }}
            />
          </section>

          <p className={groupLabelClass}>컴포넌트</p>

          {/* ── 6. 버튼 & 링크 ────────────────────── */}
          <section id="buttons" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>6. 버튼 · 링크</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              모든 버튼은 components/ui/button.tsx 한 곳에서 정의됩니다. 페이지에서 직접
              className 으로 버튼을 만들지 말고 여기 variant 를 쓰세요.
            </p>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              시안의 알약 버튼 — variant=&quot;solid&quot; / &quot;soft&quot; / &quot;hollow&quot;, size=&quot;pill&quot;
            </p>
            <div className="mt-2 space-y-3 rounded-xl border border-border bg-brand-lime p-6">
              <Button variant="solid" size="pill" className="w-full">Google로 계속하기</Button>
              <Button variant="soft" size="pill" className="w-full">이메일로 계속하기</Button>
              <Button variant="hollow" size="pill" className="w-full bg-card">78장 카드 그림으로 보기</Button>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              기본 버튼 모음 (폼·관리 화면용)
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-6">
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

          {/* ── 5. 메뉴 리스트 (홈 화면 스타일) ────── */}
          <section id="menu" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>7. 목록 행</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              번호 + 이름(+설명·꼬리표) + 화살표 한 줄. 메뉴 패널과 MY 메뉴가 같은 공용
              컴포넌트(components/ui/row-list.tsx)를 씁니다. 여기를 고치면 모든 목록이
              함께 바뀝니다.
            </p>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              variant=&quot;panel&quot; — 메뉴 오버레이용. ready:false 는 &quot;준비중&quot;으로 흐려집니다
            </p>
            <div className="mt-2 rounded-xl bg-brand-lime p-6">
              <div className="mx-auto max-w-[260px]">
                <RowList
                  variant="panel"
                  items={[
                    { number: "00", label: "Home", href: "#" },
                    { number: "01", label: "Mind", href: "#" },
                    { number: "02", label: "Body", href: "#", ready: false },
                    { number: "03", label: "Archiving", href: "#" },
                    { number: "04", label: "Login", href: "#" },
                    { number: "05", label: "Search", href: "#" },
                  ]}
                />
              </div>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              variant=&quot;plain&quot; — 본문 안 목록(MY 메뉴 등). 설명 줄을 붙일 수 있습니다
            </p>
            <div className="mt-2 rounded-xl border border-border bg-card px-6 py-2">
              <RowList
                variant="plain"
                items={[
                  { label: "내 타로 리딩 기록", desc: "지금까지 해석한 카드 내역 조회", href: "#" },
                  { label: "회원권 · 행운 조각", desc: "리딩 크레딧 확인과 충전", href: "#" },
                ]}
              />
            </div>
          </section>

          {/* ── 7. 설정 행 ─────────────────────────── */}
          <section id="settings" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>8. 설정 행</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              설정 화면의 그룹과 행입니다 (components/ui/settings-list.tsx).
              목록 행(RowList)과 구분되는 이유는 성격이 달라서입니다 — 목록은
              &ldquo;다른 곳으로 가는&rdquo; 링크라 화살표가 ↗ 이고, 설정은
              &ldquo;안으로 들어가 고치는&rdquo; 것이라 › 입니다.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-background px-6 pb-6 pt-1">
              <SettingsGroup
                label="계정"
                items={[
                  { label: "프로필", href: "#" },
                  {
                    label: "결제",
                    href: "#",
                    value: "999 플랜",
                    accent: { label: "Max 플랜으로 업그레이드", href: "#" },
                  },
                  { label: "사용량", href: "#" },
                ]}
              />
            </div>
          </section>

          {/* ── 7. 홈 카테고리 ─────────────────────── */}
          <section id="home-cards" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>9. 홈 카테고리</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              홈의 카드 6개와 아카이빙 배너입니다
              (components/home-category-card.tsx · home-archive-banner.tsx).
              카테고리와 인용구는 lib/home-categories.ts 한 곳에서 관리하고,
              카드 모양을 바꾸면 홈의 6칸이 함께 바뀝니다.
            </p>
            <p className="mt-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              인용구는 <strong className="font-semibold">달마다</strong> 바뀝니다. 무작위가 아니라
              연·월로 정해지므로 서버와 브라우저가 항상 같은 문구를 그리고, 나올 수 있는 조합이{" "}
              {homeCategories[0].quotes.length}가지뿐이라 미리 다 확인할 수 있습니다. 문구를 더
              넣으면 회전 주기가 그만큼 길어집니다.
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <div className="bg-brand-lime">
                <HomeCategoryGrid />
              </div>
              <HomeArchiveBanner />
            </div>
          </section>

          {/* ── 7. 필터 칩 ─────────────────────────── */}
          <section id="chips" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>10. 필터 칩</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              목록을 좁혀 보는 알약 버튼 줄. 아카이브의 덱 필터가 이걸 씁니다
              (components/ui/filter-chips.tsx). 선택된 칩은 검정 채움,
              나머지는 연한 라임입니다.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-card p-6">
              <ChipsDemo />
            </div>
          </section>

          {/* ── 6. 본문(블로그) 스타일 ─────────────── */}
          <section id="prose" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>11. 블로그 본문</h2>
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

          {/* ── 7. 헤더 · 푸터 ─────────────────────── */}
          <section id="chrome" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>12. 헤더 · 푸터</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              헤더 4종 + 메뉴 서랍 + 푸터 4종을 페이지 케이스에 따라 골라 씁니다. 푸터 기본값은
              리디자인 시안의 <strong className="font-semibold">라임 밴드</strong>입니다.
            </p>

            <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              헤더는 <strong className="font-semibold text-foreground">화면 위 16px(top-4)에 고정</strong>
              되고 스크롤해도 따라오지 않습니다. 뒤에는 라임 스크림(96px)이 깔려 글이 헤더를
              통과할 때 읽히도록 합니다. 홈만 예외로 고정하지 않고 함께 스크롤됩니다.
              고정된 만큼 페이지는 위쪽을 <code className="font-mono">HEADER_SPACE</code>
              (pt-[76px]) 만큼 비웁니다. 아래 견본은 상자 안에 보이도록{" "}
              <code className="font-mono">fixed={"{false}"}</code> 로 넣은 것입니다.
            </p>

            <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-brand-ink">
              ⚠️ 캐릭터(샨티)는 <strong className="font-semibold">헤더에 있지 않습니다.</strong>{" "}
              대화 영역으로 내려갔고, 화면에 <strong className="font-semibold">딱 하나</strong>만
              둡니다 — 가장 최근에 만들어진 말의 바로 아래입니다. 말 한 마디마다 붙이면 대화가
              길어질수록 고양이가 줄줄이 늘어서서 표식이 아니라 무늬가 됩니다. 헤더 가운데는 <strong className="font-semibold">제목</strong> 자리이고,
              제목은 글 상세와 타로 리딩에만 넣습니다. 나머지 하위 화면은 비어 있습니다.
            </p>

            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              위 여백은 <strong className="font-semibold text-foreground">떠 있든 아니든 같습니다.</strong>{" "}
              고정일 때는 <code className="font-mono">top-4</code>, 흐르는 상태일 때는{" "}
              <code className="font-mono">pt-4</code> — 둘 다 16px 입니다. 헤더를 감싸는 쪽에서{" "}
              <code className="font-mono">py-*</code> 를 한 겹 더 주면 버튼이 그만큼 내려앉아
              두 상태가 어긋나므로, 감싸는 쪽은 아래 여백만 줍니다.
            </p>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ① variant=&quot;sub&quot; — 뒤로 + 더보기(⋯). 하위 화면 대부분이 씁니다.
              아카이빙 · 타로 목록 · 글 상세 · 기록 · 설정 · about · privacy
              (components/page-header.tsx)
            </p>
            <div
              id="chrome-topbar-demo"
              className="mt-2 overflow-hidden rounded-xl border border-border bg-background px-4 pb-8"
            >
              <PageHeader variant="sub" backHref="#" fixed={false} />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ②-1 variant=&quot;sub&quot; + showShare + title — 글 상세. 공유 버튼은{" "}
              <strong className="font-semibold">글 상세에만</strong> 답니다 (목록 화면에서
              &quot;이 페이지를 공유&quot;는 뜻이 흐릿합니다). 제목은 길면 말줄임되고, 양옆 버튼
              폭과 상관없이 화면 한가운데에 놓입니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background px-4 pb-8">
              <PageHeader
                variant="sub"
                backHref="#"
                showShare
                title="운명의 수레바퀴 — 돌아가는 것은 바퀴지 내가 아니다"
                fixed={false}
              />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ② variant=&quot;reading&quot; + title — 뒤로 + 질문 + 더보기(⋯). 타로를 보는
              동안에만 씁니다 — 질문 고르기 → 섞기 → 카드 뽑기 → 해석 → 대화. 가운데에는
              지금 보고 있는 질문이 들어갑니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background px-4 pb-8">
              <PageHeader
                variant="reading"
                backHref="#"
                title="요즘 일이 잘 안 풀리는데 왜 그럴까요?"
                fixed={false}
              />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ③ variant=&quot;home&quot; — 워드마크 + 햄버거. 홈 전용이고 유일하게 고정되지 않습니다.
              라임 배경 위에 놓이므로 스크림도 깔지 않습니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-brand-lime px-4 pb-8">
              <PageHeader variant="home" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ④ variant=&quot;minimal&quot; — 뒤로가기만. 로그인처럼 나갈 길만 있으면 되는 화면에서
              씁니다. 오른쪽은 자리만 비워 가운데 정렬이 흐트러지지 않게 합니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background px-4 pb-8">
              <PageHeader variant="minimal" backHref="#" fixed={false} />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑤ 메뉴 서랍 — 홈의 햄버거나 하위 화면의 ⋯ 를 누르면 열립니다
              (components/site-menu.tsx). 서랍은 페이지보다{" "}
              <strong className="font-semibold">뒤 레이어(z-0)</strong>에 있고, 열리면 페이지
              (<code className="font-mono">#app-shell</code>, z-10)가 왼쪽으로 78% 밀리며 뒤의
              서랍이 드러납니다. 항목은 아래 목록 한 곳에서만 관리합니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <SiteMenuPreview />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑥ 사이트 헤더 — 로고+메뉴. 시안 외 추가 버전으로, 필요한 페이지에만 사용
              (components/header.tsx)
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <Header />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑦ 푸터 라임 — <strong className="font-semibold">현재 기본값</strong>. 홈 · Archive ·
              MY · Tarot 하단에 쓰입니다. 라임 위에서는 회색 글자가 대비가 부족해서 카피라이트도
              --brand-ink 로 씁니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="lime" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑧ 푸터 라이트 — 라임 이전의 크림 버전. 라임을 끌 때 되돌아갈 자리입니다
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="light" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑨ 푸터 다크 밴드 — 대비가 강한 밴드가 필요할 때 쓰는 예비 버전
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="dark" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ⑩ 푸터 미니멀 — 블로그 본문 · about · privacy 하단. 세리프 로고 + 한 줄
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="minimal" />
            </div>

            <p className="mt-8 text-xs font-medium text-muted-foreground">
              ⑪ 입력 상자 (components/chat-input.tsx) — 질문 화면과 해석 화면이 함께 씁니다.
              글이 길어지면 8줄까지 늘어나고 그 뒤로는 안에서 스크롤됩니다
            </p>
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              ⚠️ textarea 가 아니라 <code className="font-mono">contenteditable</code> 입니다.
              아이폰 사파리가 입력칸 위에 자동완성 줄(열쇠 · 카드 · 위치 + 키보드 닫기)을
              얹는데, <code className="font-mono">autocomplete=&quot;off&quot;</code> 로는 없어지지
              않습니다. 그 줄이 붙는 대상은 &quot;폼 컨트롤&quot;이고 contenteditable 은 폼
              컨트롤이 아니라서 아예 대상이 아닙니다. 한글 조합이 깨지지 않도록 React 가 글자를
              다시 그리지 않는 방식으로 만들었습니다.
            </p>
            <div className="mt-2 rounded-xl border border-border bg-background p-4">
              <ComposerPreview />
            </div>
          </section>

          {/* ── 8. 그리드 박스 (글 목록) ───────────── */}
          <section id="board" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>13. 카드 아카이브 보드</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              /archive 페이지와 같은 공용 컴포넌트(components/card-archive-board.tsx)입니다.
              노션에 글을 올리면(Slug 규칙: 덱-대분류-숫자) 자동으로 이 보드에 나타납니다.
              대분류 컬럼은 좌우로 스크롤됩니다 (컬럼 폭 200px 고정).
            </p>
            <div className="mt-5">
              <ArchiveDeckSection
                deck={{
                  key: "universal",
                  label: "Universal waite",
                  categories: [
                    {
                      key: "major",
                      label: "major arcana",
                      cards: [
                        { slug: "#", number: 0, title: "The Fool" },
                        { slug: "#", number: 1, title: "The Magician" },
                        { slug: "#", number: 5, title: "The Hierophant - 전통과 신뢰" },
                      ],
                    },
                    {
                      key: "swords",
                      label: "swords",
                      cards: [
                        { slug: "#", number: 1, title: "Ace of Swords" },
                        { slug: "#", number: 2, title: "Two of Swords" },
                      ],
                    },
                  ],
                }}
              />
            </div>
          </section>

          {/* ── 9. 타로 카드 ───────────────────────── */}
          <section id="cards" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>14. 타로 카드</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              앞면 · 뒷면 · 번호 슬롯 3종. (components/tarot-card.tsx)
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-6 rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24">
                  <TarotCardFront />
                </div>
                <span className="text-xs text-muted-foreground">앞면</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-24">
                  <TarotCardBack />
                </div>
                <span className="text-xs text-muted-foreground">뒷면</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16">
                  <TarotCardSlot number={1} />
                </div>
                <span className="text-xs text-muted-foreground">번호 슬롯</span>
              </div>
            </div>
          </section>

          {/* ── 10. 카드 스프레드 ──────────────────── */}
          <section id="spreads" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>15. 카드 스프레드</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Site design.pdf의 리딩 화면 배열 전체. 좌표의 원본은 lib/spread-layouts.ts
              하나뿐이라, 거기를 고치면 실제 리딩 화면과 여기가 함께 바뀝니다.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "one-card", label: "1장", aspect: undefined, cardWidth: undefined },
                  { key: "two-card", label: "2장", aspect: undefined, cardWidth: undefined },
                  { key: "three-row", label: "3장 일렬", aspect: undefined, cardWidth: undefined },
                  { key: "three-arch", label: "3장 아치", aspect: undefined, cardWidth: undefined },
                  { key: "three-inverted", label: "3장 역삼각", aspect: "aspect-[16/12]", cardWidth: undefined },
                  { key: "four-row", label: "4장 일렬", aspect: undefined, cardWidth: undefined },
                  { key: "four-diamond", label: "4장 다이아몬드", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  { key: "four-grid", label: "4장 격자", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  { key: "five-tee", label: "5장 T자형", aspect: "aspect-[16/13]", cardWidth: "w-[15%]" },
                  { key: "five-grid", label: "5장 격자+1", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  { key: "five-two-three", label: "5장 (위2+아래3)", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  { key: "six-cross", label: "6장 십자", aspect: "aspect-[16/12]", cardWidth: "w-[14%]" },
                  { key: "six-hex", label: "6장 육각", aspect: "aspect-[16/13]", cardWidth: "w-[14%]" },
                  { key: "seven-horseshoe", label: "7장 말굽형", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  { key: "ten-celtic", label: "10장 켈틱 크로스", aspect: "aspect-[16/13]", cardWidth: "w-[13%]" },
                ] as const
              ).map((spread) => (
                <div key={spread.key} className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {spread.label}{" "}
                    <span className="font-mono text-[10px] opacity-60">{spread.key}</span>
                  </p>
                  <CardSpread
                    layout={spread.key}
                    aspectClassName={spread.aspect}
                    cardWidthClassName={spread.cardWidth}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              리딩 질문 36개가 질문 성격에 따라 3·4·5장 배열 8종에 매칭되어 있습니다.
              2장·6장·7장·10장 배열은 새 질문을 만들 때 바로 쓸 수 있습니다.
            </p>
          </section>

          {/* ── 11. 배경 ───────────────────────────── */}
          <section id="backgrounds" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>16. 배경</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              푸터처럼 페이지 성격에 맞게 골라 쓰는 공용 배경입니다.
              (components/page-background.tsx) 현재: 홈·타로·리딩 = 오로라, 목록·본문 = 단색.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ① 단색 <span className="font-mono text-[10px] opacity-60">plain</span> — 효과
                  없는 크림 배경
                </p>
                <div className="relative h-44 overflow-hidden rounded-xl border border-border bg-background" />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ② 오로라 <span className="font-mono text-[10px] opacity-60">aurora</span> —
                  웜톤 블러가 천천히 떠다님
                </p>
                <div className="relative h-44 overflow-hidden rounded-xl border border-border bg-background">
                  <PageBackground variant="aurora" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ③ 다크 오로라{" "}
                  <span className="font-mono text-[10px] opacity-60">aurora-dark</span> — 몰입형
                  화면용 어두운 배경
                </p>
                <div className="relative h-44 overflow-hidden rounded-xl border border-border">
                  <PageBackground variant="aurora-dark" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ④ 이미지 <span className="font-mono text-[10px] opacity-60">image</span> —
                  사진 위에 가독성 딤 처리
                </p>
                {/* gemini 수정: backdrop-blur 클래스 추가 */}
                <div className="relative h-44 overflow-hidden rounded-xl border border-border">
                  <PageBackground
                    variant="image"
                    imageSrc="/placeholder.jpg"
                    className="backdrop-blur-sm bg-black/30"
                  />
                </div>
              </div>
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

        {/* 오른쪽 고정 목차 — 화면이 넓을 때(lg 이상)만 표시 */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24">
            <Toc groups={tocGroups} />
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  )
}
