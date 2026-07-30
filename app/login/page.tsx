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
import { translateAuthError } from "@/lib/auth-messages"
import { SITE, copyrightLine } from "@/lib/site"

export const metadata: Metadata = {
  title: "로그인",
  // 로그인 화면은 검색 결과에 뜰 이유가 없습니다
  robots: { index: false, follow: false },
}

/**
 * 카카오·구글에서 돌아오다 실패하면 /auth/callback 이
 * /login?error=... 로 되돌려 보냅니다.
 *
 * ⚠️ 그 error 를 읽는 곳이 여기 말고는 없습니다. 예전에는 아무도 읽지
 *    않아서, 승인을 취소하거나 설정이 어긋난 사람에게는 로그인 화면이
 *    그냥 한 번 더 뜰 뿐이었습니다. 무엇이 잘못됐는지도, 다시 눌러야
 *    하는지도 알 수 없는 화면이었습니다.
 *
 * 사유는 영어로 오므로 lib/auth-messages.ts 를 거쳐 우리말로 바꿉니다
 * (못 알아본 것은 한 줄로 감싸고 원문은 콘솔에만 남습니다).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams
  const notice = error ? translateAuthError(error) : undefined

  // 실패해서 되돌아온 사람이 다시 로그인하면 가려던 자리로 갑니다.
  // 바깥으로 나가는 주소는 받지 않습니다 (app/auth/callback 의 safeNext 와 같은 이유).
  const backTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/my"

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      {/* 뒤로 — 로그인은 막다른 길이면 안 됩니다. 항상 나갈 구멍을 둡니다.
          surface="lime": 이 화면은 배경이 이미 라임이라, 연라임 중간색을 뺀 스크림을 씁니다. 크림용을 그대로 깔면
          위쪽에만 연라임 띠가 얹혀 이상한 그라데이션 자국이 생깁니다. */}
      <PageHeader variant="minimal" backHref="/" surface="lime" />

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
          <LoginForm next={backTo} notice={notice} />
        </div>

        {/* 가입이 이 화면에서 일어나므로 동의 고지도 여기 있어야 합니다.
            이용약관은 "회원가입을 하면 동의한 것으로 본다"고 정하는데,
            그 말을 어디에서도 보여주지 않으면 동의를 받았다고 하기 어렵습니다.
            체크박스로 막지는 않습니다 — 세 버튼 모두 그 자체가 가입 행위라
            한 줄로 알리는 편이 흐름을 끊지 않습니다. */}
        <p className="mt-5 px-2 text-center text-xs leading-relaxed text-brand-ink/70">
          계속하면{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-brand-ink">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-brand-ink">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 봅니다.
        </p>
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
