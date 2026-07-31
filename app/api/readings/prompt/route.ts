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
import { readDrawSignals } from "@/lib/server/draw-signals"

export const dynamic = "force-dynamic"

interface Body {
  question?: string
  topicLabel?: string
  layoutKey?: string
  positions?: string[]
  cards?: { name: string; reversed: boolean; imageUrl: string }[]
  promptText?: string
  /** 이 판을 어떻게 뽑았는지 (lib/draw-signals.ts). 남기기만 합니다 */
  signals?: unknown
  /** 맛보기 해석 (샨티가 읽어준 글). 없으면 카드만 뽑은 판입니다 */
  result?: {
    title?: string
    summary?: string
    keywords?: string[]
    sections?: { heading?: string; body?: string }[]
  }
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

  // 화면이 보낸 해석 — 길이만 잘라 담습니다. 이 글은 이 사람에게 다시
  // 보여줄 뿐이라 다른 곳으로 새지 않습니다.
  const reading = body.result?.title
    ? {
        title: String(body.result.title).slice(0, 200),
        summary: String(body.result.summary ?? "").slice(0, 1000),
        keywords: Array.isArray(body.result.keywords)
          ? body.result.keywords.slice(0, 12).map((k) => String(k).slice(0, 60))
          : undefined,
        sections: Array.isArray(body.result.sections)
          ? body.result.sections.slice(0, 12).map((s) => ({
              heading: String(s?.heading ?? "").slice(0, 120),
              body: String(s?.body ?? "").slice(0, 4000),
            }))
          : undefined,
      }
    : null

  const { data, error } = await admin
    .from("readings")
    .insert({
      user_id: user.id,
      question: question || String(body.topicLabel ?? "타로점").slice(0, 500),
      layout_key: body.layoutKey ?? null,
      positions: body.positions ?? null,
      cards,
      // 맛보기 해석을 받았으면 그 글을 그대로 남깁니다. 안 남기면 기록에서
      // 다시 열었을 때 "카드만 뽑은 판"으로 보입니다.
      //
      // ⚠️ kind:"prompt" 는 해석이 있어도 그대로 둡니다. 이 값은 "글이
      //    있느냐"가 아니라 "이어서 물을 수 있는 판이냐"를 가릅니다 —
      //    맛보기 판은 이어묻기 몫이 0 이라 대화 화면을 열면 안 됩니다.
      result: {
        kind: "prompt",
        title: reading?.title || question || body.topicLabel || "타로점",
        summary:
          reading?.summary ||
          `카드 ${cards.length}장을 뽑았어요. 프롬프트를 복사해 밖에서 읽어본 타로점입니다.`,
        ...(reading?.keywords ? { keywords: reading.keywords } : {}),
        ...(reading?.sections ? { sections: reading.sections } : {}),
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

  // ── 이 판을 어떻게 뽑았는지 ──────────────────────────────────────
  // ⚠️ 위 insert 에 끼워 넣지 않고 따로 씁니다. draw_signals 칸을 아직
  //    안 만든 배포에서는 이 줄이 실패하는데, 함께 넣었다면 판 저장이
  //    통째로 실패했을 겁니다 — 기록이 안 남는 것이 신호를 잃는 것보다
  //    훨씬 나쁩니다. (rating 칸 때 실제로 그렇게 죽었습니다)
  const signals = readDrawSignals(body.signals)
  if (signals) {
    const { error: signalError } = await admin
      .from("readings")
      .update({ draw_signals: signals })
      .eq("id", data.id)
    if (signalError) {
      console.warn("[readings/prompt] 뽑기 신호를 못 남겼습니다:", signalError.message)
    }
  }

  return NextResponse.json({ id: data.id })
}
