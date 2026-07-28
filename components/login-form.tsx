// components/login-form.tsx
// 로그인 화면의 실제 동작 — 카카오·구글·이메일.
//
// 시안의 세 가지를 그대로 둡니다. 국내 서비스라 카카오가 맨 위입니다.
//
// 카카오 버튼만 시안(검정 알약)에서 벗어나 노란색입니다.
// 카카오가 로그인 버튼 색을 #FEE500 으로 규정하고 있어서, 검정으로 두면
// 심사에서 걸릴 수 있습니다. 대신 알약 모양·높이는 시안 그대로라 나머지
// 버튼들과 나란히 놓입니다.
//
// TODO(카카오): 공식 심볼(말풍선)을 /public/kakao-symbol.svg 로 받아
//   넣고 아래 버튼 안에 <Image> 로 얹으세요. 로고를 비슷하게 그려 넣는
//   것은 상표라 하면 안 됩니다 — 지금은 글자만 있습니다.
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client"

type Mode = "buttons" | "email"

export function LoginForm({ next = "/my" }: { next?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("buttons")
  // 이메일은 가입과 로그인이 한 화면입니다 (칸이 같아서 나눌 이유가 없습니다)
  const [signUp, setSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      },
    })
    if (error) {
      setBusy(false)
      setMessage(error.message)
    }
    // 성공하면 이 창이 그대로 로그인 페이지로 넘어갑니다 (busy 유지)
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
      setMessage(translate(result.error.message))
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

  const field =
    "h-12 w-full rounded-full border border-brand-ink/25 bg-background px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-ink"

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

        <Button variant="solid" size="pill" className="w-full" type="submit" disabled={busy}>
          {busy ? "잠시만요..." : signUp ? "가입하기" : "로그인"}
        </Button>

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
      </form>
    )
  }

  return (
    <div className="space-y-3">
      {/* 카카오 규정색 #FEE500 · 글자는 85% 검정 (카카오 가이드) */}
      <button
        type="button"
        disabled={busy}
        onClick={() => signInWith("kakao")}
        className="flex h-12 w-full items-center justify-center rounded-full bg-[#FEE500] text-[15px] font-semibold text-black/85 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        카카오로 계속하기
      </button>
      <Button
        variant="solid"
        size="pill"
        className="w-full"
        disabled={busy}
        onClick={() => signInWith("google")}
      >
        Google로 계속하기
      </Button>
      <Button
        variant="soft"
        size="pill"
        className="w-full"
        type="button"
        onClick={() => setMode("email")}
      >
        이메일로 계속하기
      </Button>

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

/** Supabase 가 영어로 주는 사유를 사람 말로 */
function translate(raw: string): string {
  // "after 57 seconds" 처럼 기다릴 시간을 알려줄 때가 있습니다.
  // "잠시 뒤"보다 "57초 뒤"가 훨씬 낫습니다 — 얼마나 기다릴지 알 수 있으니까요.
  const wait = raw.match(/after (\d+) seconds?/i)
  if (wait) return `${wait[1]}초 뒤에 다시 시도해 주세요.`

  const map: [RegExp, string][] = [
    [/invalid login credentials/i, "이메일이나 비밀번호가 맞지 않아요."],
    [/user already registered|already been registered/i, "이미 가입된 이메일이에요. 로그인해 주세요."],
    [/password should be at least/i, "비밀번호는 6자 이상이어야 해요."],
    [/email not confirmed/i, "메일함에서 인증 링크를 먼저 눌러주세요."],
    [/provider is not enabled/i, "이 로그인 방식이 아직 켜져 있지 않아요."],
    [/rate limit|too many|for security purposes/i, "잠시 뒤에 다시 시도해 주세요."],
    // 가입 순간 profiles 트리거가 실패하면 이 말이 옵니다.
    // (supabase/schema.sql 의 handle_new_user 를 확인하세요)
    [/database error/i, "계정을 만들다 막혔어요. 잠시 뒤 다시 시도해 주세요."],
    [/invalid email/i, "이메일 형식이 올바르지 않아요."],
    [/signups not allowed|signup is disabled/i, "지금은 가입을 받고 있지 않아요."],
  ]
  for (const [pattern, korean] of map) if (pattern.test(raw)) return korean
  return raw
}
