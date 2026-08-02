// app/api/readings/claim/route.ts
// 로그인 전에 브라우저에만 있던 타로점을 방금 로그인한 사람 앞으로 옮깁니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 비로그인으로 본 판은 브라우저(localStorage)에만 남습니다. 그런데 MY
// │ 기록 화면은 로그인하면 서버만 봅니다 — 로그아웃한 뒤에도 앞사람이 본
// │ 타로점이 그대로 보이던 것을 막느라 그렇게 해두었습니다
// │ (lib/reading-history.ts 의 401 처리).
// │
// │ 그 둘이 겹치면서, 맛보기를 보고 로그인한 사람은 방금 읽은 판이
// │ 기록에서 통째로 사라지는 것을 봅니다. 옮길 자리가 없어서가 아니라
// │ 옮기는 사람이 없어서 생긴 일입니다. 이 파일이 그 일을 합니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 옮긴 뒤 브라우저 쪽은 화면이 지웁니다(lib/claim-readings.ts). 여기서
//    지우라고 시키는 것이 아니라, 옮겨진 id 를 돌려주면 화면이 그것만
//    지웁니다 — 일부만 옮겨졌을 때 나머지가 함께 사라지지 않도록.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** 한 번에 옮길 수 있는 최대 건수 */
const MAX_PER_CALL = 20

/**
 * 맛보기 판을 데려온 사람에게 열어주는 이어묻기 횟수.
 *
 * ┌─ 왜 선물하는가 ───────────────────────────────────────────────────
 * │ 맛보기 화면의 넛지는 "로그인하면 이 몸과 직접 대화를 이어갈 수 있다"고
 * │ 말합니다. 그런데 맛보기 판은 followups_allowed 가 0 이라, 로그인해도
 * │ 대화창이 잠겨 있었습니다 — 약속과 화면이 어긋났습니다.
 * │ 지키지 못할 말을 지우는 대신, 말을 지키는 쪽을 골랐습니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 처음 옮겨오는 사람에게 한 번만 줍니다 (아래 isFirstClaim).
 *    판마다 줬다면 로그아웃 → 맛보기 → 로그인을 되풀이해서 대화를
 *    무한정 공짜로 쓸 수 있습니다.
 */
const WELCOME_FOLLOWUPS = 3

interface IncomingReading {
  id?: string
  question?: string
  topicLabel?: string
  at?: string
  layoutKey?: string
  positions?: string[]
  cards?: { name: string; reversed: boolean; imageUrl: string }[]
  promptText?: string
  result?: {
    title?: string
    summary?: string
    keywords?: string[]
    sections?: { heading?: string; body?: string }[]
  }
}

export async function POST(request: Request) {
  let body: { readings?: IncomingReading[] }
  try {
    body = (await request.json()) as { readings?: IncomingReading[] }
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 로그인 전이면 옮길 곳이 없습니다. 브라우저에 그대로 둡니다.
  if (!user) return NextResponse.json({ claimed: [] })

  const limited = rateLimit(rateKey("readings-claim", user.id, request), 10, 10 * 60_000)
  if (limited) return limited

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ claimed: [] })

  const incoming = Array.isArray(body.readings) ? body.readings.slice(0, MAX_PER_CALL) : []
  if (incoming.length === 0) return NextResponse.json({ claimed: [] })

  // 이 사람이 서버에 가진 판이 하나도 없으면 "처음 데려오는 길"입니다.
  // 이어묻기 선물은 그때 한 번만 나갑니다.
  const { count, error: countError } = await admin
    .from("readings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (countError) {
    console.error("[readings/claim] 기존 기록을 못 셌습니다:", countError.message)
    return NextResponse.json({ claimed: [] })
  }
  const isFirstClaim = (count ?? 0) === 0

  // 옛것부터 넣습니다 — 목록이 시간 순서대로 쌓이고, 선물을 받을
  // "가장 최근 판"이 마지막에 오도록.
  const ordered = [...incoming].sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? "")))

  // 옮긴 판의 옛 주소(브라우저 id)와 새 주소(서버 id) 짝.
  //
  // ⚠️ 짝을 돌려주는 것이 중요합니다. 서버에 넣으면 id 가 새로 붙는데,
  //    맛보기 화면의 로그인 넛지는 옛 주소로 돌아올 길을 걸어둡니다
  //    (/my/{브라우저 id}). 짝이 없으면 로그인을 마치고 돌아온 사람은
  //    "찾을 수 없어요" 화면을 봅니다 — 고치려던 바로 그 증상입니다.
  const claimed: { localId: string; serverId: string }[] = []

  for (const [index, item] of ordered.entries()) {
    const localId = String(item.id ?? "").trim()
    if (!localId) continue

    const question = String(item.question ?? item.topicLabel ?? "타로점").trim().slice(0, 500)
    const cards = Array.isArray(item.cards) ? item.cards.slice(0, 12) : []

    // 선물은 가장 최근 한 판에만 (그 사람이 방금 읽고 있던 판입니다)
    const isNewest = index === ordered.length - 1
    const followups = isFirstClaim && isNewest ? WELCOME_FOLLOWUPS : 0

    const { data, error } = await admin.from("readings").insert({
      user_id: user.id,
      question,
      // 브라우저에 적힌 시각을 그대로 씁니다. 옮긴 시각으로 바꾸면
      // 어제 본 판이 오늘 본 것으로 목록에 섞입니다.
      ...(item.at && !Number.isNaN(new Date(item.at).getTime())
        ? { created_at: new Date(item.at).toISOString() }
        : {}),
      layout_key: item.layoutKey ?? null,
      positions: item.positions ?? null,
      cards,
      result: {
        kind: "prompt",
        title: String(item.result?.title ?? question).slice(0, 200),
        summary: String(item.result?.summary ?? "").slice(0, 1000),
        ...(Array.isArray(item.result?.keywords)
          ? { keywords: item.result.keywords.slice(0, 12).map((k) => String(k).slice(0, 60)) }
          : {}),
        ...(Array.isArray(item.result?.sections)
          ? {
              sections: item.result.sections.slice(0, 12).map((s) => ({
                heading: String(s?.heading ?? "").slice(0, 120),
                body: String(s?.body ?? "").slice(0, 4000),
              })),
            }
          : {}),
        promptText: String(item.promptText ?? "").slice(0, 8000),
      },
      followups_allowed: followups,
    })
      .select("id")
      .single()

    if (error || !data) {
      // 한 건이 깨져도 나머지는 계속 옮깁니다. 못 옮긴 것은 claimed 에
      // 안 들어가므로 브라우저에 남아 다음 기회를 얻습니다.
      console.error("[readings/claim] 한 건을 못 옮겼습니다:", error?.message)
      continue
    }

    claimed.push({ localId, serverId: data.id as string })
  }

  return NextResponse.json({ claimed, welcomeFollowups: isFirstClaim ? WELCOME_FOLLOWUPS : 0 })
}
