// app/reset-password/page.tsx
// 비밀번호를 새로 정하는 화면.
//
// 오는 길: 로그인 → "비밀번호를 잊으셨나요?" → 메일의 링크 →
//          /auth/callback (여기서 세션이 끼워집니다) → 이 화면
//
// ⚠️ 그래서 이 화면은 "이미 로그인된 상태"로 열립니다. 메일 링크가
//    임시 세션을 만들어 주기 때문입니다. 세션이 없다면 링크가 만료됐거나
//    주소를 직접 친 것이라, 다시 받으라고 안내합니다.
//
// 모양은 로그인 화면과 같은 라임 전체화면입니다 (같은 흐름의 한 장면이라
// 배경이 바뀌면 다른 사이트로 넘어온 것처럼 보입니다).
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Wordmark } from "@/components/brand-mark"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-messages"

type State = "checking" | "ready" | "expired" | "done"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [state, setState] = useState<State>("checking")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return setState("expired")
    void supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "ready" : "expired")
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    // 두 칸을 받는 이유: 새 비밀번호는 눌러 확인할 방법이 없습니다.
    // 오타가 나면 그대로 잠겨버려서, 한 번 더 받는 편이 안전합니다.
    if (password !== confirm) {
      setMessage("두 번 적은 비밀번호가 서로 달라요.")
      return
    }
    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상이어야 해요.")
      return
    }

    setBusy(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password })

    setBusy(false)

    // 사유는 lib/auth-messages.ts 한 곳에서 우리말로 옮깁니다.
    // 예전에는 못 알아본 사유를 영어 그대로 띄웠는데, 읽는 사람에게는
    // 무슨 말인지도, 무엇을 해야 하는지도 알 수 없었습니다.
    if (error) {
      setMessage(translateAuthError(error.message))
      return
    }

    setState("done")
    // 이미 로그인된 상태라 바로 들여보냅니다. 다시 로그인하라고 하면
    // 방금 정한 비밀번호를 또 치게 하는 셈이라 번거롭기만 합니다.
    setTimeout(() => {
      router.push("/my")
      router.refresh()
    }, 1200)
  }

  const btn =
    "flex h-12 w-full items-center justify-center px-5 text-[15px] font-semibold bg-brand-ink text-white transition-opacity hover:opacity-90 disabled:opacity-60"
  const field =
    "h-12 w-full border border-brand-ink/25 bg-background px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-ink"

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      {/* 로그인과 같은 이유로 스크림을 깔지 않습니다 (배경이 이미 라임) */}
      <PageHeader variant="minimal" backHref="/login" surface="lime" />

      <main
        className={`mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-6 ${HEADER_SPACE}`}
      >
        <h1>
          <Wordmark className="mx-auto h-12" priority />
          <span className="sr-only">SoulSeoul</span>
        </h1>

        <div className="mt-10">
          {!isSupabaseConfigured || state === "expired" ? (
            <p className="px-2 text-center text-sm leading-relaxed text-brand-ink/75">
              링크가 만료됐거나 이미 사용된 것 같아요.
              <br />
              로그인 화면에서 다시 받아주세요.
            </p>
          ) : state === "checking" ? (
            <p className="px-2 text-center text-sm text-brand-ink/75">확인하는 중...</p>
          ) : state === "done" ? (
            <p className="px-2 text-center text-sm text-brand-ink/75">
              새 비밀번호로 바꿨어요. 잠시 뒤 이동합니다.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="px-2 pb-1 text-sm leading-relaxed text-brand-ink/75">
                새 비밀번호를 정해주세요.
              </p>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                aria-label="새 비밀번호"
                autoComplete="new-password"
                required
                minLength={6}
                className={field}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="한 번 더"
                aria-label="새 비밀번호 확인"
                autoComplete="new-password"
                required
                minLength={6}
                className={field}
              />

              {message && <p className="px-2 text-sm text-brand-ink">{message}</p>}

              <button type="submit" disabled={busy} className={btn}>
                {busy ? "바꾸는 중..." : "비밀번호 바꾸기"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
