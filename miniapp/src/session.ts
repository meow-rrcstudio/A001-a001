// miniapp/src/session.ts
// 토스 로그인 → 우리 세션.
//
// ┌─ 흐름 ────────────────────────────────────────────────────────────
// │  ① TossAuth.login()                     미니앱 (여기)
// │     → { authorizationCode, referrer }
// │  ② POST /api/auth/toss                  우리 서버
// │     → 토스 서버에 authorizationCode 를 주고 사용자 키를 받습니다
// │       (mTLS 클라이언트 인증서가 필요합니다 — 콘솔에서 발급)
// │     → 그 키로 우리 계정을 찾거나 만듭니다
// │     → 우리 세션 토큰(Supabase access_token)을 돌려줍니다
// │  ③ 그 토큰을 들고 API 를 부릅니다        src/api.ts
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ ② 의 "토스 서버에 물어보는" 부분이 아직 없습니다. mTLS 인증서와
//    교환 엔드포인트가 콘솔에서 나와야 합니다. 그때까지 /api/auth/toss 는
//    503 을 돌려줍니다 — **가짜로 통과시키지 않습니다.** 통과시켜 두면
//    "샌드박스에서는 되던데" 하고 진짜 검증 없이 출시되는 길이 열립니다.
import { Storage, TossAuth } from "@apps-in-toss/web-framework"
import { API_BASE } from "./api"

/**
 * 토큰을 어디에 두는가.
 *
 * ⚠️ localStorage 가 아니라 SDK 의 Storage 를 씁니다. 웹뷰의 저장소는
 *    토스가 언제 비울지 우리가 정하지 못합니다 — 비워지면 사용자는
 *    까닭 없이 로그아웃됩니다.
 */
const ACCESS_KEY = "soulseoul.access_token"
const REFRESH_KEY = "soulseoul.refresh_token"

/** 서버가 우리 세션을 돌려줄 때의 모양 */
type TossSessionResponse = {
  accessToken: string
  refreshToken: string
  /** 토큰이 만료되는 시각(초, epoch). 미리 갱신할 때 씁니다 */
  expiresAt: number
}

let memoryToken: string | null = null

/**
 * 지금 들고 있는 토큰.
 *
 * ⚠️ 한 번 읽은 값을 메모리에 들고 있습니다. API 를 부를 때마다 Storage 를
 *    읽으면 그때마다 네이티브를 한 번씩 건너가는데, 타로 한 판에 API 를
 *    여러 번 부르므로 그 왕복이 그대로 느려짐이 됩니다.
 */
export async function getAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken
  memoryToken = (await Storage.getItem(ACCESS_KEY)) ?? null
  return memoryToken
}

export async function clearSession(): Promise<void> {
  memoryToken = null
  await Storage.removeItem(ACCESS_KEY)
  await Storage.removeItem(REFRESH_KEY)
}

async function saveSession(session: TossSessionResponse): Promise<void> {
  memoryToken = session.accessToken
  await Storage.setItem(ACCESS_KEY, session.accessToken)
  await Storage.setItem(REFRESH_KEY, session.refreshToken)
}

/**
 * 토스로 로그인하고 우리 세션을 받아옵니다.
 *
 * ⚠️ authorizationCode 를 화면에서 쓰지 않고 그대로 서버에 넘깁니다.
 *    SDK 주석도 "서버로 전달해야 해요" 라고 적고 있습니다 — 이 값으로
 *    누구인지 알아내는 일은 우리 서버와 토스 서버 사이에서만 일어나야
 *    합니다. 화면이 "나는 아무개다" 라고 말하게 두면 아무나 그렇게
 *    말할 수 있습니다.
 *
 * ⚠️ referrer 도 함께 보냅니다 ("DEFAULT" | "SANDBOX"). 샌드박스에서 만든
 *    계정과 실제 계정이 섞이면 안 됩니다.
 */
export async function signInWithToss(): Promise<void> {
  const { authorizationCode, referrer } = await TossAuth.login()

  const response = await fetch(`${API_BASE}/api/auth/toss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorizationCode, referrer }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "로그인을 마치지 못했어요.")
  }

  await saveSession((await response.json()) as TossSessionResponse)
}
