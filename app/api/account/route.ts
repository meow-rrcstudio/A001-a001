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
import { createHash } from "node:crypto"
import {
  WELCOME_COOLDOWN_DAYS,
  WELCOME_CREDITS,
  WELCOME_FOLLOWUPS,
} from "@/lib/credit-rules"

export const dynamic = "force-dynamic"

/**
 * 로그인 공급자가 주는 이름을 찾습니다.
 *
 * 공급자마다 담는 자리가 다릅니다 — 구글은 name/full_name, 카카오는
 * 닉네임이 preferred_username 이나 user_name 으로 오기도 합니다.
 * 하나만 보면 "이름 없는 사람"이 자꾸 생깁니다.
 */
function nameOf(user: { user_metadata?: Record<string, unknown> }): string | null {
  const meta = user.user_metadata ?? {}
  for (const key of ["name", "full_name", "preferred_username", "user_name", "nickname"]) {
    const value = meta[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

/**
 * 어떤 길로 들어온 계정인가.
 *
 * 프로필 화면이 "카카오로 가입하셨어요"를 보여주는 데 씁니다.
 * 로그인할 때마다 어느 버튼을 눌러야 하는지 잊는 사람이 많습니다 —
 * 특히 이메일로 가입했는지 카카오로 했는지가 헷갈립니다.
 */
export type AuthProvider = "email" | "kakao" | "google" | "unknown"

export interface AccountInfo {
  isLoggedIn: boolean
  credits: number
  email: string | null
  displayName: string | null
  /** 가입·로그인에 쓴 수단 */
  provider: AuthProvider
}

const LOGGED_OUT: AccountInfo = {
  isLoggedIn: false,
  credits: 0,
  email: null,
  displayName: null,
  provider: "unknown",
}

/**
 * 로그인 수단을 알아냅니다.
 *
 * ⚠️ app_metadata.provider 하나만 보지 않습니다. 한 계정에 여러 수단이
 *    묶일 수 있고(같은 이메일로 카카오·구글을 잇는 경우), 그때 이 값은
 *    "마지막에 쓴 것"이라 실제로 가입한 길과 다를 수 있습니다.
 *    identities 를 함께 보고, 사람이 만든 길(카카오·구글)을 먼저 칩니다.
 */
function providerOf(user: {
  app_metadata?: { provider?: string; providers?: string[] }
  identities?: { provider?: string }[] | null
}): AuthProvider {
  const found = new Set<string>()
  if (user.app_metadata?.provider) found.add(user.app_metadata.provider)
  for (const p of user.app_metadata?.providers ?? []) found.add(p)
  for (const identity of user.identities ?? []) {
    if (identity?.provider) found.add(identity.provider)
  }

  // 이어 붙인 계정이면 소셜 쪽을 먼저 알려줍니다 — 이메일은 어느
  // 계정에나 있어서 "이메일로 가입"과 구분이 안 됩니다.
  if (found.has("kakao")) return "kakao"
  if (found.has("google")) return "google"
  if (found.has("email")) return "email"
  return "unknown"
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
    { id: user.id, email: user.email ?? null, display_name: nameOf(user) },
    { onConflict: "id", ignoreDuplicates: true }
  )

  // 이름이 비어 있으면 채워 넣습니다.
  // 카카오는 계정마다 주는 항목이 달라서(닉네임만 오기도 하고 이메일이
  // 아예 안 오기도 합니다) 처음 만들 때 비었던 자리가 나중에 채워질 수
  // 있습니다. 이미 있는 이름은 건드리지 않습니다.
  const fallbackName = nameOf(user)
  if (fallbackName) {
    await admin
      .from("profiles")
      .update({ display_name: fallbackName })
      .eq("id", user.id)
      .is("display_name", null)
  }

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
  // ── 탈퇴 → 재가입으로 선물을 계속 받아가는 것을 막습니다 ───────────
  //
  // ⚠️ welcomed_at 은 프로필에 있고, 프로필은 탈퇴할 때 계정과 함께
  //    지워집니다(cascade). 그래서 탈퇴하고 다시 가입하면 선물이 처음부터
  //    또 나갑니다 — 몇 번이고 되풀이할 수 있었습니다.
  //
  //    표시가 사람과 함께 지워지지 않으려면 사람 밖에 있어야 합니다.
  //    다만 탈퇴한 사람의 이메일을 그대로 들고 있을 수는 없어서, 되돌릴
  //    수 없는 지문(sha256)만 남깁니다 (supabase/migrations/004 참고).
  //
  // ⚠️ 재가입 자체는 막지 않습니다. 30일 안에 다시 오면 가입은 되고
  //    선물만 안 나갑니다.
  const emailHash = user.email
    ? createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex")
    : null

  let giftBlocked = false
  if (emailHash) {
    const since = new Date(Date.now() - WELCOME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data: seen, error: seenError } = await admin
      .from("welcome_grants")
      .select("granted_at")
      .eq("email_hash", emailHash)
      .maybeSingle()

    // ⚠️ 못 읽었으면 막지 않습니다. 표가 아직 없는 배포(004 를 안 돌린 곳)
    //    에서 여기서 막아버리면 새로 가입하는 모두가 선물을 못 받습니다.
    //    악용을 놓치는 쪽이 정상 가입을 막는 쪽보다 낫습니다.
    if (seenError) {
      console.warn("[account] 선물 지급 이력을 못 읽었습니다:", seenError.message)
    } else if (seen?.granted_at && String(seen.granted_at) > since) {
      giftBlocked = true
      console.warn(`[account] 최근 ${WELCOME_COOLDOWN_DAYS}일 안에 선물을 받은 적이 있어 건너뜁니다`)
    }
  }

  if (giftBlocked) {
    // 선물만 건너뜁니다. 계정은 정상이고, 별조각을 사서 쓰는 데는 아무
    // 제약이 없습니다.
  } else {
    // 크레딧을 먼저 넣고, 그다음에 표시를 남깁니다.
    //
    // ⚠️ 순서가 중요합니다. 예전에는 표시를 먼저 남기고 크레딧을 넣었는데,
    //    크레딧 넣기가 실패하면 표시만 남아서 그 사람은 영영 못 받았습니다.
    //
    //    두 번 받아가는 걸 막는 건 표시가 아니라 idempotency_key 입니다.
    //    같은 열쇠로는 한 줄만 들어가므로, 몇 번을 불러도 한 번만 받습니다.
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
      // ── 이어묻기 선물은 계정에 얹습니다 ──────────────────────────
      // 판이 아니라 계정입니다. 어느 판에서 이어묻든 이것부터 쓰이고,
      // 다 쓴 뒤에야 별조각을 씁니다 (supabase/migrations/004 참고).
      //
      // ⚠️ welcomed_at 이 비어 있을 때만 채웁니다. 이미 선물을 받고
      //    3회를 다 쓴 사람에게 다시 3을 넣지 않기 위해서입니다.
      const { error: followupError } = await admin
        .from("profiles")
        .update({
          welcome_followups_left: WELCOME_FOLLOWUPS,
          welcomed_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .is("welcomed_at", null)

      if (followupError) {
        // 004 를 아직 안 돌린 배포에서는 칸이 없어 실패합니다. 별조각은
        // 이미 들어갔으므로 가입 자체는 멀쩡합니다 — 로그만 남깁니다.
        console.warn("[account] 선물 이어묻기를 못 얹었습니다:", followupError.message)
      }

      // 이 지문에게 선물을 줬다고 남깁니다 (탈퇴해도 남습니다).
      if (emailHash) {
        const { error: markError } = await admin
          .from("welcome_grants")
          .upsert({ email_hash: emailHash, granted_at: new Date().toISOString() },
            { onConflict: "email_hash" })
        if (markError) {
          console.warn("[account] 선물 지급 이력을 못 남겼습니다:", markError.message)
        }
      }
    }
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
    provider: providerOf(user),
  } satisfies AccountInfo)
}
