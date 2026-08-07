// lib/server/toss-api.ts
// 앱인토스 서버 API 를 부르는 곳.
//
// ┌─ 여기만 알면 되는 것 셋 ──────────────────────────────────────────
// │ ① 인증이 헤더가 아니라 **mTLS** 입니다
// │    보통 API 는 키를 헤더에 얹지만, 앱인토스는 TLS 를 맺는 단계에서
// │    서로 신원을 확인합니다. 그래서 요청을 아무리 들여다봐도 인증
// │    정보가 안 보입니다 — 인증서는 연결에 붙습니다.
// │
// │ ② 실패가 **HTTP 200** 으로 옵니다
// │    res.ok 만 보면 실패를 성공으로 셉니다. resultType 을 먼저 봐야
// │    합니다. (요청 형식 오류만 400, 서버 오류만 500 입니다)
// │
// │ ③ 이 파일은 **Node 런타임에서만** 돕니다
// │    Edge 런타임에는 클라이언트 인증서를 붙일 방법이 없습니다.
// │    이 파일을 쓰는 라우트는 runtime = "nodejs" 를 적어야 합니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ fetch 를 쓰지 않았습니다. 표준 fetch 로는 클라이언트 인증서를 붙일
//    수 없습니다(undici Agent 가 필요한데 그건 별도 의존성입니다).
//    node:https 는 Node 에 이미 있고 cert·key 를 그대로 받습니다.
import "server-only"

import { request as httpsRequest } from "node:https"

/**
 * 콘솔에서 내려받은 인증서 한 쌍.
 *
 * ⚠️ CSR 을 우리가 만들지 않습니다. 콘솔의 "mTLS 인증서 → 발급받기" 를
 *    누르면 토스가 만들어서 파일 두 개를 내려줍니다. 그 **내용**을
 *    Vercel 환경변수에 그대로 넣습니다.
 *
 * ⚠️ 줄바꿈이 살아 있어야 합니다. Vercel 웹 화면에 붙여넣으면 대체로
 *    보존되지만, 어딘가에서 `\n` 두 글자로 바뀌어 들어오는 일이 흔합니다.
 *    그래서 읽을 때 한 번 되돌립니다 — 안 그러면 "PEM routines::no start
 *    line" 이라는, 원인을 짐작하기 어려운 오류가 납니다.
 */
function pem(raw: string | undefined): string | undefined {
  return raw?.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw
}

const CLIENT_CERT = pem(process.env.TOSS_CLIENT_CERT)
const CLIENT_KEY = pem(process.env.TOSS_CLIENT_KEY)

/** 인증서가 들어와 있는가. 없으면 이 API 를 부를 수 없습니다 */
export function isTossApiConfigured(): boolean {
  return Boolean(CLIENT_CERT && CLIENT_KEY)
}

export const TOSS_API_HOST = "apps-in-toss-api.toss.im"
export const TOSS_PAY_API_HOST = "pay-apps-in-toss-api.toss.im"

/** 앱인토스가 준 실패 (resultType: FAIL 또는 4xx·5xx) */
export class TossApiError extends Error {
  constructor(
    message: string,
    readonly errorCode: string | undefined,
    readonly httpStatus: number,
    /** 요청 한도에 걸렸을 때 저쪽이 알려주는 초 */
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = "TossApiError"
  }
}

/** 공통 응답 봉투 */
type Envelope<T> =
  | { resultType: "SUCCESS"; success: T }
  | {
      resultType: "FAIL"
      success: null
      error: {
        errorCode?: string
        reason?: string
        data?: { retryAfterSeconds?: number }
      }
    }

/**
 * 앱인토스 서버 API 한 번 부르기.
 *
 * @throws TossApiError  저쪽이 실패라고 답했을 때
 */
export async function callTossApi<T>(
  path: string,
  init: {
    method?: "GET" | "POST"
    body?: unknown
    headers?: Record<string, string>
    host?: string
    /** 답을 이 시간 안에 못 받으면 포기합니다 */
    timeoutMs?: number
  } = {},
): Promise<T> {
  if (!CLIENT_CERT || !CLIENT_KEY) {
    throw new TossApiError("앱인토스 인증서가 아직 없어요.", "NO_CERT", 503)
  }

  const {
    method = "POST",
    body,
    headers = {},
    host = TOSS_API_HOST,
    timeoutMs = 10_000,
  } = init
  const payload = body === undefined ? undefined : JSON.stringify(body)

  const raw = await new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = httpsRequest(
      {
        host,
        path,
        method,
        // ⚠️ 인증이 여기에 있습니다. 헤더가 아니라 연결에 붙습니다.
        cert: CLIENT_CERT,
        key: CLIENT_KEY,
        headers: {
          ...(payload ? { "Content-Type": "application/json" } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        let text = ""
        res.setEncoding("utf8")
        res.on("data", (chunk) => (text += chunk))
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text }))
      },
    )
    // ⚠️ 시간 초과를 직접 끊어야 합니다. timeout 옵션만 두면 이벤트만 나고
    //    연결은 열린 채로 남아, 이 약속(Promise)이 영영 안 끝납니다.
    req.on("timeout", () => {
      req.destroy(new Error("앱인토스 서버가 답하지 않았어요."))
    })
    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })

  let parsed: Envelope<T>
  try {
    parsed = JSON.parse(raw.text) as Envelope<T>
  } catch {
    throw new TossApiError(
      "앱인토스 서버가 알 수 없는 답을 보냈어요.",
      undefined,
      raw.status,
    )
  }

  // ⚠️ 이 순서가 중요합니다. HTTP 상태보다 resultType 을 **먼저** 봅니다.
  //    비즈니스 오류가 200 으로 오기 때문에, 상태만 보고 넘기면 실패한
  //    요청이 성공으로 셉니다.
  if (parsed.resultType !== "SUCCESS") {
    const error = "error" in parsed ? parsed.error : undefined
    throw new TossApiError(
      error?.reason ?? "앱인토스 요청이 실패했어요.",
      error?.errorCode,
      raw.status,
      error?.data?.retryAfterSeconds,
    )
  }

  return parsed.success
}

// ═══════════════════════════════════════════════════════════════════
// 토스 로그인 — 두 걸음입니다
// ═══════════════════════════════════════════════════════════════════

type GenerateTokenResult = {
  accessToken: string
  refreshToken?: string
}

/**
 * ① 미니앱이 받아온 authorizationCode 를 **토스 access token** 으로 바꿉니다.
 *
 * ⚠️ 여기서 나오는 accessToken 은 **토스 것**입니다. 우리 세션 토큰이
 *    아닙니다. 이건 바로 다음 걸음에서 쓰고 버립니다 — 미니앱에 돌려주면
 *    안 됩니다.
 */
export function exchangeAuthorizationCode(params: {
  authorizationCode: string
  referrer: "DEFAULT" | "SANDBOX"
}) {
  return callTossApi<GenerateTokenResult>(
    "/api-partner/v1/apps-in-toss/user/oauth2/generate-token",
    { method: "POST", body: params },
  )
}

/**
 * 토스가 알려주는 사용자.
 *
 * ⚠️ 이름·전화번호·생일도 함께 옵니다. **받는 것과 저장하는 것은 다릅니다.**
 *    우리는 userKey 만 씁니다 — 타로를 보는 데 전화번호가 필요하지 않고,
 *    안 가진 것은 샐 수도 없습니다.
 */
type TossLoginMe = {
  userKey: string
  scope?: string
  agreedTerms?: unknown
  name?: string
  phone?: string
  birthday?: string
}

/**
 * ② 토스 access token 으로 "이 사람이 누구인지" 를 묻습니다.
 *
 * 여기서 나오는 `userKey` 가 우리가 계정에 붙들어 둘 유일한 값입니다.
 */
export function fetchTossUser(accessToken: string) {
  return callTossApi<TossLoginMe>("/api-partner/v1/apps-in-toss/user/oauth2/login-me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
