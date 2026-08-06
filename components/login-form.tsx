// components/login-form.tsx
// 로그인 화면의 실제 동작 — 카카오·구글·이메일.
//
// ┌─ 시안(2026-07-30)에서 바뀐 것 ────────────────────────────────────
// │ · 이메일은 로그인과 가입이 한 흐름입니다. "가입할래요" 토글을
// │   없앴습니다 — 처음 온 사람은 자기가 가입인지 로그인인지 고르는
// │   일 자체를 하고 싶어하지 않습니다. 이메일과 비밀번호를 넣으면
// │   계정이 있으면 로그인되고, 없으면 인증 메일이 갑니다.
// │ · 비밀번호 찾기가 별도 화면에서 상태줄의 링크로 내려왔습니다.
// │ · 보내기 버튼이 없습니다. 엔터로 보냅니다 (아래 ⚠️ 참고).
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 카카오는 로그인 버튼 색을 #FEE500 으로 규정합니다. 검정으로 두는 것은
//    그 규정에서 벗어나므로, 카카오 심사 전에 한 번 확인이 필요합니다.
//    되돌릴 때는 카카오 버튼만 solidBtn 대신 bg-[#FEE500] text-black/85 로 바꾸면 됩니다.
//
// 심볼은 components/provider-marks.tsx 에 있습니다.
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleMark, KakaoMark } from "@/components/provider-marks"
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client"
import { lastAuthErrorRaw, translateAuthError } from "@/lib/auth-messages"

type Mode = "buttons" | "email"

/** 상태줄에 무엇을 띄울지 — 빨간 글씨(잘못됨)와 검은 글씨(알림)를 나눕니다 */
type Status =
  | { kind: "error"; text: string; canReset?: boolean; canResend?: boolean }
  | { kind: "info"; text: string; canResend?: boolean }
  | null

/**
 * 카카오에 요청할 동의항목.
 *
 * ⚠️ 이걸 적어주지 않으면 Supabase 가 기본값으로 이메일(account_email)과
 *    프로필 사진(profile_image)까지 함께 요청합니다. 콘솔에 설정하지 않은
 *    항목을 요청하면 카카오가 로그인 창 대신 KOE205 를 띄웁니다.
 *    (2026-07-29 에 실제로 이 조합으로 막혔습니다)
 *
 * ┌─ 이메일까지 받고 싶을 때 ─────────────────────────────────────────
 * │ 순서를 지켜야 합니다. 뒤집으면 그 자리에서 KOE205 가 납니다.
 * │   1) 카카오 개발자센터 → 카카오 로그인 → 동의항목 에서
 * │      카카오계정(이메일)을 필수 동의로 설정
 * │   2) 그 다음에 Vercel 환경변수 NEXT_PUBLIC_KAKAO_EMAIL=on → 재배포
 * │
 * │ 되돌릴 때는 이 환경변수만 지우고 재배포하면 됩니다 — 코드는 그대로.
 * └──────────────────────────────────────────────────────────────────
 */
const KAKAO_SCOPES =
  process.env.NEXT_PUBLIC_KAKAO_EMAIL === "on"
    ? "profile_nickname account_email"
    : "profile_nickname"

/**
 * 어떤 로그인 방식을 보여줄지. 기본은 보임입니다.
 *
 * ⚠️ 끄려면 Vercel 환경변수에 정확히 off 를 넣고 재배포하세요.
 *      NEXT_PUBLIC_LOGIN_KAKAO=off   ·   NEXT_PUBLIC_LOGIN_GOOGLE=off
 *    (NEXT_PUBLIC_ 은 빌드에 박히므로 값을 바꾼 뒤 재배포해야 합니다)
 *
 * ┌─ 막혔을 때 볼 곳 (둘 다 바깥 콘솔이 원인이었습니다) ──────────────
 * │ 카카오 KOE205  → 콘솔의 동의항목. 요청하는 항목이 거기 있어야 합니다.
 * │ 구글 invalid_client → Supabase 의 Client ID 가 구글에 없는 값입니다.
 * │   확인법: 구글 오류 화면 주소창의 client_id= 값을 읽어 Google Cloud
 * │   목록과 대조. 반드시 .apps.googleusercontent.com 으로 끝나야 합니다.
 * │   (2026-07-30 에 여기 클라이언트 "이름"이 들어가 있었습니다)
 * │
 * │ 양쪽 모두 Redirect URI 는 우리 도메인이 아니라 Supabase 주소입니다:
 * │   https://<프로젝트>.supabase.co/auth/v1/callback
 * └──────────────────────────────────────────────────────────────────
 */
const SHOW_KAKAO = process.env.NEXT_PUBLIC_LOGIN_KAKAO !== "off"
const SHOW_GOOGLE = process.env.NEXT_PUBLIC_LOGIN_GOOGLE !== "off"

export function LoginForm({
  next = "/my",
  /**
   * 돌아오는 길에 실패해서 붙어 온 사유 (app/login/page.tsx 가 넘겨줍니다).
   *
   * 카카오·구글 창에서 승인을 취소했거나 세션을 끼우다 막혔을 때
   * /auth/callback 이 /login?error=... 로 되돌려 보냅니다. 그 사유를
   * 받아 첫 화면에 띄웁니다 — 예전에는 아무 말 없이 로그인 화면만
   * 다시 떠서, 누른 사람은 자기가 잘못 눌렀는지조차 몰랐습니다.
   */
  notice,
  /**
   * /login?debug=1 일 때 켜집니다.
   *
   * 못 옮긴 사유의 원문을 화면에 덧붙입니다. 콘솔을 열 수 없는 손전화에서
   * "왜 잠시 문제가 생겼다고만 뜨는지"를 확인하려고 둔 것입니다.
   * 평소에는 꺼져 있으니 사용자 눈에 영어가 새지 않습니다.
   */
  debug = false,
}: {
  next?: string
  notice?: string
  debug?: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("buttons")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(
    notice ? { kind: "error", text: notice } : null,
  )

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function signInWith(provider: "kakao" | "google") {
    const supabase = getSupabaseBrowser()
    if (!supabase) return setStatus({ kind: "error", text: "아직 로그인 설정이 안 되어 있어요." })
    setBusy(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // 돌아올 자리. 지금 보고 있는 주소 기준이라 미리보기에서도 맞습니다.
        redirectTo: redirectTo(),
        ...(provider === "kakao" ? { scopes: KAKAO_SCOPES } : {}),
      },
    })
    if (error) {
      setBusy(false)
      setStatus({ kind: "error", text: translateAuthError(error.message, error.code) })
    }
    // 성공하면 이 창이 그대로 공급자 화면으로 넘어갑니다 (busy 유지)
  }

  /**
   * 이메일 — 로그인과 가입이 한 번에.
   *
   * ┌─ 어떻게 가르는가 ─────────────────────────────────────────────
   * │ 1) 먼저 로그인을 해봅니다. 되면 끝입니다.
   * │ 2) "자격 증명이 틀렸다"고 하면 두 가지 중 하나입니다 —
   * │    비밀번호가 틀렸거나, 계정이 아예 없거나. Supabase 는 둘을
   * │    구분해 주지 않습니다(일부러 그렇습니다. 구분해 주면 아무
   * │    주소나 넣어보며 누가 가입했는지 알아낼 수 있습니다).
   * │ 3) 그래서 가입을 시도해 봅니다. 이미 있는 계정이면 그때 알 수
   * │    있고, 없으면 인증 메일이 나갑니다.
   * │
   * │ ⚠️ 이미 있는 계정인지 아는 방법이 두 가지입니다. Supabase 설정에
   * │    따라 어느 쪽으로 오는지가 달라서 둘 다 봅니다:
   * │      · 오류 메시지에 "already registered"
   * │      · 오류 없이 user.identities 가 빈 배열
   * │    (뒤엣것은 이메일 열거 방지가 켜져 있을 때의 신호입니다)
   * └───────────────────────────────────────────────────────────────
   */
  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowser()
    if (!supabase) return setStatus({ kind: "error", text: "아직 로그인 설정이 안 되어 있어요." })
    if (!email.trim() || !password) return

    setBusy(true)
    setStatus(null)

    // ⚠️ 시간 제한이 꼭 필요합니다. 답이 안 오면 화면이 아무 말 없이
    //    멈춰 있고, 사용자는 무엇을 해야 할지 알 수 없습니다.
    const signIn = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
    )

    if (signIn === "timeout") {
      setBusy(false)
      return setStatus({ kind: "error", text: "응답이 없어요. 잠시 뒤 다시 시도해 주세요." })
    }

    if (!signIn.error) {
      router.push(next)
      router.refresh()
      return
    }

    // 자격 증명 문제가 아니면(예: 메일 인증 전) 그 사유를 그대로 알립니다.
    //
    // ⚠️ 영어 문구만 보고 가르면 안 됩니다. Supabase 가 판을 올리면서
    //    문구를 바꾸면 이 갈림길이 어긋나고, 비밀번호가 틀린 사람이
    //    가입 시도까지 못 가서 FALLBACK("잠시 문제가 생겼어요")을 봅니다.
    //    "비밀번호가 맞지 않아요"라고 말해줄 수 있는데 말이죠.
    //    그래서 잘 안 바뀌는 code 를 먼저 보고, 문구는 보조로만 씁니다.
    const wrongCredentials =
      signIn.error.code === "invalid_credentials" ||
      /invalid login credentials/i.test(signIn.error.message)

    if (!wrongCredentials) {
      setBusy(false)

      // ⚠️ 아직 메일 인증을 안 한 계정입니다. 여기서 사유만 말하고 끝내면
      //    사람이 갇힙니다 — 메일이 스팸함에 들어갔거나 지워졌으면 다시
      //    받을 길이 화면에 하나도 없습니다. (가입 직후 한 번은 재전송
      //    단추가 보이지만, 새로고침하거나 다시 로그인하면 이 갈래로
      //    빠져서 단추가 사라졌습니다 — 실제로 그렇게 막혔습니다)
      const notConfirmed =
        signIn.error.code === "email_not_confirmed" ||
        /email not confirmed/i.test(signIn.error.message)

      return setStatus({
        kind: "error",
        text: translateAuthError(signIn.error.message, signIn.error.code),
        canResend: notConfirmed,
      })
    }

    // 여기부터는 "비밀번호가 틀렸거나 계정이 없거나" — 가입을 시도해 봅니다.
    const signUp = await withTimeout(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo() },
      }),
    )

    setBusy(false)

    if (signUp === "timeout") {
      return setStatus({ kind: "error", text: "응답이 없어요. 잠시 뒤 다시 시도해 주세요." })
    }

    const already =
      signUp.error?.code === "user_already_exists" ||
      signUp.error?.code === "email_exists" ||
      (signUp.error && /already registered|already been registered/i.test(signUp.error.message)) ||
      (!signUp.error && signUp.data.user?.identities?.length === 0)

    if (already) {
      return setStatus({
        kind: "error",
        text: "비밀번호가 맞지 않아요.",
        canReset: true,
      })
    }

    if (signUp.error) {
      return setStatus({ kind: "error", text: translateAuthError(signUp.error.message, signUp.error.code) })
    }

    // 메일 확인을 꺼 두었다면 가입과 동시에 로그인됩니다.
    if (signUp.data.session) {
      router.push(next)
      router.refresh()
      return
    }

    setStatus({
      kind: "info",
      text: "입력한 이메일로 인증 메일이 전송되었어요.",
      canResend: true,
    })
  }

  /**
   * 비밀번호 재설정 메일.
   *
   * ⚠️ 없는 계정이어도 "보냈어요"라고 답합니다. "그런 계정 없습니다"는
   *    친절해 보이지만, 아무 주소나 넣어보며 누가 가입했는지 알아내는
   *    길이 됩니다. 메일함을 여는 사람만 결과를 알면 됩니다.
   */
  async function sendReset() {
    const supabase = getSupabaseBrowser()
    if (!supabase || !email.trim()) return

    setBusy(true)
    const result = await withTimeout(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        // 메일의 링크를 누르면 여기로 돌아오고, callback 이 세션을 끼운 뒤
        // 새 비밀번호를 정하는 화면으로 보냅니다.
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }),
    )
    setBusy(false)

    if (result === "timeout") {
      return setStatus({ kind: "error", text: "응답이 없어요. 잠시 뒤 다시 시도해 주세요." })
    }
    // 너무 자주 보내면 Supabase 가 막습니다 — 그건 알려줘야 합니다.
    if (result.error && /rate limit|for security purposes|too many/i.test(result.error.message)) {
      return setStatus({ kind: "error", text: translateAuthError(result.error.message, result.error.code) })
    }
    setStatus({ kind: "info", text: "비밀번호를 새로 정하는 링크를 보냈어요." })
  }

  /** 인증 메일 다시 보내기 */
  async function resendSignup() {
    const supabase = getSupabaseBrowser()
    if (!supabase || !email.trim()) return

    setBusy(true)
    const result = await withTimeout(
      supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: redirectTo() },
      }),
    )
    setBusy(false)

    // ⚠️ 재전송이 실패해도 단추를 남깁니다. 가장 흔한 실패는 "너무 자주
    //    보냈어요"(1분에 한 번)인데, 그때 단추가 사라지면 잠시 뒤에 다시
    //    누를 방법이 없어집니다.
    if (result === "timeout") {
      return setStatus({
        kind: "error",
        text: "응답이 없어요. 잠시 뒤 다시 시도해 주세요.",
        canResend: true,
      })
    }
    if (result.error) {
      return setStatus({
        kind: "error",
        text: translateAuthError(result.error.message, result.error.code),
        canResend: true,
      })
    }
    setStatus({ kind: "info", text: "인증 메일을 다시 보냈어요.", canResend: true })
  }

  // 시안: 각진 버튼. 모서리를 둥글리지 않습니다.
  const btnBase =
    "flex h-13 w-full items-center justify-center gap-2.5 px-5 text-[15px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
  const solidBtn = `${btnBase} bg-brand-ink text-white`
  const softBtn = `${btnBase} bg-brand-lime-soft text-brand-ink`

  /** 시안: 흰 칸 + 얇은 검정 테두리. 틀렸을 때만 빨강으로 */
  const field = (invalid = false) =>
    `h-13 w-full border bg-white px-4 text-[15px] text-brand-ink outline-none placeholder:text-brand-ink/40 ${
      invalid ? "border-red-500" : "border-brand-ink/70 focus:border-brand-ink"
    }`

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-5">
        <p className="bg-brand-ink/10 px-5 py-4 text-center text-sm text-brand-ink">
          로그인 설정이 아직 없어요. (환경변수를 넣고 다시 배포해 주세요)
        </p>
        <Consent />
      </div>
    )
  }

  if (mode === "email") {
    const invalid = status?.kind === "error"

    return (
      <div className="space-y-5">
        {/* ⚠️ 시안에 보내기 버튼이 없습니다 — 키보드 엔터로 보냅니다.
            눈에 보이는 버튼을 넣지 않는 대신, 화면읽개와 키보드만 쓰는
            사람을 위해 sr-only 제출 버튼을 둡니다. 버튼을 다시 세우려면
            아래 sr-only 를 solidBtn 으로 바꾸면 됩니다. */}
        <form onSubmit={submitEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            aria-label="이메일"
            autoComplete="email"
            enterKeyHint="next"
            required
            autoFocus
            className={field()}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            aria-label="비밀번호"
            autoComplete="current-password"
            enterKeyHint="go"
            required
            minLength={6}
            className={field(invalid)}
          />

          <button type="submit" disabled={busy} className="sr-only">
            {busy ? "잠시만요..." : "계속하기"}
          </button>
        </form>

        {/* 상태줄 — 무슨 일이 있었는지, 그리고 무엇을 할 수 있는지.
            ⚠️ 오류일 때 길을 반드시 함께 냅니다. 예전에는 사유만 말하고
               끝나는 갈래가 여럿이었습니다 — 인증 전 계정으로 로그인,
               메일 발송이 너무 잦아 막힌 경우 등. 그때 화면에는 빨간
               글씨만 남고 누를 것이 하나도 없어서, 사람이 그 자리에
               갇혔습니다. (실제로 그렇게 막혔습니다)

               그래서 "어떤 오류에는 어떤 단추"를 하나하나 정하지 않고,
               이메일이 적혀 있으면 두 길을 늘 냅니다. 둘 다 눌러도
               해롭지 않고, 하나라도 있으면 갇히지 않습니다. */}
        {status && (
          <div className="flex flex-col gap-2">
            <p className={status.kind === "error" ? "text-xs text-red-600" : "text-xs text-brand-ink/80"}>
              {status.text}
            </p>

            {email.trim() && (status.kind === "error" || status.canResend) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <button
                  type="button"
                  onClick={resendSignup}
                  disabled={busy}
                  className="whitespace-nowrap text-brand-ink underline underline-offset-4 disabled:opacity-50"
                >
                  인증 메일 다시 받기
                </button>
                <button
                  type="button"
                  onClick={sendReset}
                  disabled={busy}
                  className="whitespace-nowrap text-brand-ink underline underline-offset-4 disabled:opacity-50"
                >
                  비밀번호 찾기
                </button>
              </div>
            )}
          </div>
        )}

        <DebugLine show={debug} />
        <Consent />
      </div>
    )
  }

  return (
    <div className="space-y-5">
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

        {/* 이메일은 보조 — 연라임 바탕에 검정 글씨 (시안).
            셋 다 감춰졌을 때만 유일한 길이라 검정으로 올립니다. */}
        <button
          type="button"
          onClick={() => {
            setMode("email")
            setStatus(null)
          }}
          className={SHOW_KAKAO || SHOW_GOOGLE ? softBtn : solidBtn}
        >
          이메일로 계속하기
        </button>
      </div>

      {status && (
        <p
          className={`text-center text-xs ${
            status.kind === "error" ? "text-red-600" : "text-brand-ink/80"
          }`}
        >
          {status.text}
        </p>
      )}

      <Consent />
    </div>
  )
}

/**
 * 못 옮긴 사유의 원문 (/login?debug=1 일 때만).
 *
 * ⚠️ 평소에는 절대 그리지 않습니다. 영어 원문은 읽는 사람에게 아무
 *    정보가 아니고("Invalid login credentials"), 우리 속사정만 드러냅니다.
 *    고칠 때만 잠깐 켜는 창입니다.
 */
function DebugLine({ show }: { show: boolean }) {
  const raw = show ? lastAuthErrorRaw() : null
  if (!raw) return null
  return (
    <p className="border border-red-500/40 bg-white/60 px-3 py-2 text-center font-mono text-[11px] break-all text-red-700">
      {raw}
    </p>
  )
}

/**
 * 동의 고지.
 *
 * 세 버튼 모두 그 자체가 가입 행위라 체크박스로 막지 않고 한 줄로 알립니다.
 * 이용약관 머리말이 "회원가입을 하면 동의한 것으로 본다"고 정하는데, 그 말을
 * 어디에서도 보여주지 않으면 동의를 받았다고 하기 어렵습니다.
 *
 * ⚠️ 링크 이름은 문서의 실제 제목과 같아야 합니다. 시안에는 "사용정책 ·
 *    개인정보보호정책"으로 적혀 있었지만, 눌러서 도착하는 페이지 제목은
 *    "이용약관 · 개인정보처리방침"입니다. 이름이 어긋나면 다른 문서가
 *    있는 줄 압니다.
 */
function Consent() {
  const link = "underline underline-offset-2 hover:text-brand-ink"
  return (
    // break-keep: 한국어는 단어 중간에서 끊으면 안 됩니다. 이게 없으면
    // "개인정 / 보처리방침"처럼 낱말이 두 줄로 쪼개집니다.
    <p className="text-center text-xs leading-relaxed break-keep text-brand-ink/70">
      계속하시면 Meow RRC Studio의{" "}
      <Link href="/terms" className={link}>
        이용약관
      </Link>
      에 동의하고{" "}
      <Link href="/privacy" className={link}>
        개인정보처리방침
      </Link>
      을 인정하는 것입니다.
    </p>
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
