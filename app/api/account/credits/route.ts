// app/api/account/credits/route.ts
// 크레딧이 어디로 갔는지 — 내역을 그대로 돌려줍니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ "두 번밖에 안 물었는데 네 장이 나갔다"를 눈으로 확인할 방법이
// │ 없었습니다. 화면에는 잔액 하나만 있었고, 내역은 DB 안에만 있어서
// │ 무엇이 언제 왜 나갔는지 아무도 알 수 없었습니다.
// │
// │ 잔액은 원래 이 줄들을 더한 값입니다(credit_balance 뷰). 그 줄을
// │ 그대로 보여주면 셈이 맞는지 본인이 확인할 수 있습니다 — 돈이 걸린
// │ 값은 "믿어달라"가 아니라 보여줘야 합니다.
// └──────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server"
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** 한 번에 보여줄 줄 수 — 이보다 옛것은 아직 화면에 필요하지 않습니다 */
const LIMIT = 60

export async function POST() {
  const user = await getCurrentUser()
  // 로그인 전에는 보여줄 내역이 없습니다. 오류가 아니라 빈 목록입니다.
  if (!user) return NextResponse.json({ entries: null })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ entries: null })

  // ⚠️ select("*") 입니다. 칸 이름을 하나하나 적으면, 그 중 하나가 없는
  //    프로젝트에서 조회가 통째로 실패합니다 — 예전에 rating 칸 때문에
  //    "이 타로점은 찾을 수 없어요"가 떴던 것과 같은 실수입니다.
  const { data, error } = await admin
    .from("credit_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(LIMIT)

  if (error) {
    console.error("[account/credits] 내역을 못 읽었습니다:", error.message)
    return NextResponse.json({ entries: null })
  }

  return NextResponse.json({
    entries: (data ?? []).map((row) => ({
      delta: row.delta as number,
      reason: String(row.reason),
      readingId: (row.reading_id as string | null) ?? null,
      at: String(row.created_at),
    })),
  })
}
