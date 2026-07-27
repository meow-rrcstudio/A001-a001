// lib/server/guard.ts
// "이 요청을 받아줘도 되는가"를 서버에서 판단합니다.
//
// 지금까지 이 판단이 화면에만 있었습니다. 화면은 사용자 편이라, 주소를
// 알면 그냥 부를 수 있었습니다 — 크레딧 없이 해석을 받을 수 있었다는 뜻입니다.
//
// 규칙은 두 가지입니다.
//   1) 로그인한 사람인가
//   2) 이 타로점이 정말 그 사람의 것인가 (남의 판에 끼어들지 못하게)
import "server-only"

import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"

/** 통과하면 사용자, 막히면 그대로 돌려보낼 응답 */
export type Guarded<T> = { ok: true; value: T } | { ok: false; response: NextResponse }

function deny(message: string, status: number): Guarded<never> {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) }
}

/**
 * 로그인한 사람만 통과.
 *
 * ⚠️ Supabase 연결 전에는 통과시킵니다. 아직 로그인 기능이 없던 때의
 *    미리보기 검토가 멈추지 않도록 둔 문입니다. 연결이 끝나면(지금처럼
 *    환경변수가 들어와 있으면) 자동으로 닫힙니다.
 */
export async function requireUser(): Promise<Guarded<User | null>> {
  if (!isSupabaseConfigured) return { ok: true, value: null }

  const user = await getCurrentUser()
  if (!user) return deny("로그인이 필요해요.", 401)
  return { ok: true, value: user }
}

/**
 * 이 타로점이 그 사람 것인지 확인합니다.
 *
 * readingId 를 몸통에 실어 보내는 것만으로는 부족합니다 — 남의 id 를 적어
 * 보낼 수 있으니, 주인이 맞는지 여기서 대조합니다.
 */
export async function requireOwnedReading(
  user: User | null,
  readingId: string | undefined
): Promise<Guarded<{ id: string; followupsAllowed: number } | null>> {
  // 연결 전이면 검사할 것이 없습니다 (위와 같은 이유)
  if (!user) return { ok: true, value: null }

  if (!readingId) return deny("타로점을 찾을 수 없어요.", 400)

  const admin = getSupabaseAdmin()
  if (!admin) return deny("서버 설정이 아직 없어요.", 503)

  const { data } = await admin
    .from("readings")
    .select("id, user_id, followups_allowed")
    .eq("id", readingId)
    .maybeSingle()

  if (!data) return deny("타로점을 찾을 수 없어요.", 404)
  // 남의 판이면 "없다"고 답합니다 — 있는지 없는지도 알려줄 이유가 없습니다.
  if (data.user_id !== user.id) return deny("타로점을 찾을 수 없어요.", 404)

  return { ok: true, value: { id: data.id, followupsAllowed: data.followups_allowed } }
}
