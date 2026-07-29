// app/login/page.tsx
// 로그인 화면 — 시안(login-page) 기준 라임 전체화면입니다.
//
// 로그인 방식은 세 가지입니다 (시안 기준).
//   · 카카오 — 연동 (국내 사용자 대부분이 이걸 씁니다. 그래서 맨 위)
//   · 구글   — 연동
//   · 이메일 — 직접 가입
//
// 인증 연결 순서:
//   1) 인증 공급자 선택 (Supabase Auth 는 셋 다 한 번에 됩니다)
//   2) 카카오 개발자센터·Google Cloud 에서 앱 등록 → 환경변수(.env)에 키 입력
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
import { Wordmark } from "@/components/brand-mark"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { LoginForm } from "@/components/login-form"
import { SITE, copyrightLine } from "@/lib/site"

export const metadata: Metadata = {
  title: "로그인",
  // 로그인 화면은 검색 결과에 뜰 이유가 없습니다
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      {/* 뒤로 — 로그인은 막다른 길이면 안 됩니다. 항상 나갈 구멍을 둡니다.
          scrim={false}: 이 화면은 배경이 이미 라임이라 스크림을 깔면
          위쪽에만 연라임 띠가 얹혀 이상한 그라데이션 자국이 생깁니다. */}
      <PageHeader variant="minimal" backHref="/" scrim={false} />

      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-6 ${HEADER_SPACE}`}>
        <h1>
          <Wordmark className="mx-auto h-12" priority />
          <span className="sr-only">SoulSeoul</span>
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

        {/* 시안의 세 가지 — 카카오·구글은 연동, 이메일은 직접 가입입니다.
            동작은 components/login-form.tsx 에 있습니다. */}
        <div className="mt-8">
          <LoginForm />
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
