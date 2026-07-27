// app/api/reading/extend/route.ts
// "한 장 더 쓰고 이어서 묻기" — 크레딧 한 장을 더 내고 이어묻기 몫을 늘립니다.
//
// 늘리는 것도 서버가 해야 합니다. 화면에서만 늘리면 새로고침 한 번으로
// 얼마든지 늘릴 수 있습니다.
import { NextResponse } from "next/server"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/credit-rules"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let readingId: string | undefined
  try {
    readingId = ((await request.json()) as { readingId?: string }).readingId
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const owned = await requireOwnedReading(guard.value, readingId)
  if (!owned.ok) return owned.response

  // 연결 전(검토용)에는 화면 쪽 셈을 그대로 씁니다
  if (!owned.value || !guard.value) {
    return NextResponse.json({ followupsAllowed: FOLLOWUPS_PER_CREDIT })
  }

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })

  const next = owned.value.followupsAllowed + FOLLOWUPS_PER_CREDIT

  // 열쇠에 늘어난 몫을 담습니다. 같은 단계에서 두 번 눌러도 한 번만 깎입니다.
  const { data: left, error } = await admin.rpc("spend_credit", {
    p_user_id: guard.value.id,
    p_reason: "extend",
    p_reading_id: owned.value.id,
    p_key: `extend:${owned.value.id}:${next}`,
  })

  if (error || typeof left !== "number" || left < 0) {
    return NextResponse.json({ error: "크레딧이 부족해요.", needCredits: true }, { status: 402 })
  }

  await admin.from("readings").update({ followups_allowed: next }).eq("id", owned.value.id)

  return NextResponse.json({ followupsAllowed: next, credits: left })
}
