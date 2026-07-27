// app/api/readings/route.ts
// 내가 본 타로점 목록. MY 기록 화면이 이걸 봅니다.
//
// 예전에는 브라우저(localStorage)에 있어서 폰을 바꾸면 사라지고,
// 폰과 PC 가 서로 다른 기록을 봤습니다. 이제 서버가 들고 있습니다.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** 목록 한 줄 — 화면이 그리는 데 필요한 만큼만 */
export interface ReadingSummary {
  id: string
  /** 언제 봤는지 (ISO) */
  at: string
  question: string
  /** 해석 첫 문단을 줄여서 */
  summary: string
  cardImages: string[]
}

export async function GET(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 연결 전(검토용)에는 서버에 기록이 없습니다. 화면이 알아서
  // 브라우저 보관함을 씁니다.
  if (!user) return NextResponse.json({ readings: null })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ readings: [] })

  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 60)

  const { data, error } = await admin
    .from("readings")
    .select("id, created_at, question, cards, result")
    .eq("user_id", user.id)
    // 해석을 못 받고 끝난 판은 목록에 띄우지 않습니다 (빈 줄이 됩니다)
    .not("result", "is", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200))

  if (error) {
    console.error("[readings] 목록을 못 읽었습니다:", error.message)
    return NextResponse.json({ readings: [] })
  }

  const readings: ReadingSummary[] = (data ?? []).map((row) => {
    const result = row.result as { summary?: string } | null
    const cards = (row.cards ?? []) as { imageUrl?: string }[]
    return {
      id: row.id,
      at: row.created_at,
      question: row.question,
      summary: result?.summary ?? "",
      cardImages: cards.map((c) => c.imageUrl ?? ""),
    }
  })

  return NextResponse.json({ readings })
}
