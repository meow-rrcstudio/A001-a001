// app/api/reading/route.ts
// 사이트 안에서 보는 샨티의 해석을 만듭니다.
//
// 결과를 다 만들 때까지 기다리면 20초 가까이 걸려 화면이 멈춘 것처럼
// 보입니다. 그래서 만들어지는 대로 흘려보냅니다 — 받는 쪽은 제목부터
// 차례로 채워 그립니다.
//
// ⚠️ 권한 검사가 아직 없습니다. 지금은 브라우저(localStorage)에서만
//    막고 있어서 이 주소를 직접 부르면 통과합니다. 오픈 전에 로그인
//    세션과 체험 횟수를 여기서 다시 확인해야 합니다.
import { NextResponse } from "next/server"
import { topicContent } from "@/lib/reading-content"
import type { ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { streamReadingWithGemini } from "@/lib/ai/gemini"
import { FREE_QUESTION_SLUG, buildFreeQuestion } from "@/lib/free-question"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ReadingRequestBody {
  topicKey?: string
  /** 미리 준비된 질문의 슬러그. 자유 질문이면 "free" */
  questionSlug?: string
  /** 자유 질문일 때 사용자가 직접 친 문구 */
  questionLabel?: string
  cards?: { name: string; orientation: "정방향" | "역방향" }[]
}

export async function POST(request: Request) {
  let body: ReadingRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

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
    question = buildFreeQuestion(label.slice(0, 200))
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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const accumulated of streamReadingWithGemini({ topicKey, question, cards })) {
          // 지금까지 쌓인 JSON 을 통째로 보냅니다. 받는 쪽이 마지막 줄만
          // 읽으면 되도록 줄바꿈으로 끊습니다.
          controller.enqueue(encoder.encode(JSON.stringify({ partial: accumulated }) + "\n"))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        controller.enqueue(encoder.encode(JSON.stringify({ error: message }) + "\n"))
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
