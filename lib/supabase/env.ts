// lib/supabase/env.ts
// Supabase 접속에 필요한 값 — 브라우저에서도 읽는 것들입니다.
//
// ⚠️ 여기에 비밀 키를 두지 마세요. 그건 lib/supabase/server-env.ts 에 있습니다.
//
// 이름을 두 가지로 받는 이유:
//   Supabase 가 최근에 키 이름을 바꿨습니다(anon → publishable). 대시보드가
//   어느 쪽 이름을 알려주느냐가 프로젝트마다 달라서, 둘 중 무엇으로
//   넣었든 동작하게 해 둡니다. 이름이 안 맞아서 로그인이 안 되는데
//   원인을 못 찾는 상황이 제일 나쁩니다.
//
// ⚠️ process.env.NEXT_PUBLIC_* 는 빌드할 때 글자 그대로 박히므로,
//    변수로 돌려서 읽으면(process.env[name]) 브라우저에서 빈 값이 됩니다.
//    반드시 아래처럼 곧이곧대로 적어야 합니다.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

/** 브라우저에 나가는 키. 나가도 되는 키이지만 RLS 가 켜져 있어야 안전합니다. */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""

/** 로그인·기록을 쓸 준비가 됐는지 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
