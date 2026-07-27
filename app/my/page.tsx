// app/my/page.tsx
// MY — 내 리딩 기록(히스토리) 화면입니다.
//
// 설정(계정·결제·알림)은 /my/settings 로 분리했습니다.
// 기록은 "자주 보고 즐기는 것", 설정은 "가끔 고치러 들어가는 것"이라
// 성격이 달라 한 화면에 두지 않습니다.
//
// 로그인 여부는 lib/reading-entitlement.ts 한 곳에서 판단합니다.
"use client"

import Link from "next/link"
import { LogIn, Settings } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ReadingHistory } from "@/components/reading-history"
import { useAccount } from "@/lib/use-account"

export default function MyPage() {
  const { account: entitlement, ready } = useAccount()

  // 이름이 없으면 이메일 앞부분으로, 그것도 없으면 그냥 "반가워요"
  const displayName =
    entitlement.displayName ?? entitlement.email?.split("@")[0] ?? null

  if (!ready) return <div className="min-h-screen bg-background" />

  // ── 비로그인 ─────────────────────────────────────────────────────
  // 리딩 자체는 막지 않습니다. 개인 기록만 로그인 뒤에 둡니다.
  if (!entitlement.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="font-myeongjo text-2xl font-bold text-foreground">MY</h1>
          <p className="mt-4 max-w-xs text-pretty leading-relaxed text-muted-foreground">
            내 리딩 기록은 로그인 후에 볼 수 있어요.
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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/" />
      <main className={`mx-auto w-full max-w-md flex-1 ${HEADER_SPACE}`}>
        <ReadingHistory userName={displayName} />

        <div className="px-6 py-8">
          <Button
            variant="hollow"
            size="pill"
            className="w-full"
            render={<Link href="/my/settings" />}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            설정
          </Button>
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
