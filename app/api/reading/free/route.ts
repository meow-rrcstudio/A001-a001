// app/api/reading/free/route.ts
// 로그인 전에 보는 맛보기 해석.
//
// ┌─ /api/reading 과 무엇이 다른가 ───────────────────────────────────
// │ 저쪽                          이쪽
// │ 로그인 필요                   누구나
// │ 크레딧 한 장 깎음             안 깎음 (사이트 전체 총량으로 막습니다)
// │ 판(readings)을 만들고 남김    아무것도 남기지 않습니다
// │ 좋은 모델 · 생각 4096         낮은 등급 · 생각 없음
// │ 이어묻기 가능                 한 판으로 끝
// │ 직접 친 물음 가능             준비된 질문만 (아래 참고)
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 왜 판을 남기지 않는가 ───────────────────────────────────────────
// │ 남길 사람이 없습니다. 로그인 전이라 user_id 가 없고, readings 는
// │ user_id 가 필수입니다. 브라우저에는 화면 쪽에서 남깁니다
// │ (lib/save-free-reading.ts) — 기기에만 남는 한 번짜리 기록이고,
// │ 그게 "기록으로 남기려면 가입하세요"를 권하는 근거가 됩니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 막는 장치가 둘입니다. 둘 다 있어야 합니다.
//    · 사람별  rate-limit — 한 사람이 연타하는 것 (서버 한 대 기억)
//    · 전체    free-quota — 하루에 우리가 쓸 돈의 총량 (Redis 공용)
//    앞엣것만 있으면 사람이 많아질 때 총량이 안 잡히고, 뒤엣것만 있으면
//    한 사람이 남의 몫까지 다 써버릴 수 있습니다.
import { NextResponse } from "next/server"
import { topicContent } from "@/lib/reading-content"
import type { ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { streamErrorPayload, streamFreeReadingWithGemini } from "@/lib/ai/gemini"
import { FREE_QUESTION_SLUG } from "@/lib/free-question"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { doorClosedMessage, takeFreeReading } from "@/lib/server/free-quota"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface FreeReadingBody {
  topicKey?: string
  questionSlug?: string
  questionLabel?: string
  // ⚠️ plan(샨티가 고른 배열)은 여기 오지 않습니다. 그건 직접 친 물음에만
  //    딸리는 것이고, 이 라우트는 준비된 질문만 받습니다 (아래 참고).
  cards?: { name: string; orientation: "정방향" | "역방향" }[]
}

export async function POST(request: Request) {
  let body: FreeReadingBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  // ── 1. 한 사람이 연타하는 것 ─────────────────────────────────────
  // 로그인 전이라 접속 주소로 셉니다. 맛보기는 한 판으로 끝나므로
  // 회원 해석(10분에 8번)보다 좁게 잡습니다.
  const limited = rateLimit(rateKey("free-reading", null, request), 5, 10 * 60_000)
  if (limited) return limited

  const topicKey = body.topicKey as ReadingTopicKey
  const topic = topicContent[topicKey]
  if (!topic) {
    return NextResponse.json({ error: `주제 "${body.topicKey}" 를 찾을 수 없습니다.` }, { status: 400 })
  }

  // ── 2. 맛보기는 준비된 질문만 받습니다 ───────────────────────────
  //
  // ┌─ 왜 직접 친 물음을 여기서 안 받는가 ──────────────────────────
  // │ 직접 친 물음은 서버가 배열을 골라줘야 제 값을 합니다
  // │ (/api/reading/plan). 그런데 그 호출은 별조각을 낸 사람만 지나고,
  // │ 이 라우트는 그 앞이라 지나지 않습니다. 그래서 여기로 들어온 자유
  // │ 질문은 배열도 범용이고, 무엇보다 물음을 읽어보는 자리를 하나도
  // │ 안 거칩니다.
  // │
  // │ 준비된 51개는 사람이 질문·배열·자리 이름·뽑을 때 문구까지 손으로
  // │ 설계해 둔 것입니다. 자유도는 낮지만 받는 것은 오히려 낫습니다 —
  // │ 잠그는 것이 품질을 낮추는 맞바꿈이 아닙니다.
  // │
  // │ 그리고 이렇게 두면 "직접 친 물음은 언제나 서버를 지난다"가
  // │ 예외 없는 규칙이 됩니다. 앞으로 물음을 읽어보는 장치를 붙일 때
  // │ 빠지는 경로가 하나도 없습니다.
  // └──────────────────────────────────────────────────────────────
  //
  // ⚠️ 화면에서 입력창을 잠그는 것만으로는 막은 것이 아닙니다. 이 라우트는
  //    로그인도 필요 없어서, 요청을 손으로 만들면 아무 문장이나 넣을 수
  //    있었습니다. 진짜 자물쇠는 여기입니다.
  if (body.questionSlug === FREE_QUESTION_SLUG) {
    return NextResponse.json(
      {
        error: "직접 친 물음은 별조각이 있어야 볼 수 있어요.",
        kind: "needCredits",
        needCredits: true,
      },
      { status: 402 }
    )
  }

  const question = topic.questions.find((q) => q.slug === body.questionSlug)
  if (!question) {
    return NextResponse.json(
      { error: `질문 "${body.questionSlug}" 를 찾을 수 없습니다.` },
      { status: 400 }
    )
  }

  const cards = body.cards ?? []
  if (cards.length !== question.positions.length) {
    return NextResponse.json(
      { error: `카드가 ${question.positions.length}장이어야 하는데 ${cards.length}장입니다.` },
      { status: 400 }
    )
  }

  // ── 2. 오늘 우리가 쓸 몫 ─────────────────────────────────────────
  //
  // ⚠️ 카드·질문을 다 확인한 뒤에 셉니다. 형식이 틀린 요청으로 몫이
  //    깎이면, 잘못 만든 요청 하나가 남의 자리를 뺏습니다.
  const quota = await takeFreeReading()
  if (!quota.allowed) {
    const { message, hint } = doorClosedMessage(quota.resetAt)
    return NextResponse.json(
      {
        error: message,
        hint,
        kind: "doorClosed",
        // 화면이 "몇 시에 열리는지"를 스스로 셀 수 있게 함께 보냅니다.
        reopenAt: new Date(quota.resetAt).toISOString(),
      },
      { status: 429 }
    )
  }

  // ⚠️ 회원 해석(app/api/reading)과 똑같은 봉투로 보냅니다 — 한 줄에 JSON
  //    하나(NDJSON)이고, 받는 쪽은 마지막 줄만 읽으면 됩니다. 그래야 화면이
  //    같은 코드(lib/use-reading-stream.ts)로 두 곳을 다 읽습니다.
  //
  //    조각을 그냥 이어붙이면 안 됩니다. streamFreeReadingWithGemini 가
  //    내놓는 것은 "지금까지 쌓인 전체"라서, 그대로 붙이면
  //    `{"ti` + `{"title":"컵` + … 처럼 겹쳐 쌓여 아무도 못 읽는 몸통이
  //    됩니다. 줄바꿈으로 끊어야 마지막 것만 골라 읽을 수 있습니다.
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const accumulated of streamFreeReadingWithGemini({ topicKey, question, cards })) {
          controller.enqueue(encoder.encode(JSON.stringify({ partial: accumulated }) + "\n"))
        }
      } catch (error) {
        // 흘려보내는 중에 막히면 오류 조각을 한 줄 더 붙입니다
        // (회원 해석과 같은 방식이라 화면이 같은 코드로 읽습니다).
        controller.enqueue(
          encoder.encode(JSON.stringify(streamErrorPayload(error, "free-reading")) + "\n")
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
