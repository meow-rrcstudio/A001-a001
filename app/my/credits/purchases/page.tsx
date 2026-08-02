// app/my/credits/purchases/page.tsx
// 결제내역 — 언제 얼마를 냈는지 보는 화면입니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 환불정책 제5조가 "가입한 이메일 주소와 결제일을 함께 적어 주세요"
// │ 라고 요구합니다. 그런데 자기 결제일을 볼 화면이 없었습니다 —
// │ 문서가 요구하는 것을 화면이 내주지 못하고 있었습니다.
// │
// │ 별조각 사용내역(/my/credits)과 나눠 둡니다. "가입 선물 +1"과
// │ "6,880원 결제"는 같은 목록에 놓일 성격이 아닙니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CreditScreen, CreditList } from "../credit-screen"
import { CREDIT_UNIT, countCredits, formatKrw } from "@/lib/credit-packs"
import { useAccount } from "@/lib/use-account"
import { useLoginHref } from "@/lib/login-href"
import { BUSINESS } from "@/lib/business"
import { REFUND_MAILTO } from "@/lib/contact"
import type { PurchaseRow } from "@/app/api/account/purchases/route"

/** "2026년 8월 2일" — 환불 신청에 적어 넣을 값이라 해까지 씁니다 */
function formatDay(at: string) {
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function PurchasesPage() {
  const { account, ready } = useAccount()
  const loginHref = useLoginHref()
  const [rows, setRows] = useState<PurchaseRow[] | null>(null)

  useEffect(() => {
    if (!account.isLoggedIn) return
    let alive = true
    void (async () => {
      try {
        const response = await fetch("/api/account/purchases", { cache: "no-store" })
        const data = (await response.json()) as { purchases?: PurchaseRow[] }
        if (alive) setRows(data.purchases ?? [])
      } catch {
        if (alive) setRows([])
      }
    })()
    return () => {
      alive = false
    }
  }, [account.isLoggedIn])

  if (!ready) return <div className="min-h-screen bg-background" />

  if (!account.isLoggedIn) {
    return (
      <CreditScreen title="결제내역" balance={null}>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          로그인하면 결제한 내역을 볼 수 있어요.
        </p>
        <Link
          href={loginHref}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          로그인하기
        </Link>
      </CreditScreen>
    )
  }

  return (
    <CreditScreen title="결제내역" balance={account.credits}>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        결제한 것과 취소된 것을 그대로 적어둡니다.
        <br />
        환불을 신청하실 때 아래 결제일을 함께 알려주세요.
      </p>

      {/* 아직 못 읽었을 때는 아무 말도 하지 않습니다. "없습니다"를 먼저
          띄웠다가 곧 목록이 들어오면 화면이 덜컹거립니다. */}
      {rows === null ? (
        <div className="mt-4 h-24 rounded-xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted px-5 py-6 text-center text-sm text-muted-foreground">
          아직 결제한 내역이 없어요.
        </p>
      ) : (
        <CreditList>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`px-5 py-4 ${index > 0 ? "border-t border-black/5" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-semibold text-foreground">
                  {CREDIT_UNIT.one} {countCredits(row.credits)}
                </span>
                <span
                  className={`text-[15px] font-semibold ${
                    row.status === "canceled" ? "text-muted-foreground line-through" : "text-accent"
                  }`}
                >
                  {formatKrw(row.amountKrw)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">
                  {formatDay(row.at)}
                  {row.method ? ` · ${row.method}` : ""}
                </span>
                {/* 취소된 줄은 그 사실이 값보다 먼저 읽혀야 합니다 */}
                {row.status === "canceled" && (
                  <span className="text-[13px] font-semibold text-muted-foreground">취소됨</span>
                )}
              </div>
              {/* 주문번호 — 문의할 때 이 값을 알려주면 찾기가 빠릅니다.
                  평소에는 눈에 걸리지 않게 제일 작고 흐리게 둡니다. */}
              <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">{row.orderId}</p>
            </div>
          ))}
        </CreditList>
      )}

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        환불은{" "}
        <a href={REFUND_MAILTO} className="text-primary underline underline-offset-4">
          {BUSINESS.email}
        </a>{" "}
        로 신청합니다. 기준은{" "}
        <Link href="/refund" className="text-primary underline underline-offset-4">
          환불정책
        </Link>
        에 있어요.
      </p>
    </CreditScreen>
  )
}
