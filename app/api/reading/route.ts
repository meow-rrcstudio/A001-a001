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
import { CREDIT_UNIT, withJosa } from "@/lib/credit-packs"
import { topicContent } from "@/lib/reading-content"
import type { ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { streamErrorPayload, streamReadingWithGemini } from "@/lib/ai/gemini"
import { FREE_QUESTION_SLUG, buildFreeQuestion } from "@/lib/free-question"
import { requireOwnedReading, requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { readDrawSignals } from "@/lib/server/draw-signals"

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
  /**
   * 이 판을 어떻게 뽑았는지 잰 값 (lib/draw-signals.ts).
   *
   * ⚠️ 남기기만 합니다 — 프롬프트에 실리지 않습니다. 무엇이 오래이고
   *    무엇이 짧은지를 아직 모르기 때문입니다.
   */
  signals?: unknown
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
      return NextResponse.json({ error: `${withJosa(CREDIT_UNIT.one, "이가")} 부족해요.`, needCredits: true }, { status: 402 })
    }
  }

  // 아래 스트림 안쪽은 별개의 함수라, 위에서 좁혀둔 타입이 따라 들어가지
  // 않습니다. 필요한 값만 미리 꺼내둡니다.
  const ownedReading = owned.value
  const userId = guard.value?.id
  const drawSignals = readDrawSignals(body.signals)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let last = ""
      // 크레딧은 첫 글자가 온 뒤에 한 번만 깎습니다.
      // 열쇠가 reading:<판id> 라 같은 판을 다시 읽어도 두 번 깎이지 않습니다
      // (새로고침·다시 만들기가 공짜인 이유).
      // ⚠️ 두 깃발을 따로 둡니다.
      //    · tried  — 한 번 시도했으니 다시 부르지 않는다 (조각마다 부르므로)
      //    · charged — 실제로 깎였다
      //    하나로 합치면, 깎기가 실패했는데도 "깎았다"고 표시돼서 아래에서
      //    있지도 않은 차감을 되돌려줍니다 (쓰지 않은 한 장이 생깁니다).
      let tried = false
      let charged = false
      async function chargeOnce(): Promise<string | null> {
        if (tried || !ownedReading) return null
        tried = true
        const admin = getSupabaseAdmin()
        if (!admin) return "서버 설정이 아직 없어요."
        const { data: left, error: spendError } = await admin.rpc("spend_credit", {
          p_user_id: userId!,
          p_reason: "reading",
          p_reading_id: ownedReading.id,
          p_key: `reading:${ownedReading.id}`,
        })
        if (spendError || typeof left !== "number" || left < 0) {
          if (spendError) console.error("[reading] 크레딧을 못 깎았습니다:", spendError.message)
          return `${withJosa(CREDIT_UNIT.one, "이가")} 부족해요.`
        }
        charged = true
        return null
      }

      try {
        for await (const accumulated of streamReadingWithGemini({ topicKey, question, cards })) {
          // 첫 조각 = 제미나이가 실제로 답하기 시작한 순간입니다.
          const failed = await chargeOnce()
          if (failed) {
            // 크레딧이 모자란 경우 — 화면이 "이어서 묻기"로 이어줍니다.
            controller.enqueue(
              encoder.encode(JSON.stringify({ error: failed, kind: "needCredits" }) + "\n")
            )
            return
          }
          last = accumulated
          // 지금까지 쌓인 JSON 을 통째로 보냅니다. 받는 쪽이 마지막 줄만
          // 읽으면 되도록 줄바꿈으로 끊습니다.
          controller.enqueue(encoder.encode(JSON.stringify({ partial: accumulated }) + "\n"))
        }
      } catch (error) {
        // ⚠️ 날오류를 그대로 흘려보내지 않습니다 — 예전에는 제미나이가 준
        //    영어 JSON 이 해석 화면에 그대로 떴습니다.
        controller.enqueue(
          encoder.encode(JSON.stringify(streamErrorPayload(error, "reading")) + "\n")
        )
      } finally {
        controller.close()

        // 다 받은 해석을 판에 적어둡니다 (기록에서 다시 열 때 씁니다).
        // 화면이 아니라 서버가 적어야 "브라우저를 지우면 기록이 사라지는"
        // 지금 문제가 없어집니다.
        let saved = false
        if (ownedReading && last) {
          try {
            const result = JSON.parse(last) as {
              title?: string
              summary?: string
              sections?: unknown[]
            }
            // 제목·요약·본문이 다 있어야 "받았다"고 봅니다. 반쪽짜리를 적으면
            // 기록에서 다시 열었을 때 빈 화면이 나옵니다.
            if (result.title && result.summary && result.sections?.length) {
              await getSupabaseAdmin()
                ?.from("readings")
                .update({ cards, result })
                .eq("id", ownedReading.id)
              saved = true

              // ── 이 판을 어떻게 뽑았는지 ────────────────────────────
              // ⚠️ 위 update 에 끼워 넣지 않고 따로 씁니다. draw_signals
              //    칸이 없는 배포에서는 이 줄이 실패하는데, 함께 넣었다면
              //    해석 저장까지 같이 죽습니다 — 해석을 잃는 쪽이 훨씬
              //    나쁩니다. 신호는 없으면 없는 대로 둡니다.
              if (drawSignals) {
                const { error: signalError } = await (getSupabaseAdmin()
                  ?.from("readings")
                  .update({ draw_signals: drawSignals })
                  .eq("id", ownedReading.id) ?? { error: null })
                if (signalError) {
                  console.warn("[reading] 뽑기 신호를 못 남겼습니다:", signalError.message)
                }
              }
            }
          } catch {
            // 잘린 JSON — 적지 않습니다 (반쪽짜리 기록보다 없는 게 낫습니다)
          }
        }

        // ── 받은 게 없으면 되돌려줍니다 ──────────────────────────────
        // ⚠️ 크레딧을 깎는 자리를 "첫 글자가 온 뒤"로 미뤄뒀지만, 첫 글자가
        //    온 다음에 끊기는 경우가 남습니다 (한도·시간 초과·연결 끊김).
        //    그러면 화면에는 오류만 뜨고 크레딧은 없어집니다 — 아리님이
        //    "두 번밖에 못 물었는데 네 장이 나갔다"고 한 바로 그 모양입니다.
        //    받은 것이 없으면 되돌려주는 것이 맞습니다.
        //
        // 열쇠가 refund:reading:<판id> 라 한 판에 한 번만 돌아갑니다.
        //
        // 되돌려준 판을 다시 시도해서 이번엔 성공하면, 깎기 열쇠(reading:<판id>)가
        // 이미 쓰인 상태라 다시 깎이지 않습니다 — 그 한 판은 공짜가 됩니다.
        // 일부러 그대로 둡니다. 우리가 못 준 판을 다시 받는 것이고, 우리 잘못
        // 뒤에는 사람에게 유리한 쪽으로 기울이는 게 맞습니다.
        // (실제로 로컬 PostgreSQL 16 에 이 표와 함수를 그대로 올려 확인했습니다)
        if (charged && !saved && ownedReading && userId) {
          const { error: refundError } = await (getSupabaseAdmin()
            ?.from("credit_entries")
            .insert({
              user_id: userId,
              delta: 1,
              reason: "refund",
              reading_id: ownedReading.id,
              idempotency_key: `refund:reading:${ownedReading.id}`,
            }) ?? { error: null })

          if (refundError) {
            // 이미 돌려준 판이면 열쇠가 겹쳐 여기로 옵니다 (정상).
            console.warn("[reading] 되돌려주기:", refundError.message)
          } else {
            console.warn(`[reading] 해석을 못 받아 한 장 되돌려줬습니다 — ${ownedReading.id}`)
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
