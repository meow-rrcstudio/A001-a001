// lib/supabase/client.ts
// 브라우저에서 쓰는 Supabase 연결입니다. 로그인·로그아웃이 여기를 거칩니다.
//
// 세션은 쿠키에 담깁니다. localStorage 가 아니라 쿠키여야 서버(app/api/**)도
// "누가 부른 요청인지" 알 수 있습니다 — 크레딧을 서버에서 깎으려면 꼭 필요합니다.
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env"

/**
 * 브라우저용 연결. 설정이 안 돼 있으면 null 입니다.
 *
 * ⚠️ null 을 그냥 무시하지 마세요. 화면은 "아직 로그인을 못 씁니다"를
 *    사용자에게 알려야 합니다. 조용히 아무 일도 안 일어나면 "눌러도
 *    반응이 없는" 화면이 됩니다.
 */
export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
}

export { isSupabaseConfigured }
