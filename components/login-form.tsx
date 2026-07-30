// components/login-form.tsx
// 로그인 화면의 실제 동작 — 카카오·구글·이메일.
//
// 시안의 세 가지를 그대로 둡니다. 국내 서비스라 카카오가 맨 위입니다.
//
// 버튼은 시안대로 각진 검정입니다. 카카오도 검정으로 통일했습니다.
//
// ⚠️ 카카오는 로그인 버튼 색을 #FEE500 으로 규정합니다. 검정으로 두는 것은
//    그 규정에서 벗어나므로, 카카오 심사 전에 한 번 확인이 필요합니다.
//    되돌릴 때는 카카오 버튼만 solidBtn 대신 bg-[#FEE500] text-black/85 로 바꾸면 됩니다.
//
// 심볼은 components/provider-marks.tsx 에 있습니다.
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GoogleMark, KakaoMark } from "@/components/provider-marks"
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-messages"

type Mode = "buttons" | "email" | "forgot"

/**
 * 카카오에 요청할 동의항목.
 *
 * ⚠️ 이걸 적어주지 않으면 Supabase 가 기본값으로 이메일(account_email)까지
 *    같이 요청합니다. 그런데 이메일은 사업자 인증을 마친 "비즈 앱"만
 *    설정할 수 있는 항목이라, 일반 개발 앱에서는 카카오 콘솔에 아예
 *    없습니다. 설정하지 않은 항목을 요청하면 카카오가 로그인 창 대신
 *    KOE205("잘못된 요청 — 서비스 설정에 오류가 있습니다")를 띄웁니다.
 *
 * 그래서 기본은 닉네임만입니다. 카카오 계정에 이메일이 없어도 되도록
 * 이미 만들어 두었습니다 (app/api/account/route.ts 의 nameOf,
 * app/my/settings 의 표시 규칙).
 *
 * ┌─ 이메일까지 받고 싶을 때 (사업자등록이 나온 지금 할 수 있습니다) ──
 * │ 순서를 지켜야 합니다. 뒤집으면 그 자리에서 KOE205 가 납니다.
 * │   1) 카카오 개발자센터 → 내 애플리케이션 → 비즈니스
 * │      → 사업자등록번호를 넣어 "비즈 앱"으로 전환
 * │   2) 카카오 로그인 → 동의항목 → 카카오계정(이메일)을 "필수 동의"로
 * │   3) 그 다음에 Vercel 환경변수 NEXT_PUBLIC_KAKAO_EMAIL=on → 재배포
 * │
 * │ 켜다가 KOE205 가 다시 나면 이 환경변수만 지우고 재배포하면
 * │ 곧바로 예전 상태(닉네임만)로 돌아갑니다 — 코드는 건드릴 게 없습니다.
 * └──────────────────────────────────────────────────────────────────
 */
const KAKAO_SCOPES =
  process.env.NEXT_PUBLIC_KAKAO_EMAIL === "on"
    ? "profile_nickname account_email"
    : "profile_nickname"

/**
 * 어떤 로그인 방식을 보여줄지.
 *
 * 카카오·구글은 바깥 설정(카카오 콘솔·Google Cloud)이 맞아야만 동작합니다.
 * 설정이 어긋난 채로 버튼을 남겨두면, 누른 사람은 우리 화면이 아니라
 * 카카오·구글의 오류 화면을 만나고 "이 사이트 고장났네"로 읽습니다.
 * 그래서 고쳐질 때까지는 아예 감춥니다 — 눌러서 실패하는 버튼보다
 * 없는 버튼이 낫습니다.
 *
 * ⚠️ 코드를 고치지 않고 Vercel 환경변수만으로 다시 켤 수 있습니다.
 *    NEXT_PUBLIC_LOGIN_KAKAO=on   ·   NEXT_PUBLIC_LOGIN_GOOGLE=on
 *    (환경변수는 빌드에 박히므로 값을 바꾼 뒤 재배포해야 합니다)
 *
 * ┌─ 켜기 전에 확인할 것 ─────────────────────────────────────────────
 * │ 두 실패 모두 우리 코드가 아니라 바깥 콘솔 설정이 원인이었습니다.
 * │ 그래서 여기를 켜기 전에 콘솔부터 맞춰야 합니다.
 * │
 * │ 카카오 (KOE205 — "잘못된 요청")
 * │   · 원인: 콘솔에 없는 동의항목(account_email)을 요청했습니다.
 * │   · 코드 쪽은 닉네임만 요청하도록 이미 고쳐 두었습니다.
 * │   · 콘솔에서 확인할 것:
 * │       - 카카오 로그인 "활성화 ON"
 * │       - Redirect URI 에 Supabase 콜백 주소가 들어 있는지
 * │         (https://<프로젝트>.supabase.co/auth/v1/callback —
 * │          우리 도메인이 아니라 Supabase 주소입니다. 자주 헷갈립니다)
 * │       - 동의항목에 profile_nickname 이 켜져 있는지
 * │   · Supabase → Authentication → Providers → Kakao 에
 * │     REST API 키와 Client Secret 이 들어 있어야 합니다.
 * │
 * │ 구글 (401 invalid_client — "OAuth client was not found")
 * │   · 원인: Supabase 에 넣은 클라이언트 ID 가 구글에 없는 값입니다.
 * │     (오타이거나, 지운 사용자 인증 정보이거나, 다른 프로젝트의 것)
 * │   · Google Cloud → API 및 서비스 → 사용자 인증 정보에서
 * │     OAuth 2.0 클라이언트 ID 를 새로 만들거나 기존 것을 열어
 * │       - 승인된 리디렉션 URI:
 * │         https://<프로젝트>.supabase.co/auth/v1/callback
 * │     를 넣고, 클라이언트 ID·보안 비밀번호를 Supabase 에 그대로 붙여넣습니다.
 * │   · ID 는 반드시 .apps.googleusercontent.com 으로 끝납니다.
 * │     그렇지 않다면 잘못 붙여넣은 것입니다.
 * │
 * │ 양쪽 모두 Supabase → Authentication → URL Configuration 의
 * │ Redirect URLs 에 우리 콜백이 있어야 합니다:
 * │   https://soulseoul.xyz/auth/callback
 * │   https://*.vercel.app/auth/callback   (미리보기용)
 * └──────────────────────────────────────────────────────────────────
 */
const SHOW_KAKAO = process.env.NEXT_PUBLIC_LOGIN_KAKAO === "on"
const SHOW_GOOGLE = process.env.NEXT_PUBLIC_LOGIN_GOOGLE === "on"

export function LoginForm({
  next = "/my",
  /**
   * 돌아오는 길에 실패해서 붙어 온 사유 (app/login/page.tsx 가 넘겨줍니다).
   *
   * 카카오·구글 창에서 승인을 취소했거나, 세션을 끼우다 막혔을 때
   * /auth/callback 이 /login?error=... 로 되돌려 보냅니다. 그 사유를
   * 받아 첫 화면에 그대로 띄웁니다 — 예전에는 아무 말 없이 로그인
   * 화면만 다시 떠서, 누른 사람은 자기가 잘못 눌렀는지조차 몰랐습니다.
   */
  notice,
}: {
  next?: string
  notice?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("buttons")
  // 이메일은 가입과 로그인이 한 화면입니다 (칸이 같아서 나눌 이유가 없습니다)
  const [signUp, setSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(notice ?? null)

  async function signInWith(provider: "kakao" | "google") {
    const supabase = getSupabaseBrowser()
    if (!supabase) return setMessage("아직 로그인 설정이 안 되어 있어요.")
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // 돌아올 자리. 지금 보고 있는 주소 기준이라 미리보기에서도 맞습니다.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        ...(provider === "kakao" ? { scopes: KAKAO_SCOPES } : {}),
      },
    })
    if (error) {
      setBusy(false)
      setMessage(translateAuthError(error.message))
    }
    // 성공하면 이 창이 그대로 로그인 페이지로 넘어갑니다 (busy 유지)
  }

  /**
   * 비밀번호 재설정 메일 보내기.
   *
   * ⚠️ 없는 계정이어도 "보냈어요"라고 답합니다. "그런 계정 없습니다"는
   *    친절해 보이지만, 아무 주소나 넣어보며 누가 가입했는지 알아내는
   *    길이 됩니다. 메일함을 여는 사람만 결과를 알면 됩니다.
   */
  async function submitForgot(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowser()
    if (!supabase) return setMessage("아직 로그인 설정이 안 되어 있어요.")
    if (!email.trim()) return

    setBusy(true)
    setMessage(null)

    const result = await withTimeout(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        // 메일의 링크를 누르면 여기로 돌아오고, callback 이 세션을 끼운 뒤
        // 새 비밀번호를 정하는 화면으로 보냅니다.
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
    )

    setBusy(false)

    if (result === "timeout") {
      setMessage("응답이 없어요. 잠시 뒤 다시 시도해 주세요.")
      return
    }
    // 너무 자주 보내면 Supabase 가 막습니다 — 그건 알려줘야 합니다.
    if (result.error && /rate limit|for security purposes|too many/i.test(result.error.message)) {
      setMessage(translateAuthError(result.error.message))
      return
    }

    setMessage("메일함을 확인해 주세요. 비밀번호를 새로 정하는 링크를 보냈어요.")
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowser()
    if (!supabase) return setMessage("아직 로그인 설정이 안 되어 있어요.")
    if (!email.trim() || !password) return

    setBusy(true)
    setMessage(null)

    // ⚠️ 시간 제한이 꼭 필요합니다. 답이 안 오면 버튼이 "잠시만요..."인 채로
    //    영원히 멈춰 있고, 사용자는 무엇을 해야 할지 알 수 없습니다.
    const result = await withTimeout(
      signUp
        ? supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
          })
        : supabase.auth.signInWithPassword({ email: email.trim(), password })
    )

    setBusy(false)

    if (result === "timeout") {
      setMessage("응답이 없어요. 잠시 뒤 다시 시도해 주세요.")
      return
    }

    if (result.error) {
      setMessage(translateAuthError(result.error.message))
      return
    }

    if (signUp) {
      // 메일 확인을 켜 두었다면 여기서 끝나고, 꺼 두었다면 바로 로그인됩니다.
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setMessage("메일함을 확인해 주세요. 인증 링크를 보냈어요.")
        return
      }
    }

    router.push(next)
    router.refresh()
  }

  // 시안: 각진 버튼. 모서리를 둥글리지 않습니다.
  const btnBase =
    "flex h-12 w-full items-center justify-center gap-2.5 px-5 text-[15px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
  const solidBtn = `${btnBase} bg-brand-ink text-white`
  const softBtn = `${btnBase} bg-brand-lime-soft text-brand-ink`

  const field =
    "h-12 w-full border border-brand-ink/25 bg-background px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-ink"

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-2xl bg-brand-ink/10 px-5 py-4 text-center text-sm text-brand-ink">
        로그인 설정이 아직 없어요. (환경변수를 넣고 다시 배포해 주세요)
      </p>
    )
  }

  if (mode === "email") {
    return (
      <form onSubmit={submitEmail} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          aria-label="이메일"
          autoComplete="email"
          required
          className={field}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={signUp ? "비밀번호 (6자 이상)" : "비밀번호"}
          aria-label="비밀번호"
          autoComplete={signUp ? "new-password" : "current-password"}
          required
          minLength={6}
          className={field}
        />

        {message && <p className="px-2 text-sm text-brand-ink">{message}</p>}

        <button type="submit" disabled={busy} className={solidBtn}>
          {busy ? "잠시만요..." : signUp ? "가입하기" : "로그인"}
        </button>

        <div className="flex items-center justify-between px-2 pt-1 text-sm text-brand-ink/75">
          <button
            type="button"
            onClick={() => {
              setSignUp((s) => !s)
              setMessage(null)
            }}
            className="underline underline-offset-4"
          >
            {signUp ? "이미 계정이 있어요" : "처음이에요, 가입할래요"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("buttons")
              setMessage(null)
            }}
            className="underline underline-offset-4"
          >
            뒤로
          </button>
        </div>

        {/* 비밀번호 찾기는 로그인할 때만 필요합니다 (가입 중에는 아직 없으니까요) */}
        {!signUp && (
          <p className="px-2 pt-1 text-center text-sm text-brand-ink/75">
            <button
              type="button"
              onClick={() => {
                setMode("forgot")
                setPassword("")
                setMessage(null)
              }}
              className="underline underline-offset-4"
            >
              비밀번호를 잊으셨나요?
            </button>
          </p>
        )}
      </form>
    )
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={submitForgot} className="space-y-3">
        <p className="px-2 pb-1 text-sm leading-relaxed text-brand-ink/75">
          가입할 때 쓴 이메일을 적어주세요. 비밀번호를 새로 정하는 링크를 보내드립니다.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          aria-label="이메일"
          autoComplete="email"
          required
          className={field}
        />

        {message && <p className="px-2 text-sm text-brand-ink">{message}</p>}

        <button type="submit" disabled={busy} className={solidBtn}>
          {busy ? "보내는 중..." : "재설정 링크 보내기"}
        </button>

        <p className="px-2 pt-1 text-center text-sm text-brand-ink/75">
          <button
            type="button"
            onClick={() => {
              setMode("email")
              setMessage(null)
            }}
            className="underline underline-offset-4"
          >
            로그인으로 돌아가기
          </button>
        </p>
      </form>
    )
  }

  // 이메일만 남으면 그게 유일한 길이라 보조가 아닙니다 — 검정으로 올립니다
  const emailBtn = SHOW_KAKAO || SHOW_GOOGLE ? softBtn : solidBtn

  return (
    <div className="space-y-3">
      {SHOW_KAKAO && (
        <button type="button" disabled={busy} onClick={() => signInWith("kakao")} className={solidBtn}>
          <KakaoMark />
          카카오로 계속하기
        </button>
      )}

      {SHOW_GOOGLE && (
        <button type="button" disabled={busy} onClick={() => signInWith("google")} className={solidBtn}>
          <GoogleMark />
          Google로 계속하기
        </button>
      )}

      {/* 이메일은 보조 — 연라임 바탕에 검정 글씨 (시안) */}
      <button type="button" onClick={() => setMode("email")} className={emailBtn}>
        이메일로 계속하기
      </button>

      {message && <p className="px-2 pt-1 text-center text-sm text-brand-ink">{message}</p>}
    </div>
  )
}

/** 답이 이 시간 안에 안 오면 포기하고 사유를 보여줍니다 */
const TIMEOUT_MS = 20000

async function withTimeout<T>(promise: Promise<T>): Promise<T | "timeout"> {
  return Promise.race([
    promise,
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
  ])
}
