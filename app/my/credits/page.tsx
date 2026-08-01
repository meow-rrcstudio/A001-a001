// app/my/credits/page.tsx
// 나의 별조각 — 남은 개수와 사용내역을 보는 화면입니다.
//
// 사는 곳은 /my/credits/buy 로 갈라져 있습니다. 설정에서
//   · "나의 별조각" 행        → 여기 (얼마 남았고 어디에 썼나)
//   · "별조각 더 사기" 배너   → /my/credits/buy (사는 곳)
// 로 들어옵니다.
//
// ⚠️ 여기에 가격표를 다시 얹지 마세요. 셈을 보러 온 사람에게 파는 말을
//    함께 내밀면 화면이 영수증인지 가게인지 흐려집니다. 별조각이 떨어진
//    사람에게는 아래 "더 사기" 버튼 한 줄이면 충분합니다.
"use client"

import Link from "next/link"
import { CreditScreen } from "./credit-screen"
import { CreditLedger } from "@/components/credit-ledger"
import { CREDIT_UNIT } from "@/lib/credit-packs"
import { useAccount } from "@/lib/use-account"

export default function MyCreditsPage() {
  const { account, ready } = useAccount()

  if (!ready) return <div className="min-h-screen bg-background" />

  // 로그인 전에는 셈 자체가 없습니다. 남의 빈 목록을 보여주는 대신
  // 로그인 길만 내줍니다.
  if (!account.isLoggedIn) {
    return (
      <CreditScreen title={`나의 ${CREDIT_UNIT.one}`} balance={null}>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          로그인하면 남은 개수와 사용내역을 볼 수 있어요.
        </p>
        <Link
          href="/login?next=/my/credits"
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          로그인하기
        </Link>
      </CreditScreen>
    )
  }

  return (
    <CreditScreen title={`나의 ${CREDIT_UNIT.one}`} balance={account.credits}>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        소중한 {CREDIT_UNIT.one}은 받은 것과 쓴 것을 그대로 적어둡니다.
        <br />
        셈이 맞지 않으면 언제든 문의주세요.
      </p>

      <CreditLedger />

      {/* 다 쓴 사람에게만 사는 길을 냅니다. 남아 있는 사람에게는 설정의
          "더 사기" 배너로 충분합니다 — 셈을 보는 화면에서 두 번 권하지
          않습니다. */}
      {account.credits === 0 && (
        <Link
          href="/my/credits/buy"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          {CREDIT_UNIT.one} 사러 가기
        </Link>
      )}
    </CreditScreen>
  )
}
