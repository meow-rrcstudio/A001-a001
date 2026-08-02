// app/my/settings/profile/page.tsx
// 프로필 — "나는 이 사이트에 어떻게 들어와 있는가"를 보여주는 화면.
//
// ┌─ 왜 로그인 수단을 보여주는가 ─────────────────────────────────────
// │ 로그인 화면에는 카카오·구글·이메일 세 버튼이 나란히 있습니다.
// │ 몇 달 만에 다시 들어온 사람은 그중 무엇으로 가입했는지 기억하지
// │ 못합니다. 틀린 버튼을 누르면 같은 이메일인데 다른 계정이 만들어져
// │ "내 기록이 사라졌다"가 됩니다 — 실제로 흔한 사고입니다.
// │ 한 번 확인해 둘 수 있으면 그 사고가 줄어듭니다.
// └──────────────────────────────────────────────────────────────────
//
// 회원탈퇴도 여기 있습니다. 설정 첫 화면에 두면 로그아웃 바로 옆이라
// 잘못 누르기 쉽고, "계정에 관한 일"은 이 안에 모이는 편이 찾기 좋습니다.
"use client"

import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { useAccount } from "@/lib/use-account"
import { useLoginHref } from "@/lib/login-href"
import { PROVIDER_LABEL } from "@/lib/auth-provider"

export default function ProfilePage() {
  const { account, ready } = useAccount()
  // 로그인을 마치면 이 화면으로 돌아옵니다 (lib/login-href.ts)
  const loginHref = useLoginHref()

  if (!ready) return <div className="min-h-screen bg-background" />

  if (!account.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/my/settings" />
        <main
          className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center ${HEADER_SPACE}`}
        >
          <p className="text-base text-muted-foreground">로그인한 뒤에 볼 수 있어요.</p>
          <Link
            href={loginHref}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            로그인하기
          </Link>
        </main>
        <Footer variant="lime" />
      </div>
    )
  }

  const provider = PROVIDER_LABEL[account.provider]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/my/settings" />

      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-4 pt-2 font-myeongjo text-2xl font-bold text-foreground">프로필</h1>

        <dl className="divide-y divide-black/5 overflow-hidden rounded-xl bg-muted">
          {account.displayName && (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-[15px] text-muted-foreground">이름</dt>
              <dd className="text-[15px] font-semibold text-foreground">{account.displayName}</dd>
            </div>
          )}

          {/* 이메일이 없을 수 있습니다 — 카카오는 계정 설정에 따라 이메일을
              안 주기도 합니다. 없는 자리를 "-" 로 채우지 않고 통째로 뺍니다. */}
          {account.email && (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="shrink-0 text-[15px] text-muted-foreground">이메일</dt>
              <dd className="truncate text-[15px] font-semibold text-foreground">
                {account.email}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="text-[15px] text-muted-foreground">로그인 방법</dt>
            <dd className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: provider.dot }}
              />
              {provider.label}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {provider.hint}
        </p>

        {/* 회원탈퇴 — 계정에 관한 일이라 프로필 안에 둡니다.
            ⚠️ 버튼으로 만들지 않습니다. 되돌릴 수 없는 길은 눈에 띄되
               손이 먼저 가지는 않아야 합니다. 실제로 지우는 물음은
               다음 화면에서 합니다 (/my/settings/withdraw). */}
        <div className="mt-10 border-t border-black/5 pt-6">
          <Link
            href="/my/settings/withdraw"
            className="text-[13px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            회원탈퇴
          </Link>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            탈퇴하면 계정과 그동안 본 타로점이 모두 지워집니다.
          </p>
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
