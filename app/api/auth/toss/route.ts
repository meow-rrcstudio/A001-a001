// app/api/auth/toss/route.ts
// 미니앱이 토스로 로그인한 뒤 여기로 옵니다.
//
// ┌─ 여기서 해야 하는 일 ─────────────────────────────────────────────
// │  ① authorizationCode 를 토스 서버에 주고 사용자 키를 받습니다
// │  ② 그 키로 우리 계정을 찾거나 만듭니다
// │  ③ 우리 세션 토큰을 돌려줍니다 (미니앱이 Authorization 에 실어 씁니다)
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ **아직 ① 을 할 수 없습니다.** 두 가지가 없습니다.
//      · mTLS 클라이언트 인증서 (콘솔 → 서버 mTLS 인증서 발급받기)
//      · authorizationCode 를 교환하는 정확한 엔드포인트
//    그래서 이 라우트는 503 만 돌려줍니다.
//
// ⚠️ **가짜로 통과시키지 않았습니다.** "샌드박스에서는 그냥 통과" 같은
//    문을 열어두면, 그 문이 열린 채로 출시되는 날이 옵니다. 그러면 아무나
//    아무 코드나 보내고 남의 계정으로 들어옵니다. 통과시키려면 진짜
//    검증을 붙이는 수밖에 없게 두는 편이 낫습니다.
//
// ⚠️ 이 라우트는 **Node 런타임**이어야 합니다. mTLS 는 클라이언트 인증서를
//    붙여 나가는 것이라 Edge 런타임에서는 안 됩니다. 다 만든 뒤 배포해서야
//    알게 되면 늦으므로 지금 못박아 둡니다.
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** 콘솔에서 받은 mTLS 인증서 (PEM). 없으면 토스 서버를 부를 수 없습니다 */
const TOSS_CLIENT_CERT = process.env.TOSS_CLIENT_CERT
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    authorizationCode?: string
    referrer?: "DEFAULT" | "SANDBOX"
  } | null

  if (!body?.authorizationCode) {
    return NextResponse.json(
      { error: "로그인 코드가 없어요.", kind: "badRequest" },
      { status: 400 },
    )
  }

  if (!TOSS_CLIENT_CERT || !TOSS_CLIENT_KEY) {
    // ⚠️ 코드 값을 로그에 남기지 않습니다. 한 번 쓰면 끝나는 값이지만,
    //    그사이에 로그를 보는 사람이 그대로 쓸 수 있습니다.
    console.warn("[toss-auth] mTLS 인증서가 없어 교환을 건너뜁니다")
    return NextResponse.json(
      {
        error: "토스 로그인이 아직 준비되지 않았어요.",
        kind: "server",
      },
      { status: 503 },
    )
  }

  // ┌─ 인증서가 들어오면 여기부터 ──────────────────────────────────────
  // │ 1) undici Agent 로 mTLS 를 붙여 토스 서버를 부릅니다
  // │      new Agent({ connect: { cert: TOSS_CLIENT_CERT, key: TOSS_CLIENT_KEY } })
  // │      → https://apps-in-toss-api.toss.im/... (교환 엔드포인트)
  // │
  // │ 2) ⚠️ 응답은 HTTP 200 이어도 실패일 수 있습니다.
  // │      { resultType: "SUCCESS" | "FAIL" } 를 **먼저** 보세요.
  // │      res.ok 만 보면 실패를 성공으로 셉니다 (docs/apps-in-toss.md §8).
  // │
  // │ 3) 받은 사용자 키로 우리 계정을 찾거나 만듭니다.
  // │      ⚠️ referrer 가 "SANDBOX" 인 계정과 "DEFAULT" 인 계정을 섞지
  // │         마세요. 샌드박스에서 만든 계정이 실제 사용자와 같은 자리에
  // │         들어오면 별조각이 뒤섞입니다.
  // │
  // │ 4) 우리 세션 토큰을 만들어 돌려줍니다.
  // │      { accessToken, refreshToken, expiresAt }
  // │      (miniapp/src/session.ts 의 TossSessionResponse 와 같은 모양)
  // └──────────────────────────────────────────────────────────────────

  return NextResponse.json(
    { error: "토스 로그인이 아직 준비되지 않았어요.", kind: "server" },
    { status: 503 },
  )
}
