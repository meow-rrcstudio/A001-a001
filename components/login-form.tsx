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

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleMark, KakaoMark } from "@/components/provider-marks"
import { LoginHelp } from "@/components/login-help"
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client"
import { lastAuthErrorRaw, retryAfterSeconds, translateAuthError } from "@/lib/auth-messages"
import { QuestionMark } from "@/components/icon-question"
import { PASSWORD_RULE_TEXT, passwordMeetsPolicy } from "@/lib/password-policy"

type Mode = "buttons" | "email"

/**
 * 상태줄에 놓을 수 있는 길.
 *
 * ⚠️ 이름이 곧 "누르면 실제로 일어나는 일"이어야 합니다. 예전에 두었던
 *    "다시 시도"는 무엇을 다시 하는지(로그인인지 메일인지) 알 수 없어서
 *    지웠습니다.
 */
type Action = "resend" | "reset" | "retryLogin"

const ACTION_LABEL: Record<Action, string> = {
  resend: "재전송",
  reset: "비밀번호 찾기",
  retryLogin: "다시 로그인",
}

/** 상태줄에 무엇을 띄울지 — 빨간 글씨(잘못됨)와 검은 글씨(알림)를 나눕니다 */
type Status = {
  kind: "error" | "info"
  /** 문구. 줄을 나눠 쓸 수 있습니다 (시안 5·10·11번) */
  lines: string[]
  /** 낼 길. 왼쪽부터 이 순서로 놓입니다 */
  actions?: Action[]
  /**
   * 재전송이 다시 가능해지는 시각(ms).
   *
   * 있으면 `남은시간 00:59` 를 세고, 그동안 재전송 단추를 흐립니다.
   * 값은 두 곳에서 옵니다 — 우리가 보낸 직후에는 60초(대시보드의
   * "사용자별 최소 간격"과 같은 값), 서버가 "after 43 seconds" 라고
   * 알려주면 그 숫자. 서버 말이 언제나 우선입니다.
   */
  waitUntil?: number
  /** 오류를 알릴 때 붙이는 꼬리표 — 문의할 때 이 값을 불러주면 됩니다 */
  code?: string
  /**
   * 물음표(?)를 낼지.
   *
   * ⚠️ 모든 케이스에 달지 않습니다. 시안이 그렇습니다 — 물음표는
   *    "왜 이러는지 설명이 필요한 자리"에만 답니다. 비밀번호가 틀린
   *    것처럼 뜻이 분명한 자리에까지 달면, 물음표가 그냥 장식이 되어
   *    정작 필요한 자리에서 눈에 안 들어옵니다.
   */
  help?: boolean
} | null

/**
 * 같은 사람에게 메일을 다시 보낼 수 있게 되기까지.
 *
 * ⚠️ Supabase 대시보드의 **사용자별 최소 간격**과 같은 값이어야 합니다
 *    (Authentication → Rate Limits). 거기를 바꾸면 여기도 바꾸세요 —
 *    화면이 0 초라고 하는데 서버가 막으면 그게 제일 나쁩니다.
 *    다만 서버가 남은 초를 알려줄 때는 그 값을 씁니다.
 */
const RESEND_COOLDOWN_SEC = 60

/**
 * 남은시간 **숫자만**의 고정 너비 (시안 실측 42px).
 *
 * ⚠️ 이 상자와 물음표 사이는 **0** 입니다 (시안). 시안의 12 는 이 상자
 *    다음에 오는 **물음표 자신의 폭**이지 사이 여백이 아닙니다. 여백으로
 *    잘못 읽고 12 를 띄우면 물음표가 그만큼 오른쪽으로 밀려납니다.
 *
 * ⚠️ "남은시간 00:00" 전체가 아니라 "00:00" 에만 겁니다. 전체에 걸면
 *    글씨가 이미 그보다 넓어서 아무 일도 일어나지 않습니다.
 *
 * ⚠️ 고정하지 않으면 자릿수가 바뀔 때마다 뒤의 물음표가 좌우로
 *    흔들립니다. tabular-nums 는 숫자 폭을 서로 같게 맞춥니다.
 */
const TIMER_WIDTH = "42px"

/** 오류가 이어질 때 알릴 곳 (시안 10·11번) */
const SUPPORT_EMAIL = "hello@soulseoul.xyz"

/** 문의용 꼬리표. 영어 사유를 그대로 보이지 않으면서 어디가 막혔는지 남깁니다 */
function errorTag(code?: string | null, status?: number): string | undefined {
  const parts = [status, code].filter(Boolean)
  return parts.length ? `(${parts.join("·")})` : undefined
}

/**
 * 지금부터 seconds 초 뒤의 시각.
 *
 * ⚠️ 컴포넌트 안에서 Date.now() 를 직접 부르지 않습니다. 그리는 동안
 *    시계를 읽으면 같은 상태인데 그릴 때마다 값이 달라져서, React
 *    컴파일러가 막습니다(Cannot call impure function). 시계는 이 두
 *    함수 안에서만 읽고, 화면은 그 결과를 상태로 들고 있습니다.
 */
function cooldownUntil(seconds: number = RESEND_COOLDOWN_SEC): number {
  return Date.now() + seconds * 1000
}

/** 그 시각까지 남은 초 (지났으면 0) */
function secondsLeft(until?: number): number {
  return until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
}

/** 00:59 */
function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

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
    notice ? { kind: "error", lines: [notice] } : null,
  )
  const [helpOpen, setHelpOpen] = useState(false)

  // 남은 초. 상태를 바꿀 때 한 번 정하고(show), 그 뒤로는 시계가 깎습니다.
  //
  // ⚠️ setInterval 안의 setState 는 효과 "본문"이 아니라 콜백이라
  //    react-hooks/set-state-in-effect 에 걸리지 않습니다.
  const [waitLeft, setWaitLeft] = useState(0)
  const waitUntil = status?.waitUntil
  useEffect(() => {
    if (!waitUntil) return
    const id = setInterval(() => setWaitLeft(secondsLeft(waitUntil)), 250)
    return () => clearInterval(id)
  }, [waitUntil])

  /**
   * 상태줄을 바꿉니다.
   *
   * ⚠️ setStatus 를 직접 부르지 마세요. 남은 초를 함께 맞춰야 하는데,
   *    한 군데서라도 빠뜨리면 그 갈래만 타이머가 안 돕니다 — 갈래마다
   *    손으로 챙기다 빠뜨려서 사람이 갇혔던 일이 이미 있었습니다.
   */
  function show(next: Status) {
    setStatus(next)
    setWaitLeft(secondsLeft(next?.waitUntil))
  }

  function runAction(action: Action) {
    if (action === "resend") return void resendSignup()
    if (action === "reset") return void sendReset()
    return void runEmailFlow()
  }

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  /** 어느 소셜 단추에서 막혔는지 — 사유를 그 단추 아래에 붙입니다 (시안) */
  const [failedProvider, setFailedProvider] = useState<"kakao" | "google" | null>(null)

  async function signInWith(provider: "kakao" | "google") {
    const supabase = getSupabaseBrowser()
    if (!supabase) return show({ kind: "error", lines: ["아직 로그인 설정이 안 되어 있어요."] })
    setBusy(true)
    show(null)
    setFailedProvider(null)
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
      // ⚠️ 사유를 화면 아래가 아니라 "누른 단추 바로 밑"에 답니다.
      //    카카오가 막혔는데 사유가 저 아래 있으면 구글 이야기인지
      //    카카오 이야기인지 알 수 없습니다.
      setFailedProvider(provider)
      show({
        kind: "error",
        lines: [translateAuthError(error.message, error.code, error.status)],
      })
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
    await runEmailFlow()
  }

  async function runEmailFlow() {
    const supabase = getSupabaseBrowser()
    if (!supabase) return show({ kind: "error", lines: ["아직 로그인 설정이 안 되어 있어요."] })
    if (!email.trim() || !password) return

    setBusy(true)
    show(null)

    // ⚠️ 시간 제한이 꼭 필요합니다. 답이 안 오면 화면이 아무 말 없이
    //    멈춰 있고, 사용자는 무엇을 해야 할지 알 수 없습니다.
    const signIn = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
    )

    if (signIn === "timeout") {
      setBusy(false)
      return show(noAnswer(["retryLogin"]))
    }

    if (!signIn.error) {
      // ⚠️ 여기서 바로 넘기지 않고 한 마디 합니다. 화면이 바뀌기까지
      //    한 박자가 있는데, 그 사이가 비어 있으면 "눌렸나?" 싶습니다.
      show({ kind: "info", lines: ["다시 만나서 반가워요!", "로그인 중이에요…"] })
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

      if (notConfirmed) {
        return show({
          kind: "error",
          // ⚠️ 여기에는 타이머를 걸지 않습니다. 이 화면에 온 사람은 마지막
          //    발송으로부터 이미 한참 지났을 수 있는데, 들어오자마자 60초를
          //    세면 누를 수 있는 것을 못 누르게 막는 셈입니다. 눌러보고
          //    서버가 막으면 그때부터 셉니다 (failure 가 남은 초를 받습니다).
          lines: ["인증이 완료되지 않았어요.", "메일함에서 인증 링크를 먼저 눌러주세요."],
          actions: ["resend"],
          help: true,
        })
      }
      return show(failure(signIn.error, ["retryLogin", "reset"]))
    }

    // 여기부터는 "비밀번호가 틀렸거나 계정이 없거나" — 가입을 시도해 봅니다.
    //
    // ⚠️ 시안에는 이 자리에 "가입되지 않은 계정이에요"가 적혀 있었는데
    //    뺐습니다. 이 시점에는 계정이 있는지 없는지 **아직 모릅니다** —
    //    있으면 바로 아래에서 "비밀번호가 맞지 않아요"로 갈라집니다.
    //    모르는 것을 단정해서 말하면, 비밀번호를 틀린 사람에게 잠깐
    //    "너는 가입한 적 없다"고 말하는 셈이 됩니다.
    show({ kind: "info", lines: ["가입 인증 메일을 보내는 중이에요…"] })

    // 새로 계정을 만드는 자리이므로 여기서만 비밀번호 조건을 봅니다.
    // 로그인에는 보지 않습니다 — 옛 계정이 지금 조건을 안 지날 수 있고,
    // 그때 막으면 자기 계정에 못 들어갑니다.
    if (!passwordMeetsPolicy(password)) {
      setBusy(false)
      return show({ kind: "error", lines: [PASSWORD_RULE_TEXT] })
    }

    const signUp = await withTimeout(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo() },
      }),
    )

    setBusy(false)

    if (signUp === "timeout") {
      return show(noAnswer(["retryLogin"]))
    }

    const already =
      signUp.error?.code === "user_already_exists" ||
      signUp.error?.code === "email_exists" ||
      (signUp.error && /already registered|already been registered/i.test(signUp.error.message)) ||
      (!signUp.error && signUp.data.user?.identities?.length === 0)

    // 여기까지 왔다는 것은 계정이 있다는 뜻입니다. 그러니 "이메일이나
    // 비밀번호가"가 아니라 비밀번호 하나만 짚어 말할 수 있습니다.
    if (already) {
      return show({
        kind: "error",
        lines: ["비밀번호가 맞지 않아요."],
        actions: ["reset"],
      })
    }

    if (signUp.error) {
      return show(failure(signUp.error, ["retryLogin"]))
    }

    // 메일 확인을 꺼 두었다면 가입과 동시에 로그인됩니다.
    if (signUp.data.session) {
      show({ kind: "info", lines: ["다시 만나서 반가워요!", "로그인 중이에요…"] })
      router.push(next)
      router.refresh()
      return
    }

    show({
      kind: "info",
      lines: [
        // ⚠️ "가입되지 않은 계정"이라고 말할 수 있는 자리는 여기뿐입니다.
        //    누르기 전에는 계정이 있는지 없는지 알 수 없고, 여기까지
        //    왔다는 것은 실제로 새 계정이 만들어졌다는 뜻입니다.
        "가입되지 않은 이메일이라 새로 가입했어요.",
        "입력한 이메일로 인증 메일이 전송되었어요.",
        // ⚠️ 이메일 오타를 잡을 수 있는 자리도 여기뿐입니다. 주소를
        //    잘못 치면 그 주소로 계정이 만들어지고 메일은 남의 집으로
        //    갑니다 — 화면에는 아무 이상이 없어 보입니다.
        "메일이 오지 않으면 주소를 다시 확인해 주세요.",
      ],
      actions: ["resend"],
      waitUntil: cooldownUntil(),
      help: true,
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

    // ⚠️ 누르는 즉시 말합니다. 메일 보내기는 몇 초 걸릴 수 있는데, 그동안
    //    화면이 그대로면 "눌러도 아무 반응이 없다"가 됩니다 — 실제로
    //    그렇게 보였습니다.
    show({ kind: "info", lines: ["메일을 보내는 중이에요…"] })
    setBusy(true)
    const result = await withTimeout(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        // 메일의 링크를 누르면 여기로 돌아오고, callback 이 세션을 끼운 뒤
        // 새 비밀번호를 정하는 화면으로 보냅니다.
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }),
    )
    setBusy(false)

    if (result === "timeout") return show(noAnswer(["reset"]))

    // ⚠️ 실패를 삼키지 않습니다. 예전에는 "너무 자주 보냈다"만 알리고 그
    //    밖의 오류(메일 서버 문제 등)에는 "보냈어요"라고 답했습니다.
    //    오지 않는 메일을 기다리게 하는 것이 제일 나쁩니다.
    //
    // ⚠️ 다만 "그런 계정 없습니다"는 여전히 말하지 않습니다 — Supabase 도
    //    없는 계정에 오류를 주지 않습니다. 아무 주소나 넣어보며 누가
    //    가입했는지 알아내는 길이 되기 때문입니다.
    if (result.error) return show(failure(result.error, ["reset"]))

    show({
      kind: "info",
      lines: ["비밀번호를 새로 정하는 링크를 메일로 보냈어요."],
      actions: ["reset"],
      waitUntil: cooldownUntil(),
      help: true,
    })
  }

  /** 인증 메일 다시 보내기 */
  async function resendSignup() {
    const supabase = getSupabaseBrowser()
    if (!supabase || !email.trim()) return

    show({ kind: "info", lines: ["메일을 보내는 중이에요…"], actions: ["resend"] })
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
    if (result === "timeout") return show(noAnswer(["resend"]))
    if (result.error) return show(failure(result.error, ["resend"]))

    show({
      kind: "info",
      lines: ["인증 메일을 다시 보냈어요."],
      actions: ["resend"],
      waitUntil: cooldownUntil(),
      help: true,
    })
  }

  /** 답이 아예 없을 때 (시안 11번) */
  function noAnswer(actions: Action[]): Status {
    return {
      kind: "error",
      lines: [
        "잠시 장애가 있었어요. 잠시 뒤 다시 시도해 주세요.",
        `오류가 계속되면 ${SUPPORT_EMAIL} 로 알려주세요.`,
      ],
      actions,
      code: "(timeout)",
    }
  }

  /**
   * 실패를 상태줄로 옮깁니다.
   *
   * 한 곳에서 만드는 까닭 — 갈래마다 손으로 적으면 어느 갈래에서는
   * 길을 안 내고, 어느 갈래에서는 꼬리표를 빠뜨립니다. 실제로 그렇게
   * 사람이 갇혔던 자리가 넷이었습니다.
   */
  function failure(
    error: { message: string; code?: string; status?: number },
    actions: Action[],
  ): Status {
    const text = translateAuthError(error.message, error.code, error.status)
    const wait = retryAfterSeconds(error.message)

    // 발송 간격에 걸린 것은 "오류"라기보다 "잠깐 기다리는 일"입니다.
    // 남은 초를 세어주면 사람이 화면을 떠나지 않습니다.
    const rateLimited =
      wait !== null ||
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"

    if (rateLimited) {
      return {
        kind: "error",
        lines: ["메일을 너무 자주 보냈어요."],
        actions,
        waitUntil: cooldownUntil(wait ?? RESEND_COOLDOWN_SEC),
        help: true,
      }
    }

    // 서버가 답을 못 하는 갈래에는 어디로 알릴지까지 적습니다.
    const serverSide = (error.status ?? 0) >= 500
    return {
      kind: "error",
      lines: serverSide ? [text, `오류가 계속되면 ${SUPPORT_EMAIL} 로 알려주세요.`] : [text],
      actions,
      code: errorTag(error.code, error.status),
      // 메일이 안 나가는 것은 설명이 필요한 자리입니다 (우리 쪽 설정 문제).
      help: /메일/.test(text),
    }
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

    // ┌─ 시안 실측 (2026-08, 5번 화면에서 세로로 훑은 값) ───────────────
    // │ 돌 상자 80×80 → 20 → [이메일 칸] → 8 → [비밀번호 칸] → 8 → 문구
    // │ → 8 → 길(재전송…) → 24 → 동의 고지(두 줄 32) → 24 → 화면 아래
    // │ 좌우는 24 (이 화면을 감싸는 app/login/page.tsx 의 px-6)
    // │
    // │ 상태줄 안쪽: 재전송 37 · 4 · 남은시간 49 · 숫자 42 · 12 · 물음표 12
    // └──────────────────────────────────────────────────────────────────
    return (
      <div>
        {/* ⚠️ 시안에 보내기 버튼이 없습니다 — 키보드 엔터로 보냅니다.
            눈에 보이는 버튼을 넣지 않는 대신, 화면읽개와 키보드만 쓰는
            사람을 위해 sr-only 제출 버튼을 둡니다. 버튼을 다시 세우려면
            아래 sr-only 를 solidBtn 으로 바꾸면 됩니다. */}
        {/* ⚠️ space-y-2 가 아니라 flex gap-2 입니다. space-y 는 아래의
            sr-only 제출 버튼(눈에 안 보이는 것)에까지 8px 을 물려서, 폼
            상자가 비밀번호 칸보다 8 더 길어져 있었습니다. 그만큼 문구가
            칸에서 16 떨어져 보였습니다 — 시안은 8 입니다.
            flex 에서는 자리를 뜬(absolute) 것에 gap 이 걸리지 않습니다. */}
        <form onSubmit={submitEmail} className="flex flex-col gap-2">
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

        {/* 상태줄 (시안 2026-08 — 케이스 12가지).

            ┌─ 배치 규칙 (시안 5·10번) ────────────────────────────────
            │ · 타이머가 있으면  → 문구 아래 새 줄에 왼쪽 정렬
            │                      [재전송] [남은시간 00:59] [?]
            │ · 타이머가 없으면  → 물음표는 문구 **첫 줄** 오른쪽 끝,
            │                      길(재전송·비밀번호 찾기)은 문구 아래
            │                      새 줄에 왼쪽 정렬
            └─────────────────────────────────────────────────────────

            ⚠️ 오류일 때 길을 반드시 함께 냅니다. 예전에는 사유만 말하고
               끝나는 갈래가 여럿이었습니다 — 인증 전 계정으로 로그인,
               메일 발송이 잦아 막힌 경우, 응답 없음 등. 그때 화면에는
               빨간 글씨만 남고 누를 것이 하나도 없어서 사람이 갇혔습니다.

            ⚠️ 물음표를 여기 둡니다. 예전에는 동의 고지 아래에 달았는데
               푸터처럼 보여서, 정작 궁금해지는 순간에 눈이 안 갔습니다. */}
        <StatusRow
          status={status}
          waitLeft={waitLeft}
          busy={busy}
          onAction={runAction}
          onHelp={() => setHelpOpen(true)}
        />

        {/* ⚠️ 시안 실측 24 입니다 (예전에 80 으로 두었던 자리).
            시안의 긴 80 은 상태줄에서 키보드 윗변까지 통째로 잰 것이라,
            그 안이 24(사이) + 32(고지 두 줄) + 24(사이) 로 나뉩니다.
            80 을 그대로 사이 여백에 쓰면 아래가 세 배로 벌어지고 칸이
            화면 위로 밀려 올라갑니다. */}
        <div className="mt-6">
          <DebugLine show={debug} />
          <Consent />
        </div>

        <LoginHelp open={helpOpen} onOpenChange={setHelpOpen} />
      </div>
    )
  }

  return (
    // ⚠️ mt-5 는 돌과의 사이를 40px 로 만드는 몫입니다. 페이지 쪽 여백이
    //    20px 이고(이메일 화면 시안), 이 화면만 20px 을 더합니다.
    <div className="mt-5 space-y-5">
      {/* ⚠️ 카카오·구글에서 되돌아오다 실패한 사유는 어느 단추에서 났는지
             알 수 없습니다 (/login?error= 에 공급자가 실리지 않습니다).
             그것만 단추 위에 둡니다. */}
      <ProviderNotice show={failedProvider === null} status={status} />

      <div className="space-y-3">
        {SHOW_KAKAO && (
          <>
            <button type="button" disabled={busy} onClick={() => signInWith("kakao")} className={solidBtn}>
              <KakaoMark />
              카카오로 계속하기
            </button>
            <ProviderNotice show={failedProvider === "kakao"} status={status} />
          </>
        )}

        {SHOW_GOOGLE && (
          <>
            <button type="button" disabled={busy} onClick={() => signInWith("google")} className={solidBtn}>
              <GoogleMark />
              Google로 계속하기
            </button>
            <ProviderNotice show={failedProvider === "google"} status={status} />
          </>
        )}

        {/* 이메일은 보조 — 연라임 바탕에 검정 글씨 (시안).
            셋 다 감춰졌을 때만 유일한 길이라 검정으로 올립니다. */}
        <button
          type="button"
          onClick={() => {
            setMode("email")
            show(null)
          }}
          className={SHOW_KAKAO || SHOW_GOOGLE ? softBtn : solidBtn}
        >
          이메일로 계속하기
        </button>
      </div>

      <div className="space-y-3">
        <Consent />
        <p className="text-center">
          <LoginHelp open={helpOpen} onOpenChange={setHelpOpen} withTrigger />
        </p>
      </div>
    </div>
  )
}

/**
 * 상태줄 한 덩어리.
 *
 * ┌─ 왜 따로 뺐는가 ──────────────────────────────────────────────────
 * │ 케이스가 열두 가지가 되면서, 폼 안에 그대로 두면 "어떤 오류에 어떤
 * │ 단추"를 또 갈래마다 손으로 적게 됩니다. 그러다 한 갈래를 빠뜨리면
 * │ 그 갈래에 걸린 사람이 갇힙니다 — 실제로 넷이 그랬습니다.
 * │ 무엇을 보여줄지는 Status 하나가 정하고, 여기서는 그리기만 합니다.
 * └──────────────────────────────────────────────────────────────────
 */
function StatusRow({
  status,
  waitLeft,
  busy,
  onAction,
  onHelp,
}: {
  status: Status
  waitLeft: number
  busy: boolean
  onAction: (action: Action) => void
  onHelp: () => void
}) {
  if (!status) return null

  const timed = Boolean(status.waitUntil)

  /**
   * 아직 세고 있는가.
   *
   * ┌─ 이 한 줄이 두 가지를 뒤집습니다 (시안) ─────────────────────────
   * │ 세는 중 (00:59) → 재전송 흐림   · 남은시간·숫자 또렷
   * │ 다 셌음 (00:00) → 재전송 또렷   · 남은시간·숫자 흐림
   * └──────────────────────────────────────────────────────────────────
   *
   * 흐린 쪽이 늘 "지금 손댈 것이 아닌 쪽"입니다. 기다리는 동안에는
   * 남은 초가 읽어야 할 값이고, 다 세고 나면 그 숫자는 할 일을 마쳐서
   * 물러나고 누를 수 있게 된 재전송이 앞으로 나옵니다.
   *
   * ⚠️ 둘을 따로 정하지 마세요. 한쪽만 고치면 둘 다 또렷하거나 둘 다
   *    흐린 순간이 생기고, 그때 화면은 무엇을 하라는 말인지 잃습니다.
   */
  const counting = waitLeft > 0

  // 시안 실측: 14px · weight 400 · 밑줄. 오류 빨강은 #EF2B2A 입니다
  // (디자인 토큰 --product-colors-warning-red-500). Tailwind 의 red-600
  // 과 미세하게 달라서 값을 그대로 적습니다.
  const link =
    "whitespace-nowrap text-sm font-normal text-brand-ink underline underline-offset-4 disabled:opacity-40"

  const actions = (status.actions ?? []).map((action) => (
    <button
      key={action}
      type="button"
      onClick={() => onAction(action)}
      // 세는 동안 재전송만 흐립니다(다 세면 또렷해집니다 — counting 참고).
      // 비밀번호 찾기는 다른 메일이라 같은 시계에 묶지 않습니다.
      disabled={busy || (action === "resend" && counting)}
      className={link}
    >
      {ACTION_LABEL[action]}
    </button>
  ))

  // ⚠️ 물음표는 status.help 가 켜진 케이스에만 냅니다. 다 달면 장식이
  //    되어 정작 필요한 자리에서 눈에 안 들어옵니다 (시안).
  const help = status.help ? (
    <button
      type="button"
      onClick={onHelp}
      aria-label="로그인이 왜 이렇게 물어보나요?"
      className="inline-flex shrink-0 items-center text-brand-ink"
    >
      <QuestionMark />
    </button>
  ) : null

  const text = (
    <p className={`text-sm font-normal ${status.kind === "error" ? "text-[#EF2B2A]" : "text-brand-ink"}`}>
      {status.lines.map((line, i) => (
        <span key={i} className="block break-keep">
          {line}
        </span>
      ))}
      {status.code && <span className="block text-brand-ink/40">{status.code}</span>}
    </p>
  )

  // 타이머가 있는 케이스 — 문구 아래 새 줄, 왼쪽 정렬 (시안 3·4·5·7·8)
  if (timed) {
    return (
      <div className="mt-2 space-y-2">
        {text}
        {/* ┌─ 이 줄의 가로 치수 (시안) ────────────────────────────────
            │ [재전송] 4 [남은시간][숫자 42] 0 [물음표 12]
            │
            │ ⚠️ 물음표 앞은 **0** 입니다. 통에 gap 을 걸면 여기에도 딸려
            │    붙으므로, 사이 여백은 gap 이 아니라 남은시간 쪽 ml-1(4)
            │    하나로만 냅니다.
            └───────────────────────────────────────────────────────────

            ⚠️ 세로는 items-baseline — 글씨 밑줄에 맞춥니다. 이 줄은 전부
            한 줄짜리라 items-center 로도 줄은 맞지만, 글씨가 줄상자 안에서
            위쪽에 치우쳐 그려지기 때문에(밑에 내림폭만큼 빈 자리가
            있습니다) 상자 가운데에 맞춘 물음표만 숫자보다 1.5 처져
            보입니다. 밑줄에 맞추면 0.5 안쪽으로 들어옵니다. */}
        <div className="flex flex-wrap items-baseline">
          {/* 길이 둘 이상일 때 그 사이는 8 (시안 10번의 버튼1·버튼2) */}
          <span className="flex items-baseline gap-x-2">{actions}</span>
          <span className={`ml-1 text-sm ${counting ? "text-brand-ink" : "text-brand-ink/40"}`}>
            남은시간
            {/* 숫자에만 42px 고정 + tabular-nums — 뒤의 물음표가 안 흔들립니다 */}
            <span
              className="inline-block text-center tabular-nums"
              style={{ width: TIMER_WIDTH }}
            >
              {mmss(waitLeft)}
            </span>
          </span>
          {/* ⚠️ 물음표만 기준선(baseline)에 앉힙니다 — 줄상자 가운데가
              아닙니다. 글씨는 줄상자 안에서 위쪽에 치우쳐 그려지므로
              (밑에 내림폭만큼 빈 자리가 있습니다), 상자 가운데로 맞추면
              아이콘이 숫자보다 1.5px 처져 보입니다. 기준선에 앉히면
              동그라미 밑변이 숫자 밑변과 같은 선에 놓여 눈에 가운데로
              읽힙니다. 억지 패딩이 아니라 정렬로만 잡은 것이라, 글씨
              크기를 바꿔도 따라옵니다.

              오른쪽 2 — 시안. */}
          {help && <span className="mr-0.5 inline-flex">{help}</span>}
        </div>
      </div>
    )
  }

  // 타이머가 없는 케이스 — 시안 10번의 배치입니다.
  //
  //   [비밀번호 칸]
  //   지금 서버가 답을 못 하고 있어요. 잠시후…      (?)  ← 첫 줄 오른쪽 끝
  //   해 주세요. 오류가 계속되면 …
  //   ( 에러코드 )
  //   재전송  비밀번호 찾기   ← 문구 아래 새 줄(8), 왼쪽 정렬
  //
  // ⚠️ 길(재전송·비밀번호 찾기)을 물음표와 한 덩어리로 묶어 오른쪽에
  //    붙여 두었었습니다. 시안에서 이 둘은 다른 자리에 있습니다 —
  //    물음표는 첫 줄 오른쪽 끝에 고정이고, 길은 문구가 다 끝난 뒤
  //    아래 새 줄에 왼쪽부터 섭니다(시안의 버튼1·버튼2).
  //
  // ⚠️ 물음표를 감싼 칸에 flex-wrap 을 주지 않습니다. 주면 문구가 길 때
  //    물음표가 아랫줄로 떨어져서, 케이스마다 물음표를 찾는 자리가
  //    달라집니다.
  return (
    <div className="mt-2">
      {/* ⚠️ items-baseline 을 쓰면 안 됩니다. 물음표를 감싼 칸의 밑동이
          글씨 밑줄보다 아래라, 맞추려고 **문구 전체**가 11px 내려갑니다 —
          칸과 문구 사이가 8 이어야 하는데 19 가 됐습니다.
          items-start 로 두고, 물음표는 첫 줄 높이(h-5=20)짜리 칸 안에서
          가운데에 세웁니다. 그러면 문구는 제자리에 있고 물음표만 첫 줄
          한가운데에 옵니다. */}
      <div className="flex items-start justify-between gap-x-4">
        {text}
        {help && <span className="flex h-5 shrink-0 items-center">{help}</span>}
      </div>
      {actions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">{actions}</div>
      )}
    </div>
  )
}

/** 소셜 단추 밑에 붙는 사유 한 줄 */
function ProviderNotice({ show, status }: { show: boolean; status: Status }) {
  if (!show || !status || status.kind !== "error") return null
  return (
    <p className="text-center text-xs break-keep text-red-600">
      {status.lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </p>
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
    //
    // ⚠️ leading-4 (16px) — 시안이 이 고지 두 줄을 32 로 재고 있습니다.
    //    leading-relaxed 는 19.5px 이라 두 줄이 39 가 되어, 아래 여백 24 가
    //    맞아도 덩어리가 7 만큼 커집니다.
    <p className="text-center text-xs leading-4 break-keep text-brand-ink/70">
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
