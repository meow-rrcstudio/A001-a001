// app/api/auth/toss/route.ts
// 미니앱이 토스로 로그인한 뒤 여기로 옵니다.
//
// ┌─ 세 걸음 ─────────────────────────────────────────────────────────
// │ ① authorizationCode → 토스 access token     generate-token
// │ ② 토스 access token → userKey                login-me
// │ ③ userKey 로 우리 계정을 찾거나 만들고, 우리 세션을 돌려줍니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ ①②를 서버에서 합니다. 미니앱이 "나는 아무개다" 라고 말하게 두면
//    아무나 그렇게 말할 수 있습니다. 화면은 코드를 전달만 하고, 누구인지는
//    우리 서버와 토스 서버 사이에서만 정해집니다.
//
// ⚠️ 이 라우트는 **Node 런타임**이어야 합니다. mTLS 는 클라이언트 인증서를
//    붙여 나가는 것이라 Edge 에서는 안 됩니다.
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  TossApiError,
  exchangeAuthorizationCode,
  fetchTossUser,
  isTossApiConfigured,
} from "@/lib/server/toss-api"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * 토스 사용자에게 붙이는 주소.
 *
 * ⚠️ Supabase 는 계정에 이메일을 요구합니다. 토스 로그인은 이메일을 주지
 *    않으므로(줄 수도 있지만 우리는 안 받습니다) 우리가 지어냅니다.
 *
 * ⚠️ 우리가 가진 도메인의 하위 이름을 씁니다. 남의 도메인으로 지어내면
 *    그 주소가 실제로 존재할 수 있고, 그러면 우리가 남의 메일함으로
 *    무언가를 보낼 수 있게 됩니다.
 *
 * ⚠️ 이 주소로는 메일이 나가지 않습니다. 토스 계정에는 비밀번호도
 *    비밀번호 찾기도 없습니다 — 들어오는 길은 토스 로그인 하나뿐입니다.
 */
const tossEmail = (userKey: string) => `toss-${userKey}@users.soulseoul.xyz`

function fail(message: string, status: number, kind: string) {
  return NextResponse.json({ error: message, kind }, { status })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    authorizationCode?: string
    referrer?: "DEFAULT" | "SANDBOX"
  } | null

  if (!body?.authorizationCode) {
    return fail("로그인 코드가 없어요.", 400, "badRequest")
  }

  if (!isTossApiConfigured()) {
    // ⚠️ 코드 값을 로그에 남기지 않습니다. 한 번 쓰면 끝나는 값이지만,
    //    그사이에 로그를 보는 사람이 그대로 쓸 수 있습니다.
    console.warn("[toss-auth] mTLS 인증서가 없어 교환을 건너뜁니다")
    return fail("토스 로그인이 아직 준비되지 않았어요.", 503, "server")
  }

  const admin = getSupabaseAdmin()
  if (!admin || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return fail("서버 설정이 아직 없어요.", 503, "server")
  }

  // ── ①② 누구인지 알아냅니다 ────────────────────────────────────────
  let userKey: string
  try {
    const { accessToken } = await exchangeAuthorizationCode({
      authorizationCode: body.authorizationCode,
      // 미니앱이 알려주지 않으면 실서비스로 봅니다 — 샌드박스로 잘못 보면
      // 실제 사용자가 샌드박스 계정에 들어갑니다.
      referrer: body.referrer === "SANDBOX" ? "SANDBOX" : "DEFAULT",
    })
    const user = await fetchTossUser(accessToken)
    if (!user?.userKey) return fail("토스에서 사용자를 확인하지 못했어요.", 502, "server")
    userKey = user.userKey
  } catch (error) {
    if (error instanceof TossApiError) {
      // ⚠️ 저쪽 사유를 그대로 사용자에게 보이지 않습니다. 영어이거나
      //    우리 속사정(인증서 문제 등)이라 읽는 사람에게 도움이 안 됩니다.
      //    찾아볼 수 있게 서버 기록에만 남깁니다.
      console.warn("[toss-auth] 실패", error.errorCode, error.httpStatus, error.message)
      return fail("로그인을 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.", 502, "server")
    }
    throw error
  }

  // ⚠️ 샌드박스에서 만든 계정과 실제 계정을 섞지 않습니다. 샌드박스는
  //    mock 값이 내려온다고 문서가 적고 있어서, 섞이면 테스트로 만든
  //    계정이 실제 사용자 자리에 앉습니다.
  const scopedKey = body.referrer === "SANDBOX" ? `sandbox:${userKey}` : userKey

  // ── ③ 우리 계정을 찾거나 만듭니다 ─────────────────────────────────
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("toss_user_key", scopedKey)
    .maybeSingle()

  let userId = existing?.id as string | undefined
  const email = tossEmail(scopedKey.replace(/[^a-zA-Z0-9]/g, ""))

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      // ⚠️ 확인된 것으로 둡니다. 이 주소로는 메일이 나가지 않으므로
      //    확인을 기다리면 영영 로그인할 수 없습니다.
      email_confirm: true,
      user_metadata: { provider: "toss" },
    })
    if (createError || !created.user) {
      console.warn("[toss-auth] 계정 생성 실패", createError?.message)
      return fail("계정을 만들지 못했어요.", 500, "server")
    }
    userId = created.user.id

    // 트리거(handle_new_user)가 profiles 를 만들어 두었으므로 열쇠만 답니다.
    const { error: linkError } = await admin
      .from("profiles")
      .update({ toss_user_key: scopedKey })
      .eq("id", userId)

    if (linkError) {
      // ⚠️ 여기서 실패하면 열쇠 없는 계정이 남습니다. 다음에 같은 사람이
      //    들어오면 못 알아보고 계정을 또 만듭니다 — 어제 산 별조각이
      //    사라진 것처럼 보입니다. 만든 계정을 도로 지웁니다.
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      console.warn("[toss-auth] 열쇠 연결 실패", linkError.message)
      return fail("계정을 만들지 못했어요.", 500, "server")
    }
  }

  // ── 우리 세션을 만들어 돌려줍니다 ─────────────────────────────────
  //
  // ⚠️ 비밀번호를 지어내 로그인시키지 않습니다. 그러면 그 비밀번호가
  //    어딘가에 남아야 하고, 남은 값으로 아무나 그 계정에 들어갈 수
  //    있습니다. 대신 한 번 쓰고 사라지는 링크를 만들어 그 자리에서
  //    바꿔치웁니다.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  })
  const hashedToken = link?.properties?.hashed_token
  if (linkErr || !hashedToken) {
    console.warn("[toss-auth] 세션 발급 실패", linkErr?.message)
    return fail("로그인을 마치지 못했어요.", 500, "server")
  }

  // ⚠️ 이 연결은 쿠키를 만들지 않습니다(persistSession: false). 미니앱은
  //    토큰으로만 다니고, 서버에 세션이 남으면 다음 요청이 남의 세션을
  //    물려받을 수 있습니다.
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: hashedToken,
    type: "magiclink",
  })

  if (verifyError || !verified.session) {
    console.warn("[toss-auth] 세션 확인 실패", verifyError?.message)
    return fail("로그인을 마치지 못했어요.", 500, "server")
  }

  return NextResponse.json({
    accessToken: verified.session.access_token,
    refreshToken: verified.session.refresh_token,
    expiresAt: verified.session.expires_at ?? 0,
  })
}
