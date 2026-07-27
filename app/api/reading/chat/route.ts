// app/api/reading/chat/route.ts
// 해석을 받은 뒤 이어지는 면담(추가 질문)에 답합니다.
//
// 답은 만들어지는 대로 흘려보냅니다 — 해석과 같은 NDJSON 방식이라
// 받는 쪽 코드도 같은 모양입니다.
//
// 카드를 더 봐야 한다고 샨티가 판단하면 답 끝에 draw 가 붙습니다.
//   · mode="shanti" — 여기서 바로 뽑아 카드까지 실어 보냅니다
//   · mode="user"   — 뽑을 자리만 알려주고, 고르는 건 화면이 맡습니다
//
// 로그인한 사람이, 자기 판에 대해서만 부를 수 있습니다.
// 이어묻기 횟수도 여기서 셉니다 — 화면에서만 세면 그 셈을 건너뛸 수 있습니다.
import { NextResponse } from "next/server"
import { allTarotCards } from "@/lib/tarot-cards"
import { buildChatMessages, type ChatContext } from "@/lib/reading-prompt-templates"
import { streamGeminiJson } from "@/lib/ai/gemini"
import { CHAT_DRAW_MAX, CHAT_JSON_SCHEMA } from "@/lib/ai/reading-chat"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** 면담 답은 해석보다 훨씬 짧습니다 */
const CHAT_MAX_TOKENS = 2000

/**
 * 이미 나온 카드를 빼고 count 장을 뽑습니다 (20% 역방향).
 *
 * 같은 카드가 두 번 나오면 "아까 그 카드가 또?" 하고 읽는 이가 걸립니다.
 */
function drawCards(count: number, exclude: string[]) {
  const used = new Set(exclude)
  const pool = allTarotCards.filter((c) => !used.has(c.nameKo))
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
  return picked.map((card) => ({
    name: card.nameKo,
    reversed: Math.random() < 0.2,
    imageUrl: card.imageUrl,
  }))
}

export async function POST(request: Request) {
  let body: ChatContext
  try {
    body = (await request.json()) as ChatContext
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const message = String(body.message ?? "").trim()
  if (!message) {
    return NextResponse.json({ error: "물음이 비어 있습니다." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const owned = await requireOwnedReading(guard.value, body.readingId)
  if (!owned.ok) return owned.response

  // 한 장 몫을 다 썼는지 — 세는 곳도 서버여야 합니다.
  // 화면에서만 세면 새로고침 한 번으로 초기화됩니다.
  if (owned.value) {
    const admin = getSupabaseAdmin()
    const { count } = (await admin
      ?.from("reading_turns")
      .select("id", { count: "exact", head: true })
      .eq("reading_id", owned.value.id)
      .eq("role", "user")) ?? { count: 0 }

    if ((count ?? 0) >= owned.value.followupsAllowed) {
      return NextResponse.json(
        { error: "이 판으로는 여기까지예요.", needCredits: true },
        { status: 402 }
      )
    }
  }

  const context: ChatContext = {
    question: String(body.question ?? "").slice(0, 300),
    cards: Array.isArray(body.cards) ? body.cards.slice(0, 20) : [],
    reading: body.reading,
    // 대화가 길어지면 앞쪽은 흘려보냅니다 (프롬프트가 무한정 자라지 않도록).
    turns: Array.isArray(body.turns) ? body.turns.slice(-12) : [],
    message: message.slice(0, 1000),
    readingId: body.readingId,
  }

  const { system, user } = buildChatMessages(context)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"))

      try {
        let last = ""
        for await (const accumulated of streamGeminiJson({
          system,
          user,
          schema: CHAT_JSON_SCHEMA,
          maxOutputTokens: CHAT_MAX_TOKENS,
        })) {
          last = accumulated
          send({ partial: accumulated })
        }

        // 다 받은 뒤에만 뽑기 요청을 살핍니다 — 흘러오는 도중의 반쪽짜리
        // draw 를 보고 카드를 뽑아버리면 안 되기 때문입니다.
        const draw = readDrawRequest(last)
        let drawn: { name: string; reversed: boolean; imageUrl: string }[] | null = null
        if (draw?.mode === "shanti") {
          const exclude = context.cards.map((c) => c.name)
          drawn = drawCards(draw.positions.length, exclude)
          send({ drawnCards: drawn })
        }

        // 오간 말을 판에 남깁니다.
        // ⚠️ 이게 없으면 위에서 세는 이어묻기 횟수가 영원히 0 이라
        //    한 장 몫이 무한이 됩니다.
        if (owned.value) {
          const reply = (() => {
            try {
              return String((JSON.parse(last) as { reply?: string }).reply ?? "")
            } catch {
              return ""
            }
          })()
          await getSupabaseAdmin()
            ?.from("reading_turns")
            .insert([
              { reading_id: owned.value.id, role: "user", body: context.message },
              ...(reply
                ? [
                    {
                      reading_id: owned.value.id,
                      role: "shanti",
                      body: reply,
                      cards: drawn,
                    },
                  ]
                : []),
            ])
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        send({ error: detail })
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

/** 다 받은 JSON 에서 뽑기 요청만 꺼냅니다. 이상하면 없는 셈 칩니다. */
function readDrawRequest(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      draw?: { mode?: string; positions?: { label?: string; guide?: string }[] }
    }
    const draw = parsed.draw
    if (!draw || !Array.isArray(draw.positions)) return null
    if (draw.positions.length < 1 || draw.positions.length > CHAT_DRAW_MAX) return null
    if (draw.mode !== "shanti" && draw.mode !== "user") return null
    return { mode: draw.mode, positions: draw.positions }
  } catch {
    return null
  }
}
