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

  // 가입 선물 — 아직 안 받았으면 지금 한 번.
  //
  // 표시를 먼저 남기고 크레딧을 넣습니다. 순서를 반대로 하면 사이에
  // 요청이 하나 더 들어왔을 때 두 번 받아갈 수 있습니다. eq("welcomed_at",
  // null) 조건이 붙어 있어 먼저 도착한 요청 하나만 통과합니다.
  const { data: claimed } = await admin
    .from("profiles")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("welcomed_at", null)
    .select("id")

  if (claimed?.length) {
    await admin.from("credit_entries").insert({
      user_id: user.id,
      delta: WELCOME_CREDITS,
      reason: "welcome",
      idempotency_key: `welcome:${user.id}`,
    })
  }

  // 잔액은 로그인한 사람의 자격으로 읽습니다 (본인 것만 보입니다).
  const { data: balance } = await supabase
    .from("credit_balance")
    .select("credits")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: profile } = await supabase
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
