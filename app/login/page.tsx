// app/login/page.tsx
// 로그인 화면 — 시안(login-page) 기준 라임 전체화면입니다.
//
// 인증 연결 순서:
//   1) 인증 공급자 선택 (NextAuth / Supabase / Clerk 등)
//   2) Google·Apple 콘솔에서 OAuth 앱 등록 → 환경변수(.env)에 키 입력
//   3) 아래 버튼의 onClick 에 공급자 호출 연결
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 배경색     : bg-brand-lime (globals.css --brand-lime)
// │ · 버튼 배경  : bg-brand-ink (검정에 가까운 #333)
// │ · 버튼 높이  : h-12 (48px — 시안 실측)
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Wordmark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { TestLoginForm } from "@/components/test-login-form"
import { SITE, copyrightLine } from "@/lib/site"

export const metadata: Metadata = {
  title: "로그인",
  // 로그인 화면은 검색 결과에 뜰 이유가 없습니다
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      {/* 뒤로 — 로그인은 막다른 길이면 안 됩니다. 항상 나갈 구멍을 둡니다. */}
      <div className="mx-auto w-full max-w-md px-6 pt-6">
        <Link
          href="/"
          aria-label="홈으로"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/70 transition-colors hover:bg-background"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-6">
        <h1>
          <Wordmark className="mx-auto h-12" priority />
          <span className="sr-only">Soul Seoul</span>
        </h1>

        {/* UFO·고양이 일러스트 (전달받은 원본 PNG 기반).
            배경이 투명해서 라임 위에 그대로 얹힙니다. */}
        <Image
          src="/login-cat.webp"
          alt=""
          aria-hidden="true"
          width={560}
          height={793}
          priority
          className="mx-auto mt-3 h-auto w-[68%] max-w-[260px]"
        />

        <p className="mt-2 text-center text-sm leading-relaxed text-brand-ink/75">
          리딩 기록을 저장하고 샨티와 이어서 이야기하려면
          <br />
          로그인이 필요해요.
        </p>

        <div className="mt-8 space-y-3">
          {/* TODO(인증): 아래 onClick 자리에 공급자 로그인 호출을 연결하세요.
              (NextAuth 예: signIn("google") / signIn("apple") / 이메일 폼 이동) */}
          <Button variant="solid" size="pill" className="w-full">
            Google로 계속하기
          </Button>
          <Button variant="solid" size="pill" className="w-full">
            Apple로 계속하기
          </Button>
          {/* ⚠️ 검토용 테스트 로그인 — 오픈 전 TestLoginForm 을 실제 이메일 로그인으로 교체 */}
          <TestLoginForm />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-brand-ink/70">
          {SITE.star} {SITE.displayUrl} {SITE.star}
        </p>
        <p className="mt-2 text-xs text-brand-ink/70">{copyrightLine()}</p>
        <p className="mt-1.5 text-xs text-brand-ink/70">
          <Link href="/about" className="underline underline-offset-4 hover:text-brand-ink">
            About
          </Link>
          <span className="px-1">and</span>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-brand-ink">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  )
}
