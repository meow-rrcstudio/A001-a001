// lib/supabase/server.ts
// 서버(라우트 핸들러·서버 컴포넌트)에서 쓰는 Supabase 연결.
//
// 두 가지를 만듭니다.
//   · getSupabaseServer()  — 로그인한 그 사람의 자격으로 봅니다. RLS 가 걸려
//                            본인 것만 보입니다. 평소엔 이걸 쓰세요.
//   · getSupabaseAdmin()   — RLS 를 무시하는 연결. 크레딧을 얹어주는 것처럼
//                            "사용자가 스스로 하면 안 되는 일"에만 씁니다.
import "server-only"

import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env"
import { SUPABASE_SECRET_KEY } from "@/lib/supabase/server-env"

/**
 * 요청에 실려 온 토큰 (`Authorization: Bearer …`).
 *
 * ┌─ 왜 쿠키 말고 토큰도 받는가 ──────────────────────────────────────
 * │ 앱인토스 미니앱은 우리 웹이 아니라 **다른 출처**에서 도는 정적
 * │ 번들입니다(docs/apps-in-toss.md §1). 다른 출처에는 우리 쿠키가
 * │ 실리지 않습니다 — 미니앱이 우리 API 를 부르면 전부 401 입니다.
 * │ 지금 API 18개가 모두 쿠키 하나만 보고 있었습니다.
 * │
 * │ 판단하는 곳이 getCurrentUser 한 군데라, 여기만 열면 18개가 함께
 * │ 열립니다. 라우트마다 손대면 한 곳을 빠뜨리고, 빠뜨린 그 API 만
 * │ 미니앱에서 안 되는데 까닭을 찾기 어렵습니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 이 값을 그대로 믿지 않습니다. 아무나 적어 보낼 수 있는 글자입니다.
 *    진짜인지는 Supabase 에게 물어서(`auth.getUser(token)`) 확인합니다 —
 *    서명과 만료를 저쪽이 봅니다. 여기서는 모양만 벗겨냅니다.
 *
 * ⚠️ 웹은 영향받지 않습니다. 헤더가 없으면 예전 그대로 쿠키를 봅니다.
 */
async function bearerToken(): Promise<string | null> {
  const raw = (await headers()).get("authorization")
  if (!raw) return null
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim())
  const token = match?.[1]?.trim()
  return token ? token : null
}

/** 로그인한 사람의 자격으로 보는 연결. 설정이 없으면 null */
export async function getSupabaseServer() {
  if (!isSupabaseConfigured) return null

  // 토큰이 실려 왔으면 그 자격으로 봅니다 (미니앱).
  //
  // ⚠️ persistSession·autoRefreshToken 을 끕니다. 서버에는 세션을 둘 곳이
  //    없고, 요청 하나에만 쓰는 연결입니다. 켜두면 서버가 남의 세션을
  //    들고 있게 됩니다.
  //
  // ⚠️ 쿠키를 건드리지 않습니다. 미니앱 요청이 브라우저 쿠키를 덮어쓰면
  //    같은 사람이 웹에서 로그아웃되는 일이 생깁니다.
  const token = await bearerToken()
  if (token) {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  const store = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. 세션 갱신은
          // 미들웨어가 맡으므로 여기서는 넘어갑니다.
        }
      },
    },
  })
}

/**
 * RLS 를 무시하는 연결.
 *
 * ⚠️ 이걸 쓸 때는 "이 사람이 그럴 자격이 있는지"를 먼저 직접 확인해야
 *    합니다. 데이터베이스가 대신 막아주지 않습니다.
 */
export function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * 지금 요청을 보낸 사람. 로그인 안 했으면 null
 *
 * ⚠️ 토큰으로 왔으면 그 토큰을 **명시적으로** 넘겨 확인합니다.
 *    인자 없이 부르면 supabase-js 가 "저장된 세션"을 찾는데, 서버에는
 *    저장된 세션이 없어서 언제나 null 이 됩니다 — 헤더를 붙여 두고도
 *    로그인 안 한 사람으로 읽힙니다.
 *
 *    getUser(token) 은 Supabase 에 물어 서명과 만료를 확인하고 옵니다.
 *    글자만 보고 통과시키지 않습니다.
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServer()
  if (!supabase) return null

  const token = await bearerToken()
  const { data } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser()
  return data.user ?? null
}
