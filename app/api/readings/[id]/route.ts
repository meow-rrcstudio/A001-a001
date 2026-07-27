// app/api/readings/[id]/route.ts
// 예전에 본 타로점 한 건을 그때 대화 그대로 돌려줍니다 (/my/[id] 가 씁니다).
import { NextResponse } from "next/server"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  // 남의 판이면 "없다"고 답합니다 (주인 확인은 여기 한 곳에서)
  const owned = await requireOwnedReading(guard.value, id)
  if (!owned.ok) return owned.response

  if (!owned.value) return NextResponse.json({ reading: null })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ reading: null })

  const { data } = await admin
    .from("readings")
    .select("id, created_at, question, layout_key, positions, cards, result")
    .eq("id", id)
    .maybeSingle()

  if (!data) return NextResponse.json({ reading: null })

  const { data: turns } = await admin
    .from("reading_turns")
    .select("role, body, cards")
    .eq("reading_id", id)
    .order("id", { ascending: true })

  return NextResponse.json({
    reading: {
      id: data.id,
      at: data.created_at,
      question: data.question,
      topicLabel: data.question,
      layoutKey: data.layout_key ?? undefined,
      positions: data.positions ?? undefined,
      cards: data.cards ?? [],
      result: data.result,
      turns: (turns ?? []).map((t) => ({
        role: t.role as "user" | "shanti",
        text: t.body,
        cards: t.cards ?? undefined,
      })),
    },
  })
}
