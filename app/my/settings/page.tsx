// app/my/settings/page.tsx
// 설정 — 계정·앱 관리. 리딩 기록(마이 히스토리)과 분리된 화면입니다.
//
// 항목은 아래 배열에서만 관리하고, 행 모양은 components/ui/settings-list.tsx 가
// 담당합니다. 새 설정을 추가하려면 배열에 한 줄 넣으면 됩니다.
"use client"

import Link from "next/link"
import { LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { SettingsGroup, type SettingsItem } from "@/components/ui/settings-list"
import { useAccount } from "@/lib/use-account"
import {
  signOut,
} from "@/lib/reading-entitlement"

// 앱 섹션의 "권한 · 햅틱 피드백"은 웹에서 제어할 수 없어 넣지 않았습니다.
// (권한은 브라우저가, 햅틱은 기기가 관리합니다) 앱을 출시할 때 추가하세요.
const APP_ITEMS: SettingsItem[] = [{ label: "연동", href: "#" }]

export default function SettingsPage() {
  const router = useRouter()
  const { account: entitlement, ready } = useAccount()

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
      // 건별이라 "플랜"이 없습니다. 남은 개수를 그대로 보여줍니다.
      // 부르는 말은 lib/credit-packs.ts 한 곳에서 옵니다.
      label: `나의 ${CREDIT_UNIT.one}`,
      href: "/my/credits",
      value: `${countCredits(entitlement.credits)} 남음`,
      // 행은 "얼마 남았고 어디에 썼나"(내역)로, 배너는 "더 사기"(구매)로
      // 갈라집니다. 예전에는 둘 다 한 화면이라 사러 들어간 사람에게
      // 사용내역이, 내역을 보러 들어간 사람에게 가격표가 함께 나왔습니다.
      accent:
        entitlement.credits > 0
          ? { label: `${CREDIT_UNIT.one} 더 사기`, href: "/my/credits/buy" }
          : { label: `${CREDIT_UNIT.one} 사러 가기`, href: "/my/credits/buy" },
    },
    { label: "알림", href: "#" },
    { label: "개인정보", href: "/privacy" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/my" />
      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-4 pt-2 font-myeongjo text-2xl font-bold text-foreground">설정</h1>

        <p className="rounded-xl bg-muted px-5 py-4 text-base font-semibold text-foreground">
          {entitlement.email ?? entitlement.displayName ?? "로그인됨"}
        </p>

        <SettingsGroup label="계정" items={accountItems} />
        <SettingsGroup label="앱" items={APP_ITEMS} />

        {/* 로그아웃 — 설정 행과 같은 폭·같은 바탕의 버튼입니다.
            예전에는 밑줄 친 작은 글씨였는데, 목록 아래에 글씨만 떠 있어서
            "설정 항목이 하나 더 있나" 처럼 보였습니다. 목록에 끼워 넣지도
            않습니다 — 들어가는 길(›) 사이에 나가는 길이 섞이니까요. */}
        <button
          type="button"
          onClick={() => {
            void signOut()
            router.push("/")
            router.refresh()
          }}
          className="mt-8 w-full rounded-xl bg-muted py-4 text-center text-base font-semibold text-foreground transition-colors hover:bg-black/5"
        >
          로그아웃 하기
        </button>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
