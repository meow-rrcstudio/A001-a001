// lib/supabase/server-env.ts
// 서버에서만 쓰는 Supabase 비밀 키.
//
// ⚠️ 이 파일을 "use client" 파일에서 import 하지 마세요.
//    이 키는 RLS 를 통째로 무시합니다. 새어나가면 아무나 남의 기록을 읽고
//    자기 크레딧을 무한히 충전할 수 있습니다. 부르는 곳은 app/api/** 뿐이어야
//    합니다.
//
// 이름을 두 가지로 받는 이유는 lib/supabase/env.ts 와 같습니다 —
// Supabase 가 service_role 을 secret 으로 바꿔 부르기 시작했습니다.
import "server-only"

export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

export const hasSupabaseSecret = Boolean(SUPABASE_SECRET_KEY)
