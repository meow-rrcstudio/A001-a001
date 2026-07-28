// app/api/readings/[id]/route.ts
// 예전에 본 타로점 한 건을 그때 대화 그대로 돌려줍니다 (/my/[id] 가 씁니다).
import { NextResponse } from "next/server"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { restoreCards } from "@/lib/server/reading-cards"

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

  // ⚠️ 칸 이름을 하나하나 적지 않고 통째로 받습니다.
  //    적어둔 칸 중 하나라도 DB 에 없으면 조회 전체가 실패하는데, 그러면
  //    "이 타로점은 찾을 수 없어요" 만 뜨고 왜인지 알 수가 없습니다.
  //    (rating 칸을 나중에 더했을 때 실제로 이렇게 막혔습니다 — 목록은
  //     그 칸을 안 읽어서 멀쩡했고 상세만 죽어서 더 헷갈렸습니다)
  const { data, error } = await admin.from("readings").select("*").eq("id", id).maybeSingle()

  if (error) console.error("[readings/:id] 타로점을 못 읽었습니다:", error.message)
  if (!data) return NextResponse.json({ reading: null })

  const { data: turns, error: turnsError } = await admin
    .from("reading_turns")
    .select("*")
    .eq("reading_id", id)
    .order("id", { ascending: true })

  if (turnsError) console.error("[readings/:id] 대화를 못 읽었습니다:", turnsError.message)

  return NextResponse.json({
    reading: {
      id: data.id,
      at: data.created_at,
      question: data.question,
      topicLabel: data.question,
      layoutKey: data.layout_key ?? undefined,
      positions: data.positions ?? undefined,
      // 그림 주소가 빠진 옛 기록은 카드 이름으로 채워 넣습니다
      cards: restoreCards(data.cards),
      result: data.result,
      rating: data.rating ?? null,
      turns: (turns ?? []).map((t) => ({
        role: t.role as "user" | "shanti",
        text: t.body,
        cards: t.cards ? restoreCards(t.cards) : undefined,
        rating: t.rating ?? null,
      })),
    },
  })
}
