// app/my/credits/page.tsx
// 크레딧 사기 — 묶음을 고르는 화면입니다.
//
// ⚠️ 아직 결제가 붙어 있지 않습니다. 토스페이먼츠 계약이 끝나면
//    handleBuy 안에서 결제창을 띄우면 됩니다. 그때까지는 "곧 열려요"라고
//    솔직히 말합니다 — 눌리지도 않는 버튼은 고장 난 것처럼 보입니다.
//
// 묶음·가격·부르는 말은 전부 lib/credit-packs.ts 에서 옵니다.
"use client"

import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useAccount } from "@/lib/use-account"
import {
  CREDIT_PACKS,
  CREDIT_UNIT,
  countCredits,
  formatKrw,
  nameCredits,
  pricePerCredit,
} from "@/lib/credit-packs"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/reading-entitlement"

export default function CreditsPage() {
  const { account, ready } = useAccount()

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/my/settings" />

      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-1 pt-2 font-myeongjo text-2xl font-bold text-foreground">
          {CREDIT_UNIT.one}
        </h1>
        <p className="text-sm text-muted-foreground">
          지금 {countCredits(account.credits)} 남았어요.
        </p>

        <div className="mt-6 rounded-2xl bg-muted px-5 py-4">
          <p className="text-[15px] leading-relaxed text-foreground">
            {nameCredits(1)}으로 타로점 한 판을 봐요.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            해석을 받은 뒤 이어서 묻는 것도 같은 한 판이라 더 들지 않아요
            (최대 {FOLLOWUPS_PER_CREDIT}번).
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.key}
              className={`rounded-2xl bg-card p-5 shadow-raised ${
                pack.featured ? "ring-2 ring-accent/40" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-myeongjo text-xl font-bold text-foreground">
                  {nameCredits(pack.credits)}
                </p>
                <p className="text-lg font-semibold text-foreground">{formatKrw(pack.priceKrw)}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                한 {CREDIT_UNIT.counter}에 {formatKrw(pricePerCredit(pack))}
                {pack.featured && " · 가장 많이 골라요"}
              </p>
              <Button variant="solid" size="pill" className="mt-4 w-full" disabled>
                곧 열려요
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          결제는 아직 준비 중이에요.
          <br />
          가입할 때 드린 {CREDIT_UNIT.one}으로 먼저 봐주세요.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/my/settings"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            설정으로 돌아가기
          </Link>
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
