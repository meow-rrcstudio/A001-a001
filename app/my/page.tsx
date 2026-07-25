// app/my/page.tsx
// MY — 로그인한 사람의 홈입니다. (시안의 "꼼마님" 화면)
//
// ⚠️ 지금은 인증이 없어서 항상 "로그인 필요" 상태로 보입니다.
//    인증을 붙이면 아래 session 을 실제 세션으로 바꾸기만 하면 됩니다.
//    (스탯 3종과 메뉴는 그대로 살아납니다)
//
// 시안 기준 구성:
//   · 인사 + 이메일
//   · 스탯 3종 — 내 타로 기록 / 저장한 배열 / 행운 조각(리딩 크레딧)
//   · 메뉴 섹션 — 기록 조회, 회원권 등
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 상단 라임 영역 : bg-brand-lime — 홈과 같은 크롬
// │ · 스탯 상자      : grid-cols-3 — 항목을 늘리면 숫자만 바꾸면 됩니다
// │ · 포인트 표기    : 시안의 "행운 조각". 리딩 크레딧 단위입니다.
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, LogIn } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "MY",
  // 개인 화면이라 검색 색인 대상이 아닙니다
  robots: { index: false, follow: false },
}

// 인증 연결 전까지의 자리표시자. 로그인이 붙으면 이 함수 안을 실제 세션 조회로 바꾸세요.
//
// ※ 지금은 로그인 기능이 없어서 항상 비로그인입니다. 그래서 로그인 후 화면을
//    확인할 방법이 없어, 주소에 ?preview=1 을 붙이면 예시 데이터로 볼 수 있게 해뒀습니다.
//    (예: /my?preview=1) 인증을 붙일 때 이 preview 분기는 지우면 됩니다.
type Session = { name: string; email: string; readings: string; spreads: string; points: string }

const previewSession: Session = {
  name: "꼼마님",
  email: "shanti.oracle@soulseoul.com",
  readings: "32회",
  spreads: "14개",
  points: "750P",
}

function getSession(isPreview: boolean): Session | null {
  if (isPreview) return previewSession
  return null // ← 인증 연결 시 실제 세션 반환
}

// 로그인 후 보일 메뉴 — 실제 페이지가 생기면 href 를 채워주세요.
const myMenu = [
  { label: "내 타로 리딩 기록", desc: "지금까지 해석한 카드 내역 조회", href: "#" },
  { label: "저장한 배열", desc: "다시 보고 싶어 저장해둔 스프레드", href: "#" },
  { label: "회원권 · 행운 조각", desc: "리딩 크레딧 확인과 충전", href: "#" },
]

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>
}) {
  const { preview } = await searchParams
  const session = getSession(preview === "1")

  // ── 비로그인 ─────────────────────────────────────────────────────
  // 리딩 자체는 막지 않습니다. 여기(개인 기록)만 로그인 뒤에 둡니다.
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-brand-lime">
          <div className="mx-auto w-full max-w-2xl px-6 sm:px-8">
            <PageHeader backHref="/" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-8">
          <h1 className="font-serif text-4xl italic tracking-tight text-foreground">MY</h1>
          <p className="mt-4 max-w-xs text-pretty leading-relaxed text-muted-foreground">
            내 리딩 기록과 저장한 배열은 로그인 후에 볼 수 있어요.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-ink px-8 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            로그인하기
          </Link>

          <Link
            href="/tarot/reading"
            className="mt-6 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            로그인 없이 리딩 먼저 해보기 →
          </Link>

          {/* 검토용 안내 — 인증을 붙이면 이 블록은 지웁니다 */}
          <Link
            href="/my?preview=1"
            className="mt-12 rounded-lg border border-dashed border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground transition-colors hover:bg-muted/50"
          >
            로그인 기능이 아직 없어 이 화면까지만 보입니다.
            <br />
            <span className="font-medium underline underline-offset-4">
              로그인 후 화면 미리보기 →
            </span>
          </Link>
        </main>

        <Footer variant="lime" />
      </div>
    )
  }

  // ── 로그인 ───────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand-lime">
        <div className="mx-auto w-full max-w-2xl px-6 pb-10 sm:px-8">
          <PageHeader backHref="/" />
          <h1 className="mt-4 font-serif text-3xl italic tracking-tight text-brand-ink">
            {session.name}
          </h1>
          <p className="mt-1 text-sm text-brand-ink/70">{session.email}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 sm:px-8">
        {/* 검토용 표시 — 인증을 붙이면 이 배너와 preview 분기를 함께 지웁니다 */}
        <p className="-mt-6 mb-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-center text-xs text-muted-foreground">
          미리보기 화면입니다 — 숫자는 예시값이고, 실제 로그인은 아직 연결되지 않았습니다.
        </p>

        {/* 스탯 3종 — 시안의 "내 타로 기록 / 저장한 배열 / 행운 조각" */}
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card">
          {[
            { label: "내 타로 기록", value: session.readings },
            { label: "저장한 배열", value: session.spreads },
            { label: "행운 조각", value: session.points },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`px-3 py-4 text-center ${i > 0 ? "border-l border-border" : ""}`}
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-serif text-xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <nav className="mt-10 flex flex-col">
          {myMenu.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center justify-between border-t border-border py-4 last:border-b"
            >
              <span className="flex flex-col">
                <span className="text-base font-medium text-foreground">{item.label}</span>
                <span className="mt-0.5 text-sm text-muted-foreground">{item.desc}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
