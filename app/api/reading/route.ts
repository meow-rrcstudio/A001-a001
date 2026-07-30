// app/api/reading/route.ts
// 사이트 안에서 보는 샨티의 해석을 만듭니다.
//
// 결과를 다 만들 때까지 기다리면 20초 가까이 걸려 화면이 멈춘 것처럼
// 보입니다. 그래서 만들어지는 대로 흘려보냅니다 — 받는 쪽은 제목부터
// 차례로 채워 그립니다.
//
// 로그인한 사람이, 자기 판에 대해서만 부를 수 있습니다.
//
// 크레딧 한 장은 여기서 깎습니다 — 그것도 "첫 글자가 실제로 도착한 뒤"에.
// 잔액만 미리 보고, 깎기는 뒤로 미룹니다. 해석을 못 받았는데 크레딧이
// 사라지는 일을 만들지 않기 위해서입니다.
import { NextResponse } from "next/server"
import { topicContent } from "@/lib/reading-content"
import type { ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { streamReadingWithGemini } from "@/lib/ai/gemini"
import { FREE_QUESTION_SLUG, buildFreeQuestion } from "@/lib/free-question"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ReadingRequestBody {
  topicKey?: string
  /** 미리 준비된 질문의 슬러그. 자유 질문이면 "free" */
  questionSlug?: string
  /** 자유 질문일 때 사용자가 직접 친 문구 */
  questionLabel?: string
  /** 샨티가 고른 배열 — 뽑을 때 쓴 것과 같아야 해석의 자리 이름이 맞습니다 */
  plan?: { layoutKey: string; positions: { label: string; guide: string }[] }
  cards?: { name: string; orientation: "정방향" | "역방향" }[]
  /** /api/reading/plan 이 돌려준 판 id. 크레딧을 낸 판인지 확인합니다 */
  readingId?: string
}

export async function POST(request: Request) {
  let body: ReadingRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  // 이 판이 정말 이 사람 것인지 먼저 봅니다.
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const owned = await requireOwnedReading(guard.value, body.readingId)
  if (!owned.ok) return owned.response

  // 같은 판 id 로 몇 번이고 다시 부르면 그때마다 제미나이가 새로 돕니다
  // (크레딧은 한 장만 냈는데). 해석은 판당 한 번이면 충분하고, 실패해
  // 다시 받는 경우까지 넉넉히 잡아 10분에 8번으로 둡니다.
  const limited = rateLimit(rateKey("reading", guard.value?.id, request), 8, 10 * 60_000)
  if (limited) return limited

  const topicKey = body.topicKey as ReadingTopicKey
  const topic = topicContent[topicKey]
  if (!topic) {
    return NextResponse.json({ error: `주제 "${body.topicKey}" 를 찾을 수 없습니다.` }, { status: 400 })
  }

  // 자유 질문(/tarot/ask)이면 사용자가 친 문구로 질문을 만들고,
  // 아니면 주제에 준비된 질문 목록에서 찾습니다.
  let question
  if (body.questionSlug === FREE_QUESTION_SLUG) {
    const label = (body.questionLabel ?? "").trim()
    if (!label) {
      return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 })
    }
    // 프롬프트에 그대로 들어가므로 길이를 제한합니다.
    question = buildFreeQuestion(label.slice(0, 200), body.plan ?? null)
  } else {
    question = topic.questions.find((q) => q.slug === body.questionSlug)
    if (!question) {
      return NextResponse.json(
        { error: `질문 "${body.questionSlug}" 를 찾을 수 없습니다.` },
        { status: 400 }
      )
    }
  }

  const cards = body.cards ?? []
  if (cards.length !== question.positions.length) {
    return NextResponse.json(
      { error: `카드가 ${question.positions.length}장이어야 하는데 ${cards.length}장입니다.` },
      { status: 400 }
    )
  }

  // ── 잔액 확인 ────────────────────────────────────────────────────
  // 여기서는 아직 깎지 않습니다. 깎는 것은 아래에서 "첫 글자가 실제로
  // 도착했을 때"입니다.
  //
  // ⚠️ 깎아놓고 스트림을 열었더니 제미나이가 429(하루 한도)를 주는 일이
  //    있었습니다. 그러면 화면에는 오류만 뜨고 크레딧은 없어집니다 —
  //    받은 것 없이 사라지는, 전에 고쳤던 바로 그 모양입니다.
  if (owned.value) {
    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })

    const { data: balance } = await admin
      .from("credit_balance")
      .select("credits")
      .eq("user_id", guard.value!.id)
      .maybeSingle()

    if ((balance?.credits ?? 0) < 1) {
      return NextResponse.json({ error: "크레딧이 부족해요.", needCredits: true }, { status: 402 })
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let last = ""
      // 크레딧은 첫 글자가 온 뒤에 한 번만 깎습니다.
      // 열쇠가 reading:<판id> 라 같은 판을 다시 읽어도 두 번 깎이지 않습니다
      // (새로고침·다시 만들기가 공짜인 이유).
      let charged = false
      async function chargeOnce(): Promise<string | null> {
        if (charged || !owned.value) return null
        charged = true
        const admin = getSupabaseAdmin()
        if (!admin) return "서버 설정이 아직 없어요."
        const { data: left, error: spendError } = await admin.rpc("spend_credit", {
          p_user_id: guard.value!.id,
          p_reason: "reading",
          p_reading_id: owned.value.id,
          p_key: `reading:${owned.value.id}`,
        })
        if (spendError || typeof left !== "number" || left < 0) {
          if (spendError) console.error("[reading] 크레딧을 못 깎았습니다:", spendError.message)
          return "크레딧이 부족해요."
        }
        return null
      }

      try {
        for await (const accumulated of streamReadingWithGemini({ topicKey, question, cards })) {
          // 첫 조각 = 제미나이가 실제로 답하기 시작한 순간입니다.
          const failed = await chargeOnce()
          if (failed) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: failed }) + "\n"))
            return
          }
          last = accumulated
          // 지금까지 쌓인 JSON 을 통째로 보냅니다. 받는 쪽이 마지막 줄만
          // 읽으면 되도록 줄바꿈으로 끊습니다.
          controller.enqueue(encoder.encode(JSON.stringify({ partial: accumulated }) + "\n"))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        controller.enqueue(encoder.encode(JSON.stringify({ error: message }) + "\n"))
      } finally {
        controller.close()
        // 다 받은 해석을 판에 적어둡니다 (기록에서 다시 열 때 씁니다).
        // 화면이 아니라 서버가 적어야 "브라우저를 지우면 기록이 사라지는"
        // 지금 문제가 없어집니다.
        if (owned.value && last) {
          try {
            await getSupabaseAdmin()
              ?.from("readings")
              .update({ cards, result: JSON.parse(last) })
              .eq("id", owned.value.id)
          } catch {
            // 잘린 JSON 이면 적지 않습니다 — 반쪽짜리 기록보다 없는 게 낫습니다
          }
        }
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
