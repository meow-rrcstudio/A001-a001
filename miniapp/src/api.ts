// miniapp/src/api.ts
// 우리 서버(app/api/**)를 부르는 곳.
//
// ┌─ 웹과 무엇이 다른가 ──────────────────────────────────────────────
// │ 웹에서는 `fetch("/api/...")` 한 줄이면 끝입니다 — 같은 도메인이라
// │ 주소도 짧고 쿠키도 알아서 실립니다.
// │
// │ 미니앱은 둘 다 안 됩니다.
// │   · 번들이 토스 주소에서 뜹니다 → 우리 서버 주소를 통째로 적어야 합니다
// │   · 다른 출처라 쿠키가 안 실립니다 → 토큰을 손으로 붙여야 합니다
// │     (iOS 13.4+ 는 서드파티 쿠키를 아예 막습니다. 선택지가 아닙니다)
// │
// │ 서버 쪽은 이미 열어 두었습니다:
// │   · Authorization: Bearer 를 받습니다  → lib/supabase/server.ts
// │   · 미니앱 출처에 CORS 를 엽니다        → lib/server/toss-origin.ts
// └──────────────────────────────────────────────────────────────────
import { getAccessToken, clearSession } from "./session"

/**
 * 우리 서버 주소.
 *
 * ⚠️ 반드시 https 입니다. 샌드박스 앱은 http 도 허용하지만 라이브는
 *    https 만 됩니다 — 샌드박스에서만 되는 것을 만들면 출시할 때 압니다.
 *
 * 로컬에서 우리 Next 서버를 함께 띄워 붙이려면 .env.local 에
 * VITE_API_BASE=http://localhost:3000 을 넣으세요 (샌드박스에서만 됩니다).
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "https://soulseoul.xyz"

export class ApiError extends Error {
  constructor(
    message: string,
    /** 서버가 함께 보내는 갈래 이름 (lib/chat-errors.ts 의 ChatErrorKind) */
    readonly kind: string | undefined,
    readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * 우리 API 한 번 부르기.
 *
 * ⚠️ 401 이 오면 토큰을 버립니다. 만료된 토큰을 들고 계속 부르면 모든
 *    화면이 조용히 비어 보이는데, 사용자는 로그인이 풀린 줄 모릅니다.
 *    버려두면 다음 화면이 "다시 로그인" 을 낼 수 있습니다.
 *
 * ⚠️ credentials 를 켜지 않습니다. 쿠키를 실을 일이 없고(토큰으로 옵니다),
 *    켜면 서버가 Access-Control-Allow-Credentials 까지 내줘야 합니다 —
 *    안 켜는 편이 서로 간단하고 안전합니다.
 */
export async function callApi<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init

  const token = auth ? await getAccessToken() : null
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (response.status === 401) {
    await clearSession()
    throw new ApiError("로그인이 필요해요.", "signedOut", 401)
  }

  // ⚠️ 몸통이 JSON 이 아닐 수 있습니다 (앞단 프록시가 낸 오류 등).
  //    그때 response.json() 이 던지는 오류를 그대로 올리면 화면에는
  //    "Unexpected token <" 이 뜹니다 — 읽는 사람에게 아무 뜻이 없습니다.
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError("서버가 알 수 없는 답을 보냈어요.", "server", response.status)
  }

  if (!response.ok) {
    const error = body as { error?: string; kind?: string } | null
    throw new ApiError(
      error?.error ?? "잠시 문제가 생겼어요.",
      error?.kind,
      response.status,
    )
  }

  return body as T
}

/** 내 계정 (별조각 잔액 포함) */
export type Account = {
  isLoggedIn: boolean
  credits: number
  email: string | null
  displayName: string | null
}

export const fetchAccount = () => callApi<Account>("/api/account")
