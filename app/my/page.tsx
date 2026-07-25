// app/my/page.tsx
// MY — 로그인한 사람의 홈입니다. (시안의 "꼼마님" 화면)
//
// 로그인 여부·유료 여부는 lib/reading-entitlement.ts 한 곳에서 판단합니다.
// 인증을 붙이면 그 파일의 getEntitlement() 안만 바꾸면 이 화면은 그대로 동작합니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 상단 라임 영역 : bg-brand-lime — 홈과 같은 크롬
// │ · 스탯 상자      : grid-cols-3 — 항목을 늘리면 숫자만 바꾸면 됩니다
// │ · 포인트 표기    : 시안의 "행운 조각". 리딩 크레딧 단위입니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, LogOut } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { RowList, type RowItem } from "@/components/ui/row-list"
import {
  DEFAULT_ENTITLEMENT,
  getEntitlement,
  signOut,
  type Entitlement,
} from "@/lib/reading-entitlement"

// 로그인 후 보일 메뉴 — 실제 페이지가 생기면 href 를 채워주세요.
const myMenu: RowItem[] = [
  { label: "내 타로 리딩 기록", desc: "지금까지 해석한 카드 내역 조회", href: "#" },
  { label: "저장한 배열", desc: "다시 보고 싶어 저장해둔 스프레드", href: "#" },
  { label: "회원권 · 행운 조각", desc: "리딩 크레딧 확인과 충전", href: "#" },
]

export default function MyPage() {
  const router = useRouter()
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT_ENTITLEMENT)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setEntitlement(getEntitlement())
    setReady(true)
  }, [])

  if (!ready) return <div className="min-h-screen bg-background" />

  // ── 비로그인 ─────────────────────────────────────────────────────
  // 리딩 자체는 막지 않습니다. 여기(개인 기록)만 로그인 뒤에 둡니다.
  if (!entitlement.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-brand-lime">
          <div className="mx-auto w-full max-w-2xl px-6 sm:px-8">
            <PageHeader backHref="/" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">MY</h1>
          <p className="mt-4 max-w-xs text-pretty leading-relaxed text-muted-foreground">
            내 리딩 기록과 저장한 배열은 로그인 후에 볼 수 있어요.
          </p>

          <Button variant="solid" size="pill" className="mt-8" render={<Link href="/login" />}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            로그인하기
          </Button>
        </main>

        <Footer variant="lime" />
      </div>
    )
  }

  // ── 로그인 ───────────────────────────────────────────────────────
  const plan = entitlement.isPaid ? "유료 회원" : `체험 ${entitlement.trialsLeft}회 남음`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand-lime">
        <div className="mx-auto w-full max-w-2xl px-6 pb-10 sm:px-8">
          <PageHeader backHref="/" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-ink">꼼마님</h1>
          <p className="mt-1 text-sm text-brand-ink/70">{plan}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 sm:px-8">
        {/* 스탯 3종 — 시안의 "내 타로 기록 / 저장한 배열 / 행운 조각" */}
        <div className="-mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card">
          {[
            { label: "내 타로 기록", value: "0회" },
            { label: "저장한 배열", value: "0개" },
            {
              label: "행운 조각",
              value: entitlement.isPaid ? "무제한" : `${entitlement.trialsLeft}회`,
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`px-3 py-4 text-center ${i > 0 ? "border-l border-border" : ""}`}
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <RowList items={myMenu} variant="plain" />
        </div>

        {/* ⚠️ 검토용 — 실제 인증을 붙이면 문구만 "로그아웃"으로 두고 그대로 쓰면 됩니다 */}
        <button
          type="button"
          onClick={() => {
            signOut()
            router.push("/")
            router.refresh()
          }}
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          로그아웃
        </button>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
