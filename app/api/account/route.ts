// app/api/account/route.ts
// "지금 누가 로그인해 있고, 크레딧이 몇 장 남았나"를 알려줍니다.
//
// 화면은 이 답만 보고 그립니다. 크레딧을 브라우저에 두던 때와 달리,
// 이제 잔액의 진짜 주인은 서버입니다.
//
// 처음 온 사람에게는 여기서 가입 크레딧을 한 번 얹어줍니다.
// "한 번"을 지키는 것이 중요해서 profiles.welcomed_at 에 표시를 남깁니다 —
// 없으면 로그아웃했다 다시 들어올 때마다 계속 받아갑니다.
import { NextResponse } from "next/server"
import { getCurrentUser, getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server"
import { WELCOME_CREDITS } from "@/lib/reading-entitlement"

export const dynamic = "force-dynamic"

export interface AccountInfo {
  isLoggedIn: boolean
  credits: number
  email: string | null
  displayName: string | null
}

const LOGGED_OUT: AccountInfo = {
  isLoggedIn: false,
  credits: 0,
  email: null,
  displayName: null,
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json(LOGGED_OUT)

  const supabase = await getSupabaseServer()
  const admin = getSupabaseAdmin()
  if (!supabase || !admin) return NextResponse.json(LOGGED_OUT)

  // ⚠️ 프로필 행이 없으면 아래 update 가 0줄을 고치고 조용히 끝납니다.
  //    그러면 가입 크레딧이 영영 안 들어갑니다 (실제로 그랬습니다).
  //    가입 트리거가 못 돌았거나, 트리거를 만들기 전에 가입한 사람이
  //    그렇습니다. 여기서 먼저 만들어 두고 시작합니다.
  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name:
        (user.user_metadata?.name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  )

  // 가입 선물 — 크레딧을 먼저 넣고, 그다음에 표시를 남깁니다.
  //
  // ⚠️ 순서가 중요합니다. 예전에는 표시를 먼저 남기고 크레딧을 넣었는데,
  //    크레딧 넣기가 실패하면 표시만 남아서 그 사람은 영영 못 받았습니다.
  //    되돌릴 방법도 없었고요.
  //
  //    두 번 받아가는 걸 막는 건 표시가 아니라 idempotency_key 입니다.
  //    같은 열쇠로는 한 줄만 들어가므로, 몇 번을 불러도 한 번만 받습니다.
  //    그래서 매번 시도해도 안전하고, 예전에 표시만 남은 계정도 여기서
  //    저절로 복구됩니다.
  const { error: grantError } = await admin.from("credit_entries").upsert(
    {
      user_id: user.id,
      delta: WELCOME_CREDITS,
      reason: "welcome",
      idempotency_key: `welcome:${user.id}`,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  )

  if (grantError) {
    // 조용히 넘어가면 "가입했는데 크레딧이 없는" 상태가 됩니다.
    console.error("[account] 가입 크레딧을 못 넣었습니다:", grantError.message)
  } else {
    await admin
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("welcomed_at", null)
  }

  // 잔액은 admin 으로 읽습니다. 위에서 이미 "이 요청이 누구인지" 확인했고
  // user.id 로만 좁혀 읽으므로 남의 것이 섞일 수 없습니다.
  //
  // 사용자 자격으로 읽으면 뷰의 권한 설정이 조금만 어긋나도 잔액이 0으로
  // 보입니다 — 크레딧이 있는데 없다고 나오는 게 제일 나쁩니다.
  // (브라우저가 직접 읽을 때는 여전히 RLS 가 막습니다)
  const { data: balance, error: balanceError } = await admin
    .from("credit_balance")
    .select("credits")
    .eq("user_id", user.id)
    .maybeSingle()

  if (balanceError) {
    console.error("[account] 잔액을 못 읽었습니다:", balanceError.message)
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle()

  return NextResponse.json({
    isLoggedIn: true,
    credits: balance?.credits ?? 0,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
  } satisfies AccountInfo)
}
