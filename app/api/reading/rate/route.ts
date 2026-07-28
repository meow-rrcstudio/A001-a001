// app/api/reading/rate/route.ts
// 좋아요 / 싫어요를 남깁니다.
//
// 이게 답변 문체를 고칠 때 쓸 유일한 단서입니다. 화면에서만 켜지고
// 사라지면 "어떤 답이 별로였는지"를 나중에 되짚을 방법이 없습니다.
//
// 두 곳에 남습니다.
//   · 해석 자체        → readings.rating
//   · 이어지는 대화 한 마디 → reading_turns.rating
import { NextResponse } from "next/server"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface RateBody {
  readingId?: string
  /**
   * 몇 번째 샨티 답인지 (0부터). 없으면 해석 자체를 평가한 것입니다.
   * 대화는 뒤에 붙기만 하므로 순서가 흔들리지 않습니다.
   */
  shantiTurnIndex?: number
  /** 1 좋아요 · -1 싫어요 · 0 취소(다시 눌러 껐을 때) */
  rating?: number
}

export async function POST(request: Request) {
  let body: RateBody
  try {
    body = (await request.json()) as RateBody
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 })
  }

  const rating = body.rating === 1 ? 1 : body.rating === -1 ? -1 : null
  if (body.rating !== 0 && rating === null) {
    return NextResponse.json({ error: "값이 올바르지 않아요." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const owned = await requireOwnedReading(guard.value, body.readingId)
  if (!owned.ok) return owned.response

  // 연결 전(검토용)에는 남길 곳이 없습니다. 화면은 그대로 켜집니다.
  if (!owned.value) return NextResponse.json({ ok: true, saved: false })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ ok: true, saved: false })

  if (body.shantiTurnIndex === undefined) {
    await admin.from("readings").update({ rating }).eq("id", owned.value.id)
    return NextResponse.json({ ok: true, saved: true })
  }

  // 샨티가 한 말들만 순서대로 꺼내 그중 몇 번째인지로 찾습니다.
  const { data: turns } = await admin
    .from("reading_turns")
    .select("id")
    .eq("reading_id", owned.value.id)
    .eq("role", "shanti")
    .order("id", { ascending: true })

  const target = turns?.[body.shantiTurnIndex]
  if (!target) {
    return NextResponse.json({ error: "그 답을 찾을 수 없어요." }, { status: 404 })
  }

  await admin.from("reading_turns").update({ rating }).eq("id", target.id)
  return NextResponse.json({ ok: true, saved: true })
}
