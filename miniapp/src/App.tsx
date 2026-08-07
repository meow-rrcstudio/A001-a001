// miniapp/src/App.tsx
// 껍데기 화면 — "서버까지 길이 뚫렸는가"를 눈으로 확인하는 자리입니다.
//
// ⚠️ 타로 화면을 아직 옮기지 않았습니다. 이 화면의 목적은 하나입니다:
//    샌드박스에서 열어서 로그인 → 우리 API 호출까지 실제로 닿는지 보는 것.
//    그게 되면 나머지는 화면을 옮기는 일이라 막힐 자리가 없습니다.
import { useEffect, useState } from "react"
import { Environment, SafeArea } from "@apps-in-toss/web-framework"
import { fetchAccount, type Account, ApiError, API_BASE } from "./api"
import { getAccessToken, signInWithToss, clearSession } from "./session"

type StepState = "waiting" | "ok" | "fail"

/**
 * 확인할 단계들. 순서가 곧 화면 순서입니다.
 *
 * ⚠️ 목록에 **밀어넣지(push) 않습니다.** 처음에 그렇게 짰더니 React 가
 *    효과를 두 번 돌리는 개발 모드에서 같은 줄이 두 번씩 찍혔습니다.
 *    "실행 환경 ❌" 이 두 줄이면 두 번 실패한 것처럼 보입니다.
 *    이름을 열쇠로 두고 덮어쓰면 몇 번을 돌든 줄 수가 같습니다.
 */
const STEP_LABELS = {
  env: "실행 환경",
  session: "우리 세션",
  api: "우리 서버 (/api/account)",
  login: "토스 로그인",
} as const

type StepKey = keyof typeof STEP_LABELS
type Step = { state: StepState; detail?: string }

export function App() {
  const [insetTop, setInsetTop] = useState(0)
  const [insetBottom, setInsetBottom] = useState(0)
  const [steps, setSteps] = useState<Partial<Record<StepKey, Step>>>({})
  const [account, setAccount] = useState<Account | null>(null)
  const [busy, setBusy] = useState(false)

  const mark = (key: StepKey, step: Step) => setSteps((prev) => ({ ...prev, [key]: step }))

  // ⚠️ 안전영역을 직접 피해야 합니다. viewport-fit=cover 로 화면을 꽉
  //    채웠기 때문에, 이걸 안 하면 맨 윗줄이 노치에 가립니다.
  //
  // ⚠️ SafeArea.get() 은 **동기**입니다 (호스트가 화면을 그리기 전에
  //    넣어둔 값을 읽습니다). await 를 붙이면 안 됩니다.
  //    바뀔 때를 위해 subscribe 도 겁니다 — 화면을 돌리면 값이 달라집니다.
  useEffect(() => {
    const apply = (insets: { top: number; bottom: number }) => {
      setInsetTop(insets.top)
      setInsetBottom(insets.bottom)
    }
    try {
      apply(SafeArea.get())
      return SafeArea.subscribe({ onEvent: apply })
    } catch {
      // 브라우저에서 열면 호스트가 없어 실패합니다 — 여백 0 으로 둡니다
    }
  }, [])

  useEffect(() => {
    void (async () => {
      // ① 지금 어디서 도는가
      //
      // ⚠️ Environment.environment 는 함수가 아니라 **속성**입니다.
      //    "toss" | "sandbox" 중 하나입니다 — 샌드박스에서 만든 계정이
      //    실제 계정과 섞이면 안 되므로, 이 값을 눈으로 확인합니다.
      try {
        mark("env", {
          state: "ok",
          detail: `${Environment.environment} · 토스 ${Environment.tossAppVersion}`,
        })
      } catch (error) {
        // 보통 브라우저에서 열면 여기로 옵니다 — SDK 가 "토스 앱 안에서만
        // 호출할 수 있어요" 라고 던집니다. 고장이 아니라 제자리가 아닌 것입니다.
        mark("env", { state: "fail", detail: message(error) })
      }

      // ② 토큰을 이미 들고 있는가
      const token = await getAccessToken().catch(() => null)
      mark("session", {
        state: token ? "ok" : "waiting",
        detail: token ? "토큰 있음" : "아직 로그인 전",
      })

      if (token) await loadAccount()
    })()
    // 처음 한 번만 돕니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAccount() {
    try {
      const data = await fetchAccount()
      setAccount(data)
      mark("api", { state: "ok", detail: `별조각 ${data.credits}개` })
    } catch (error) {
      mark("api", {
        state: "fail",
        // CORS 가 막히면 fetch 자체가 실패합니다 — 그때는 상태 코드가
        // 없습니다. "Failed to fetch" 만 뜨면 TOSS_APP_NAME 을 의심하세요.
        detail: message(error),
      })
    }
  }

  async function onSignIn() {
    setBusy(true)
    try {
      await signInWithToss()
      mark("login", { state: "ok" })
      await loadAccount()
    } catch (error) {
      mark("login", { state: "fail", detail: message(error) })
    } finally {
      setBusy(false)
    }
  }

  async function onSignOut() {
    await clearSession()
    setAccount(null)
    setSteps({})
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: insetTop + 24,
        paddingBottom: insetBottom + 24,
        paddingInline: 24,
        background: "#C6F24E",
        color: "#1C1C1E",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Soulseoul 미니앱</h1>
      <p style={{ margin: "4px 0 20px", opacity: 0.7 }}>
        길이 뚫렸는지 보는 화면입니다. {API_BASE}
      </p>

      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {(Object.keys(STEP_LABELS) as StepKey[]).map((key) => {
          const step = steps[key]
          if (!step) return null
          return (
            <li key={key} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span aria-hidden>
                {step.state === "ok" ? "✅" : step.state === "fail" ? "❌" : "…"}
              </span>
              <span style={{ fontWeight: 600 }}>{STEP_LABELS[key]}</span>
              {step.detail && <span style={{ opacity: 0.7 }}>{step.detail}</span>}
            </li>
          )
        })}
      </ol>

      <div style={{ marginTop: 24, display: "grid", gap: 8 }}>
        {account?.isLoggedIn ? (
          <button type="button" onClick={() => void onSignOut()} style={button}>
            로그아웃
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void onSignIn()} style={button}>
            {busy ? "잠시만요…" : "토스로 로그인"}
          </button>
        )}
      </div>
    </main>
  )
}

const button: React.CSSProperties = {
  height: 52,
  width: "100%",
  border: "none",
  background: "#1C1C1E",
  color: "white",
  fontSize: 15,
  fontWeight: 600,
}

function message(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (${error.status})`
  return error instanceof Error ? error.message : String(error)
}
