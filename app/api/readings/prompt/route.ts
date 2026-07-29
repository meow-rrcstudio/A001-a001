// app/api/readings/prompt/route.ts
// 무료 흐름(프롬프트 복사)으로 본 타로점을 기록에 남깁니다.
//
// ┌─ 왜 남기는가 ─────────────────────────────────────────────────────
// │ 무료로 본 사람은 카드만 뽑고 밖으로 나갑니다. 그 흔적이 하나도 없으면
// │ 돌아올 이유가 없습니다. 무엇을 언제 뽑았는지 남겨두면
// │   · 나중에 다시 열어볼 수 있고
// │   · "이 판을 샨티와 이어서 이야기해 볼래요?" 를 권할 수 있습니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 크레딧을 깎지 않습니다. 우리가 해석을 만들어 주지 않았으니까요.
//    깎는 곳은 해석을 만드는 자리(app/api/reading) 한 곳뿐입니다.
//
// ⚠️ 표에 새 칸을 만들지 않았습니다. result(jsonb) 안에 kind:"prompt" 를
//    적어 구분합니다 — 칸을 추가하면 이미 만들어진 프로젝트에서 SQL 을
//    한 번 더 실행해야 하고, 안 하면 이 기능이 통째로 죽습니다.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface Body {
  question?: string
  topicLabel?: string
  layoutKey?: string
  positions?: string[]
  cards?: { name: string; reversed: boolean; imageUrl: string }[]
  promptText?: string
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 로그인 전이면 서버에 남길 자리가 없습니다. 화면이 브라우저에 담습니다.
  if (!user) return NextResponse.json({ id: null })

  const limited = rateLimit(rateKey("prompt-save", user.id, request), 20, 10 * 60_000)
  if (limited) return limited

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ id: null })

  const question = String(body.question ?? "").trim().slice(0, 500)
  const cards = Array.isArray(body.cards) ? body.cards.slice(0, 12) : []

  const { data, error } = await admin
    .from("readings")
    .insert({
      user_id: user.id,
      question: question || String(body.topicLabel ?? "타로점").slice(0, 500),
      layout_key: body.layoutKey ?? null,
      positions: body.positions ?? null,
      cards,
      result: {
        kind: "prompt",
        title: question || body.topicLabel || "타로점",
        summary: `카드 ${cards.length}장을 뽑았어요. 프롬프트를 복사해 밖에서 읽어본 타로점입니다.`,
        promptText: String(body.promptText ?? "").slice(0, 8000),
      },
      // 무료로 본 판이라 이어묻기 몫이 없습니다. 유료로 이어갈 때 늘려줍니다.
      followups_allowed: 0,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[readings/prompt] 못 남겼습니다:", error.message)
    return NextResponse.json({ id: null })
  }

  return NextResponse.json({ id: data.id })
}
