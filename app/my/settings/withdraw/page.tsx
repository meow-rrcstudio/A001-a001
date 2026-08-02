// app/my/settings/withdraw/page.tsx
// 회원탈퇴 — 계정을 지우기 전에 무엇이 사라지는지 알리고 한 번 더 묻는 화면.
//
// ┌─ 왜 다이얼로그가 아니라 화면인가 ─────────────────────────────────
// │ 되돌릴 수 없는 일입니다. 작은 상자에 담아 "확인/취소"로 물으면
// │ 무엇이 사라지는지 읽을 자리가 없고, 실수로 누르기도 쉽습니다.
// │ 별조각 구매·결제 확인과 같은 "볼일 하나만 보고 나가는" 화면이라
// │ 헤더도 같은 닫기(×)를 씁니다 — ←(되짚기)가 아닙니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 유예 기간이 없습니다. 누르면 그 자리에서 지워집니다.
//    그래서 체크 한 번을 거쳐야 버튼이 열립니다. 이 장치를 빼지 마세요.
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { useAccount } from "@/lib/use-account"
import { useLoginHref } from "@/lib/login-href"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"
import { signOut } from "@/lib/reading-entitlement"

export default function WithdrawPage() {
  const router = useRouter()
  const { account, ready } = useAccount()
  // 로그인을 마치면 이 화면으로 돌아옵니다 (lib/login-href.ts)
  const loginHref = useLoginHref()
  const [agreed, setAgreed] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return <div className="min-h-screen bg-background" />

  // 로그인하지 않았으면 지울 것이 없습니다.
  if (!account.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader variant="close" backHref="/my/settings/profile" />
        <main
          className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center ${HEADER_SPACE}`}
        >
          <p className="text-base text-muted-foreground">로그인한 뒤에 이용할 수 있어요.</p>
          <Link
            href={loginHref}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            로그인하기
          </Link>
        </main>
      </div>
    )
  }

  async function withdraw() {
    setWorking(true)
    setError(null)
    try {
      const response = await fetch("/api/account/delete", { method: "POST" })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "탈퇴를 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.")
        setWorking(false)
        return
      }
      // 계정이 사라졌으니 이 기기에 남은 흔적도 함께 지웁니다.
      await signOut()
      router.replace("/?left=1")
      router.refresh()
    } catch {
      setError("연결이 끊겼어요. 잠시 뒤 다시 시도해 주세요.")
      setWorking(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader variant="close" backHref="/my/settings/profile" />

      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-2 pt-2 font-myeongjo text-2xl font-bold text-foreground">
          정말 떠나시겠어요?
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          탈퇴하면 아래 것들이 <strong className="text-foreground">그 자리에서 사라집니다.</strong>{" "}
          되돌릴 수 없어요.
        </p>

        {/* 무엇이 사라지는지 — 방침에 적힌 것과 같은 말이어야 합니다 */}
        <ul className="mt-6 space-y-2.5 rounded-xl bg-muted px-5 py-4 text-[15px] leading-relaxed text-foreground">
          <li>· 계정과 로그인 정보</li>
          <li>· 그동안 본 타로점과 샨티와 나눈 대화</li>
          <li>· 샨티가 기억하던 것</li>
          <li>· 남은 {CREDIT_UNIT.one} {countCredits(account.credits)}</li>
        </ul>

        {/* 남은 별조각 경고 — 환불받을 수 있는 것이 있으면 먼저 알려야 합니다 */}
        {account.credits > 0 && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 px-5 py-4 text-[15px] leading-relaxed text-foreground">
            남은 {CREDIT_UNIT.one} {countCredits(account.credits)}는 탈퇴와 함께 소멸합니다. 돈을
            주고 산 {CREDIT_UNIT.one}이 남아 있다면{" "}
            <Link href="/refund" className="font-semibold text-primary underline underline-offset-4">
              환불
            </Link>
            을 먼저 신청해 주세요.
          </div>
        )}

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          법이 남기라고 정한 결제 기록(전자상거래법 제6조, 5년)은 탈퇴 뒤에도 보관합니다. 자세한
          내용은{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            개인정보처리방침
          </Link>
          에 있어요.
        </p>

        {/* 되돌릴 수 없는 일이라 한 번 더 짚고 넘어갑니다 */}
        <label className="mt-8 flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-primary"
          />
          <span>위 내용을 모두 확인했고, 되돌릴 수 없다는 것을 이해했습니다.</span>
        </label>

        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[15px] text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!agreed || working}
          onClick={() => void withdraw()}
          className="mt-6 w-full rounded-xl bg-destructive py-4 text-center text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {working ? "지우는 중…" : "탈퇴하기"}
        </button>

        {/* 나갈 길을 늘 함께 둡니다 — 마음이 바뀔 수 있으니까요 */}
        <Link
          href="/my/settings/profile"
          className="mt-3 block w-full rounded-xl bg-muted py-4 text-center text-base font-semibold text-foreground transition-colors hover:bg-black/5"
        >
          그냥 둘래요
        </Link>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
