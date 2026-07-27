// app/my/settings/page.tsx
// 설정 — 계정·앱 관리. 리딩 기록(마이 히스토리)과 분리된 화면입니다.
//
// 항목은 아래 배열에서만 관리하고, 행 모양은 components/ui/settings-list.tsx 가
// 담당합니다. 새 설정을 추가하려면 배열에 한 줄 넣으면 됩니다.
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { SettingsGroup, type SettingsItem } from "@/components/ui/settings-list"
import {
  DEFAULT_ENTITLEMENT,
  getEntitlement,
  signOut,
  type Entitlement,
} from "@/lib/reading-entitlement"

// 앱 섹션의 "권한 · 햅틱 피드백"은 웹에서 제어할 수 없어 넣지 않았습니다.
// (권한은 브라우저가, 햅틱은 기기가 관리합니다) 앱을 출시할 때 추가하세요.
const APP_ITEMS: SettingsItem[] = [{ label: "연동", href: "#" }]

export default function SettingsPage() {
  const router = useRouter()
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT_ENTITLEMENT)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setEntitlement(getEntitlement())
    setReady(true)
  }, [])

  if (!ready) return <div className="min-h-screen bg-background" />

  if (!entitlement.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/my" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="font-myeongjo text-2xl font-bold text-foreground">설정</h1>
          <p className="mt-4 text-sm text-muted-foreground">로그인 후에 볼 수 있어요.</p>
          <Button variant="solid" size="pill" className="mt-8" render={<Link href="/login" />}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            로그인하기
          </Button>
        </main>
        <Footer variant="lime" />
      </div>
    )
  }

  const accountItems: SettingsItem[] = [
    { label: "프로필", href: "#" },
    {
      label: "결제",
      href: "#",
      value: entitlement.isPaid ? "999 플랜" : "무료",
      accent: entitlement.isPaid
        ? { label: "Max 플랜으로 업그레이드", href: "#" }
        : { label: "플랜 알아보기", href: "#" },
    },
    { label: "사용량", href: "#" },
    { label: "알림", href: "#" },
    { label: "개인정보", href: "/privacy" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/my" />
      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-4 pt-2 font-myeongjo text-2xl font-bold text-foreground">설정</h1>

        <p className="rounded-xl bg-muted px-5 py-4 text-base font-semibold text-foreground">
          shanti.oracle@soulseoul.com
        </p>

        <SettingsGroup label="계정" items={accountItems} />
        <SettingsGroup label="앱" items={APP_ITEMS} />

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
