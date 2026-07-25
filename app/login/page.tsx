// app/login/page.tsx
// 로그인 화면 — 시안(login-page) 기준 라임 전체화면입니다.
//
// ⚠️ 지금은 "화면만" 있습니다. 실제 인증은 아직 붙지 않았습니다.
//    붙이는 순서:
//      1) 인증 공급자 선택 (NextAuth / Supabase / Clerk 등)
//      2) Google·Apple 콘솔에서 OAuth 앱 등록 → 환경변수(.env)에 키 입력
//      3) 아래 handleSignIn 자리에 공급자 호출 연결
//    ※ 리딩은 로그인 없이도 쓸 수 있어야 합니다. 이 화면은 "저장·채팅"을
//       쓰려는 사람만 만나는 곳입니다. (검색 유입자를 막으면 안 됩니다)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 배경색     : bg-brand-lime (globals.css --brand-lime)
// │ · 버튼 배경  : bg-brand-ink (검정에 가까운 #333)
// │ · 버튼 높이  : h-12 (48px — 시안 실측)
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Wordmark } from "@/components/brand-mark"

export const metadata: Metadata = {
  title: "로그인",
  // 로그인 화면은 검색 결과에 뜰 이유가 없습니다
  robots: { index: false, follow: false },
}

const buttonBase =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"

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

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        {/* TODO(자산): 시안의 UFO·고양이 일러스트는 아직 미적용 (워드마크만 반영) */}
        <h1>
          <Wordmark className="mx-auto h-12" priority />
          <span className="sr-only">Soul Seoul</span>
        </h1>
        <p className="mt-6 text-center text-sm leading-relaxed text-brand-ink/75">
          리딩 기록을 저장하고 샨티와 이어서 이야기하려면
          <br />
          로그인이 필요해요.
        </p>

        <div className="mt-12 space-y-3">
          {/* ⚠️ 아직 동작하지 않는 버튼입니다 — 인증 연결 전까지 안내만 표시합니다 */}
          <button type="button" disabled className={`${buttonBase} bg-brand-ink text-white opacity-60`}>
            Google로 계속하기
          </button>
          <button type="button" disabled className={`${buttonBase} bg-brand-ink text-white opacity-60`}>
            Apple로 계속하기
          </button>
          <button
            type="button"
            disabled
            className={`${buttonBase} border border-brand-ink/25 bg-brand-lime-soft text-brand-ink opacity-60`}
          >
            이메일로 계속하기
          </button>
          <p className="pt-2 text-center text-xs text-brand-ink/60">
            로그인 기능은 준비 중입니다. 지금은 로그인 없이 리딩을 이용해주세요.
          </p>
        </div>

        <Link
          href="/tarot/reading"
          className="mt-10 text-center text-sm underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          로그인 없이 리딩 먼저 해보기 →
        </Link>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-brand-ink/70">
          ✳ www.soulseoul.xyz ✳
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link href="/about" className="text-xs text-brand-ink/70 underline underline-offset-4">
            about
          </Link>
          <Link href="/privacy" className="text-xs text-brand-ink/70 underline underline-offset-4">
            privacy statement
          </Link>
        </div>
      </footer>
    </div>
  )
}
