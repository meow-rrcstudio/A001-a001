// components/test-login-form.tsx
// ⚠️ 검토용 테스트 로그인 — 오픈 전에 이 파일과 사용처를 함께 지웁니다.
//
// 실제 인증이 아닙니다. 아이디·비밀번호가 코드에 그대로 있고 상태는 브라우저에만
// 저장됩니다. "유료 회원이면 어떤 화면이 보이는지"를 확인하기 위한 임시 장치입니다.
// (판단 로직은 lib/reading-entitlement.ts)
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TEST_ACCOUNTS, signInWithTestAccount } from "@/lib/reading-entitlement"

export function TestLoginForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [id, setId] = useState("")
  const [pw, setPw] = useState("")
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (signInWithTestAccount(id, pw)) {
      setError(false)
      router.push("/my")
      router.refresh()
    } else {
      setError(true)
    }
  }

  if (!open) {
    return (
      <Button
        variant="soft"
        size="pill"
        className="w-full"
        onClick={() => setOpen(true)}
        type="button"
      >
        이메일로 계속하기
      </Button>
    )
  }

  const field =
    "h-12 w-full rounded-full border border-brand-ink/25 bg-background px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-ink"

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="이메일"
        aria-label="이메일"
        autoComplete="username"
        className={field}
      />
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="비밀번호"
        aria-label="비밀번호"
        autoComplete="current-password"
        className={field}
      />
      {error && (
        <p className="px-2 text-xs text-destructive">
          아이디 또는 비밀번호가 맞지 않아요.
        </p>
      )}
      <Button variant="solid" size="pill" className="w-full" type="submit">
        로그인
      </Button>

      {/* 검토용 안내 — 오픈 전에 이 블록도 함께 삭제 */}
      <div className="rounded-2xl border border-dashed border-brand-ink/30 p-3 text-left">
        <p className="text-[11px] font-medium text-brand-ink/80">
          테스트 계정 (검토용 — 실제 로그인 아님)
        </p>
        <ul className="mt-1.5 space-y-1">
          {TEST_ACCOUNTS.map((a) => (
            <li key={a.id} className="text-[11px] leading-relaxed text-brand-ink/70">
              <button
                type="button"
                onClick={() => {
                  setId(a.id)
                  setPw(a.password)
                  setError(false)
                }}
                className="underline underline-offset-2 hover:text-brand-ink"
              >
                {a.id}
              </button>
              <span className="px-1">/</span>
              <span className="font-mono">{a.password}</span>
              <span className="px-1">—</span>
              {a.label}
            </li>
          ))}
        </ul>
      </div>
    </form>
  )
}
