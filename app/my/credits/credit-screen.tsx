// app/my/credits/credit-screen.tsx
// 별조각 화면 두 장(구매 · 사용내역)이 함께 쓰는 껍데기입니다.
//
// ┌─ 왜 껍데기를 따로 두는가 ─────────────────────────────────────────
// │ 두 화면은 하는 일이 다르지만(사는 곳 / 셈을 보는 곳), 위쪽 세 줄은
// │ 똑같아야 합니다 — 닫기(×) · 제목 · 남은 개수. 여기가 어긋나면
// │ 오가는 동안 화면이 덜컹거립니다.
// │
// │ 남은 개수는 화면마다 다시 세지 않고 부모가 준 값을 그립니다.
// │ (useAccount 를 두 번 부르면 /api/account 를 두 번 두드립니다)
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 배경은 크림(bg-background)입니다. 예전에는 화면 전체가 라임이었는데,
//    라임 위에 회색 카드를 얹으니 카드가 바탕에서 떠 보이고 초록 값(가격·
//    +3/-1)이 배경에 묻혔습니다. 라임은 위쪽 스크림과 푸터에만 둡니다.
"use client"

import type { ReactNode } from "react"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"

export function CreditScreen({
  title,
  /** 남은 개수. 로그인 전이면 null — 상자를 그리지 않습니다 */
  balance,
  children,
}: {
  title: string
  balance: number | null
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 ${HEADER_SPACE}`}>
        {/* 설정에서 들렀다 나가는 자리라 뒤로(←)가 아니라 닫기(×)입니다 */}
        <PageHeader variant="close" backHref="/my/settings" />

        <h1 className="pb-4 pt-2 font-myeongjo text-2xl font-bold text-foreground">{title}</h1>

        {/* 남은 개수 — 설정 화면의 이메일 상자와 같은 모양입니다.
            사러 온 사람에게도 셈을 보러 온 사람에게도 첫 줄은 이것입니다. */}
        {balance !== null && (
          <p className="flex items-center justify-between rounded-xl bg-muted px-5 py-4">
            <span className="text-base font-semibold text-foreground">남은 {CREDIT_UNIT.one}</span>
            <span className="text-base font-semibold text-foreground">{countCredits(balance)}</span>
          </p>
        )}

        {children}
      </main>

      <Footer variant="lime" />
    </div>
  )
}

/**
 * 별조각 화면의 목록 상자 — 설정 목록과 같은 결(둥근 회색 상자 + 얇은 구분선).
 *
 * 구매 묶음과 사용내역이 같은 모양을 씁니다. 하는 일은 달라도 "한 줄에
 * 하나씩, 오른쪽에 값" 이라는 읽는 방식이 같기 때문입니다.
 */
export function CreditList({ children }: { children: ReactNode }) {
  return <div className="mt-4 overflow-hidden rounded-xl bg-muted">{children}</div>
}
