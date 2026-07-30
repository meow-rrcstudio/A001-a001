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
import { streamErrorPayload, streamGeminiJson } from "@/lib/ai/gemini"
import { CHAT_DIGEST_MAX_CHARS, CHAT_DRAW_MAX, CHAT_JSON_SCHEMA } from "@/lib/ai/reading-chat"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { cleanMemos, readUserMemories, rememberFacts } from "@/lib/server/user-memory"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * 면담 답은 해석보다 훨씬 짧습니다. 그래도 넉넉히 둡니다.
 *
 * ⚠️ 이 한도는 "글자"만이 아니라 생각(thinking)에 쓴 토큰까지 함께
 *    깎습니다. 대화의 생각 예산이 1024 이므로, 2000 이면 실제로 쓸 수
 *    있는 것은 천 토큰 남짓이었습니다.
 *
 *    거기에 답(2~5문장)·뽑기 요청·다음 물음 제안에 더해 접어둔 이야기
 *    (CHAT_DIGEST_MAX_CHARS 자)와 새로 알게 된 것까지 얹히면 한도에
 *    닿습니다. 닿으면 글자를 한 자도 못 내놓고 finishReason=MAX_TOKENS 로
 *    끝나서, 화면에는 오류도 글도 없이 빈 칸만 남습니다 — 실제로 예전에
 *    그렇게 한 번 막혔습니다 (lib/ai/gemini.ts 주석 참고).
 *
 *    올려도 값이 더 들지 않습니다. 상한이지 목표가 아니라서, 짧게 답하면
 *    짧게 끝납니다.
 */
const CHAT_MAX_TOKENS = 4000

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

/** 화면이 보내온 "내가 직접 뽑은 카드"를 믿을 수 있는 모양으로만 걸러냅니다. */
function readDrawnByUser(raw: unknown) {
  if (!Array.isArray(raw)) return null
  const picked = raw
    .filter(
      (c): c is { name: string; reversed: boolean; imageUrl: string } =>
        !!c &&
        typeof c === "object" &&
        typeof (c as { name?: unknown }).name === "string" &&
        typeof (c as { imageUrl?: unknown }).imageUrl === "string"
    )
    .slice(0, CHAT_DRAW_MAX)
    .map((c) => ({
      name: c.name.slice(0, 60),
      reversed: c.reversed === true,
      imageUrl: c.imageUrl.slice(0, 500),
    }))
  return picked.length > 0 ? picked : null
}

export async function POST(request: Request) {
  let body: ChatContext & { drawnCards?: unknown }
  try {
    body = (await request.json()) as ChatContext & { drawnCards?: unknown }
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

  // 사람이 손으로 묻는 속도보다 훨씬 빠르면 사람이 아닙니다.
  // 판당 횟수(FOLLOWUPS_PER_CREDIT)와 별개로 "속도"를 봅니다.
  const limited = rateLimit(rateKey("chat", guard.value?.id, request), 20, 5 * 60_000)
  if (limited) return limited

  // 접어둔 이야기 — 열두 마디 밖으로 밀려난 앞부분이 여기 들어 있습니다.
  let digest: string | undefined
  // 이 판에서 누가 몇 번 뽑았는지. 샨티가 다음 뽑기를 고를 때 봅니다
  // (이 몸 2 : 묻는 이 1 — lib/reading-prompt-templates.ts 주석 참고).
  let drawTally: { shanti: number; user: number } | undefined
  // 이번 물음에 딸려온 "내가 직접 뽑은 카드"
  const drawnByUser = readDrawnByUser(body.drawnCards)

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
        { error: "이 판으로는 여기까지예요.", kind: "needCredits", needCredits: true },
        { status: 402 }
      )
    }

    // ⚠️ 못 읽어도 대화를 막지 않습니다. 칸을 더하는 SQL 을 아직 안 돌린
    //    배포가 있을 수 있는데, 여기서 던져버리면 대화가 통째로 죽습니다.
    //    예전에 rating 칸으로 실제로 그렇게 막혔습니다
    //    (app/api/readings/[id]/route.ts 주석 참고). 접어둔 이야기가 없으면
    //    최근 열두 마디만으로 답합니다 — 예전과 같은 상태일 뿐입니다.
    const folded = await admin
      ?.from("readings")
      .select("thread_digest")
      .eq("id", owned.value.id)
      .maybeSingle()

    if (folded?.error) {
      console.warn("[reading/chat] 접어둔 이야기를 못 읽었습니다:", folded.error.message)
    }
    digest = folded?.data?.thread_digest ?? undefined

    // 카드가 딸린 마디 = 뽑기가 있었던 마디입니다.
    // 샨티가 뽑았으면 샨티 마디에, 묻는 이가 뽑았으면 묻는이 마디에 붙습니다.
    const drawnTurns = await admin
      ?.from("reading_turns")
      .select("role")
      .eq("reading_id", owned.value.id)
      .not("cards", "is", null)

    if (drawnTurns?.error) {
      // 못 세면 비율 없이 갑니다 — 샨티가 물음의 결로만 고릅니다(예전과 같음).
      console.warn("[reading/chat] 뽑기 셈을 못 읽었습니다:", drawnTurns.error.message)
    } else {
      const rows = drawnTurns?.data ?? []
      drawTally = {
        shanti: rows.filter((r) => r.role === "shanti").length,
        user: rows.filter((r) => r.role === "user").length,
      }
    }
  }

  // 이 사람에 대해 지금까지 알게 된 것 — 이 판이 아니라 이 사람에 딸린
  // 값이라, 판을 확인하는 위 블록 밖에서 꺼냅니다.
  const memories = await readUserMemories(guard.value?.id)

  const cards = Array.isArray(body.cards) ? body.cards.slice(0, 20) : []

  // ── 예비 카드를 미리 뽑아 함께 들려보냅니다 ─────────────────────────
  // 샨티가 대신 뽑는 경우에 요청을 두 번 쓰지 않기 위해서입니다.
  // 예전 흐름: ① "더 뽑아야겠다" ② (서버가 뽑음) ③ "그 카드를 읽어달라"
  //            → 한 물음에 제미나이 호출 두 번.
  // 지금 흐름: 아직 안 나온 카드에서 미리 CHAT_DRAW_MAX 장을 뽑아 함께
  //            보내고, 샨티가 필요하면 앞에서부터 가져다 쓰면서 그 자리에서
  //            읽습니다 → 호출 한 번.
  //
  // 무작위성은 그대로입니다 — 뽑는 시점이 모델보다 앞이라 모델이 마음에
  // 드는 카드를 골라올 수 없습니다. 쓰지 않은 예비 카드는 아무에게도
  // 보이지 않으므로 없던 일이 됩니다.
  const reserve = drawCards(CHAT_DRAW_MAX, cards.map((c) => c.name))

  const context: ChatContext = {
    memories,
    question: String(body.question ?? "").slice(0, 300),
    cards,
    reading: body.reading,
    // ⚠️ 화면이 보내주는 값이 아닙니다. 판에 남아 있는 것을 서버가 꺼냅니다 —
    //    앞 이야기의 출처가 화면이면 새로고침 한 번에 사라집니다.
    digest,
    // 대화가 길어지면 앞쪽은 흘려보냅니다 (프롬프트가 무한정 자라지 않도록).
    // 흘려보낸 만큼은 위의 digest 에 접혀 있습니다.
    turns: Array.isArray(body.turns) ? body.turns.slice(-12) : [],
    drawTally,
    message: message.slice(0, 1000),
    readingId: body.readingId,
    reserve: reserve.map((c) => ({
      name: c.name,
      orientation: c.reversed ? "역방향" : "정방향",
    })),
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
          // 대화는 짧게 생각합니다 — 해석만큼 생각하면 품질은 그대로인데
          // 답이 오기까지의 빈 화면만 길어집니다 (lib/ai/gemini.ts 주석 참고)
          purpose: "chat",
        })) {
          last = accumulated
          send({ partial: accumulated })
        }

        // 다 받은 뒤에만 뽑기 요청을 살핍니다 — 흘러오는 도중의 반쪽짜리
        // draw 를 보고 카드를 뽑아버리면 안 되기 때문입니다.
        const draw = readDrawRequest(last)
        let drawn: { name: string; reversed: boolean; imageUrl: string }[] | null = null
        if (draw?.mode === "shanti") {
          // 샨티는 예비 카드를 앞에서부터 쓰기로 약속했습니다. 그 약속대로
          // 앞에서 필요한 장수만 떼어 화면에 보냅니다 — 여기서 새로 뽑으면
          // 답에 적힌 카드 이름과 화면에 깔리는 카드가 어긋납니다.
          drawn = reserve.slice(0, draw.positions.length)
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

          // ⚠️ 답을 못 받았으면 물음도 남기지 않습니다.
          //    이어묻기 횟수는 남은 "묻는이" 마디로 셉니다. 답이 없는데
          //    물음만 남기면, 받은 것 없이 한 번을 쓴 셈이 됩니다.
          //    (화면에는 "말문이 막혔구먼"이 뜨고 다시 물어보기가 붙습니다)
          if (reply) {
            await getSupabaseAdmin()
              ?.from("reading_turns")
              .insert([
                // 묻는 이가 직접 뽑은 카드는 묻는이 마디에 붙습니다.
                // ⚠️ 이걸 빠뜨리면 두 가지가 함께 망가집니다. 기록에서 다시
                //    열었을 때 "카드를 뽑았어"라는 말만 남고 카드가 없어지고,
                //    누가 몇 번 뽑았는지(drawTally)를 셀 수 없어집니다.
                {
                  reading_id: owned.value.id,
                  role: "user",
                  body: context.message,
                  cards: drawnByUser,
                },
                { reading_id: owned.value.id, role: "shanti", body: reply, cards: drawn },
              ])

            // 접어둔 이야기를 새것으로 갈아끼웁니다.
            //
            // ⚠️ 비어 있으면 건드리지 않습니다. 짧은 대화에서는 샨티가
            //    일부러 비워 보내는데(아직 접을 것이 없으니), 그걸 그대로
            //    덮으면 앞서 접어둔 것이 지워집니다.
            const folded = readDigest(last)
            if (folded) {
              const saved = await getSupabaseAdmin()
                ?.from("readings")
                .update({ thread_digest: folded })
                .eq("id", owned.value.id)

              // 남기지 못해도 이번 답은 이미 나갔습니다. 다음 물음에서
              // 앞 이야기를 조금 덜 아는 것뿐이라 대화를 깨지 않습니다.
              if (saved?.error) {
                console.warn("[reading/chat] 접어둔 이야기를 못 남겼습니다:", saved.error.message)
              }
            }

            // 이 사람에 대해 새로 알게 된 것을 쌓습니다.
            // ⚠️ 판이 아니라 사람에 딸립니다 — 다음에 다른 질문으로 와도
            //    이건 따라옵니다. 그래서 답을 못 받은 마디에서는 남기지
            //    않습니다(이 블록 안입니다). 오간 것이 없는데 알게 된
            //    것만 남으면 근거 없는 사실이 됩니다.
            await rememberFacts(guard.value?.id, owned.value.id, readMemos(last))
          } else {
            console.warn(`[reading/chat] 답이 비어 마디를 남기지 않았습니다 — ${owned.value.id}`)
          }
        }
      } catch (error) {
        // ⚠️ 오류 문장을 그대로 흘려보내지 않습니다. 갈래(kind)를 보냅니다 —
        //    화면이 그 갈래로 말과 다음 걸음을 고릅니다 (lib/chat-errors.ts).
        //    예전에는 제미나이가 준 영어 JSON 이 그대로 화면에 떴습니다.
        send(streamErrorPayload(error, "reading/chat"))
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

/**
 * 다 받은 JSON 에서 접어둔 이야기만 꺼냅니다.
 *
 * 비었거나 이상하면 null 입니다 — 부르는 쪽이 그때는 앞서 접어둔 것을
 * 그대로 둡니다.
 */
function readDigest(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { digest?: unknown }
    const text = typeof parsed.digest === "string" ? parsed.digest.trim() : ""
    return text ? text.slice(0, CHAT_DIGEST_MAX_CHARS) : null
  } catch {
    return null
  }
}

/**
 * 다 받은 JSON 에서 "새로 알게 된 것"만 꺼냅니다.
 *
 * 모양이 이상하면 빈 배열입니다 — 여기 들어온 것은 다음 대화마다 프롬프트에
 * 실리므로, 미심쩍은 것은 들이지 않는 편이 낫습니다.
 */
function readMemos(raw: string) {
  try {
    return cleanMemos((JSON.parse(raw) as { memo?: unknown }).memo)
  } catch {
    return []
  }
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
