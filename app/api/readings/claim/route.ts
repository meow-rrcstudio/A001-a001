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
 * ⚠️ 여기서 이어묻기 횟수를 정하지 않습니다.
 *
 *    한동안 이 파일이 자기 몫으로 3 을 들고 있었습니다(lib/credit-rules.ts
 *    와 두 벌이었습니다). 그리고 그 3 을 "가장 최근 한 판"에만 붙였는데,
 *    맛보기를 두 번 이상 본 사람은 나머지 판이 0회라서, 그 판에서
 *    대화하려면 별조각을 써야 했습니다 — 가입 선물이 그 자리에서
 *    사라지는 길이었습니다.
 *
 *    이제 선물 3회는 계정에 있고(profiles.welcome_followups_left),
 *    아래에서 데려온 판 하나로 끌어옵니다. 이미 다른 판에서 썼다면
 *    아무것도 붙지 않습니다 — 선물은 모두 합쳐 세 번입니다.
 */

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
  // 데려온 판에 실제로 붙은 선물 횟수 (화면이 안내 문구에 씁니다)
  let welcomeFollowups = 0

  for (const [index, item] of ordered.entries()) {
    const localId = String(item.id ?? "").trim()
    if (!localId) continue

    const question = String(item.question ?? item.topicLabel ?? "타로점").trim().slice(0, 500)
    const cards = Array.isArray(item.cards) ? item.cards.slice(0, 12) : []

    // 데려온 판은 0회로 넣고, 아래에서 가장 최근 한 판에만 계정 선물을
    // 끌어옵니다 (그 사람이 방금 읽고 있던 판입니다).
    const isNewest = index === ordered.length - 1

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
      followups_allowed: 0,
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

    // 방금 읽고 있던 판에 선물 이어묻기를 끌어옵니다. 계정에 남아 있지
    // 않으면(이미 썼으면) 아무 일도 일어나지 않습니다.
    if (isNewest) {
      const { data: granted, error: giftError } = await admin.rpc("claim_welcome_followups", {
        p_user_id: user.id,
        p_reading_id: data.id as string,
      })
      if (giftError) {
        console.warn("[readings/claim] 선물 이어묻기를 못 끌어왔습니다:", giftError.message)
      } else if (typeof granted === "number") {
        welcomeFollowups = granted
      }
    }
  }

  return NextResponse.json({ claimed, welcomeFollowups })
}
