// app/design-1859/page.tsx
// [비공개] 디자인시스템 스타일가이드 페이지.
// 어떤 메뉴에도 링크하지 않고, 검색엔진 색인도 막아둔 "주소를 아는 사람만" 보는 페이지입니다.
// 여기 보이는 모든 색·글꼴·모양은 app/globals.css 의 변수를 그대로 쓰므로,
// globals.css 를 수정하면 실제 사이트와 이 페이지가 함께 바뀝니다.
//
// 구성: 파운데이션(1~3) → 컴포넌트(4~10). 오른쪽 목차(toc.tsx)로 점프할 수 있습니다.
// 섹션을 추가할 때: <section id="..."> 를 만들고 아래 tocGroups 에도 같은 id를 추가하세요.
import type { Metadata } from "next"
import { Sparkle, Copy } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MenuList } from "@/components/menu-list"
import { PageHeader } from "@/components/page-header"
import { PostListBoard } from "@/components/post-list-board"
import { TarotCardFront, TarotCardBack, TarotCardSlot } from "@/components/tarot-card"
import { CardSpread } from "@/components/card-spread"
import { TokenSwatch } from "./token-swatch"
import { Toc, type TocGroup } from "./toc"

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

// 오른쪽 목차 — 섹션 id와 짝을 이룹니다.
const tocGroups: TocGroup[] = [
  {
    label: "파운데이션",
    items: [
      { id: "colors", label: "1. 색상" },
      { id: "typography", label: "2. 타이포그래피" },
      { id: "radius", label: "3. 모서리 둥글기" },
    ],
  },
  {
    label: "컴포넌트",
    items: [
      { id: "buttons", label: "4. 버튼 · 링크" },
      { id: "menu", label: "5. 메뉴 리스트" },
      { id: "prose", label: "6. 블로그 본문" },
      { id: "chrome", label: "7. 헤더 · 푸터" },
      { id: "board", label: "8. 그리드 박스" },
      { id: "cards", label: "9. 타로 카드" },
      { id: "spreads", label: "10. 카드 스프레드" },
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
        <main className="min-w-0 max-w-3xl flex-1">
          <p className="mb-2 font-serif text-sm italic text-primary">Private Styleguide</p>
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

          {/* ── 2. 타이포그래피 ───────────────────── */}
          <section id="typography" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>2. 타이포그래피</h2>
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
                  본문 글자는 이 정도 크기와 줄 간격으로 보입니다. 타로를 중심으로 영화, 책,
                  신화, 천문학, 점성술, 명상 등을 기록하고 연결합니다.
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

          {/* ── 3. 모서리 둥글기 ───────────────────── */}
          <section id="radius" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>3. 모서리 둥글기</h2>
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

          <p className={groupLabelClass}>컴포넌트</p>

          {/* ── 4. 버튼 & 링크 ────────────────────── */}
          <section id="buttons" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>4. 버튼 · 링크</h2>
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

          {/* ── 5. 메뉴 리스트 (홈 화면 스타일) ────── */}
          <section id="menu" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>5. 메뉴 리스트</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              홈 화면과 같은 공용 컴포넌트(components/menu-list.tsx)를 그대로 렌더링합니다. 그
              파일을 고치면 홈과 여기가 함께 바뀝니다.
            </p>
            <div className="mt-5">
              <MenuList
                items={[
                  { number: "01", label: "Tarot", href: "#", active: true },
                  { number: "02", label: "Meditation", href: "#", active: false },
                ]}
              />
            </div>
          </section>

          {/* ── 6. 본문(블로그) 스타일 ─────────────── */}
          <section id="prose" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>6. 블로그 본문</h2>
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
            <h2 className={h2Class}>7. 헤더 · 푸터</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              케이스에 따라 골라 쓰는 두 가지 헤더와 두 가지 푸터입니다.
            </p>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ① 페이지 상단 바 — 시안(blog-post-list)의 헤더. 목록·리딩 등 콘텐츠 페이지용
              (components/page-header.tsx)
            </p>
            <div className="mt-2 rounded-xl border border-border bg-background px-4 py-3">
              <PageHeader backHref="#" showShare showSearch />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ② 사이트 헤더 — 로고+메뉴. 블로그 본문 등 사이트형 페이지용
              (components/header.tsx)
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <Header />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ③ 푸터 (라이트) — 시안(blog-post-list). 목록·본문처럼 가볍게 끝나는 페이지용
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="light" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              ④ 푸터 (다크 밴드) — Site design.pdf 홈 하단. 화면을 묵직하게 마무리하는 페이지용
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border [&>footer]:mt-0">
              <Footer variant="dark" />
            </div>
          </section>

          {/* ── 8. 그리드 박스 (글 목록) ───────────── */}
          <section id="board" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>8. 그리드 박스 (글 목록)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              /tarot/astrology 페이지와 같은 공용 컴포넌트(components/post-list-board.tsx)입니다.
              흐린 항목은 아직 글이 없는 상태의 모습입니다.
            </p>
            <div className="mt-5">
              <PostListBoard
                title="Universal waite"
                badgeLabel="minor arcana"
                badgeCount={4}
                badgeClassName="bg-[#e8d8d2]"
                altBadgeClassName="bg-[#cadff6]"
                items={[
                  { id: 0, name: "The Fool", meaning: "새로운 시작", href: "#" },
                  { id: 1, name: "The Magician", meaning: "창조력과 의지", href: "#" },
                  { id: 2, name: "The High Priestess", href: "#", active: false },
                  { id: 3, name: "The Empress", href: "#", active: false },
                ]}
              />
            </div>
          </section>

          {/* ── 9. 타로 카드 ───────────────────────── */}
          <section id="cards" className="mt-14 scroll-mt-24">
            <h2 className={h2Class}>9. 타로 카드</h2>
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
            <h2 className={h2Class}>10. 카드 스프레드</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Card.pdf 시안 기준 배열 전체. 좌표의 원본은 lib/spread-layouts.ts 하나뿐이라,
              거기를 고치면 실제 리딩 화면과 여기가 함께 바뀝니다.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "one-card", label: "1장", aspect: undefined, cardWidth: undefined },
                  { key: "two-card", label: "2장", aspect: undefined, cardWidth: undefined },
                  { key: "three-2", label: "3장 일렬", aspect: undefined, cardWidth: undefined },
                  { key: "four-2", label: "4장 일렬", aspect: undefined, cardWidth: undefined },
                  { key: "five-1", label: "5장 (위3+아래2)", aspect: undefined, cardWidth: undefined },
                  { key: "five-2", label: "5장 십자형", aspect: "aspect-[16/12]", cardWidth: "w-[15%]" },
                  {
                    key: "seven-horseshoe",
                    label: "7장 말굽형",
                    aspect: "aspect-[16/12]",
                    cardWidth: "w-[15%]",
                  },
                  {
                    key: "ten-celtic",
                    label: "10장 켈틱 크로스",
                    aspect: "aspect-[16/13]",
                    cardWidth: "w-[13%]",
                  },
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
              * three-1/four-1 키는 three-2/four-2와 같은 배치를 쓰는 하위 호환용 별칭입니다.
              현재 리딩 질문은 3·4·5장 배치를 쓰고, 2장·7장 말굽·10장 켈틱 크로스는 질문과
              매칭할 준비가 된 상태입니다.
            </p>
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
