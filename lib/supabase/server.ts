// lib/supabase/server.ts
// 서버(라우트 핸들러·서버 컴포넌트)에서 쓰는 Supabase 연결.
//
// 두 가지를 만듭니다.
//   · getSupabaseServer()  — 로그인한 그 사람의 자격으로 봅니다. RLS 가 걸려
//                            본인 것만 보입니다. 평소엔 이걸 쓰세요.
//   · getSupabaseAdmin()   — RLS 를 무시하는 연결. 크레딧을 얹어주는 것처럼
//                            "사용자가 스스로 하면 안 되는 일"에만 씁니다.
import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env"
import { SUPABASE_SECRET_KEY } from "@/lib/supabase/server-env"

/** 로그인한 사람의 자격으로 보는 연결. 설정이 없으면 null */
export async function getSupabaseServer() {
  if (!isSupabaseConfigured) return null
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

/** 지금 요청을 보낸 사람. 로그인 안 했으면 null */
export async function getCurrentUser() {
  const supabase = await getSupabaseServer()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
