// app/api/reading/try-1859/route.ts
//
// ⚠️ [임시] 문체 확인용입니다. 붙이기 전에 AI 가 샨티 목소리를 얼마나
//    살리는지 눈으로 보려고 만든 경로입니다.
//    · /design-1859 처럼 "주소를 아는 사람만" 들어오는 방식입니다
//    · 제미나이는 무료 한도 안에서, GPT 는 부를 때마다 요금이 나갑니다
//    · 문체가 정해지면 이 파일을 지우세요
//
// 쓰는 법 — 미리보기 주소 뒤에 붙여서 브라우저로 열면 됩니다.
//   /api/reading/try-1859                     기본값(제미나이, 나 주제, 첫 질문)
//   /api/reading/try-1859?ai=openai           GPT 로 (크레딧 충전 필요)
//   /api/reading/try-1859?topic=love&q=1      주제·질문 바꾸기
//   /api/reading/try-1859?raw=1               프롬프트만 보고 호출은 안 함(무료)
import { NextResponse } from "next/server"
import { allTarotCards } from "@/lib/tarot-cards"
import { topicContent } from "@/lib/reading-content"
import { readingTopics } from "@/lib/reading-topics"
import { buildReadingMessages, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { runReading, READING_MODEL } from "@/lib/ai/openai"
import { runReadingWithGemini, GEMINI_READING_MODEL } from "@/lib/ai/gemini"

// 매번 새로 뽑아야 하므로 캐시하지 않습니다.
export const dynamic = "force-dynamic"

/** 질문의 포지션 수만큼 카드를 무작위로 뽑습니다 (20% 역방향). */
function drawCards(count: number) {
  const deck = [...allTarotCards].sort(() => Math.random() - 0.5).slice(0, count)
  return deck.map((card) => ({
    name: card.nameKo,
    orientation: (Math.random() < 0.2 ? "역방향" : "정방향") as "정방향" | "역방향",
  }))
}

function text(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const topicKey = (params.get("topic") ?? "self") as ReadingTopicKey
  const questionIndex = Number(params.get("q") ?? 0)
  // 기본은 제미나이 — 무료 한도가 있어 문체 확인에 부담이 없습니다.
  const provider = params.get("ai") === "openai" ? "openai" : "gemini"

  const topic = topicContent[topicKey]
  if (!topic) {
    const available = readingTopics.map((t) => t.slug).join(", ")
    return text(`주제 "${topicKey}" 를 찾을 수 없습니다.\n쓸 수 있는 주제: ${available}`, 400)
  }

  const question = topic.questions[questionIndex]
  if (!question) {
    const list = topic.questions.map((q, i) => `  ?q=${i}  ${q.label}`).join("\n")
    return text(`질문 ${questionIndex} 번이 없습니다.\n\n${topicKey} 주제의 질문들:\n${list}`, 400)
  }

  const cards = drawCards(question.positions.length)
  const { system, user } = buildReadingMessages({ topicKey, question, cards })

  const header =
    `주제   : ${topic.titleLabel} (${topicKey})\n` +
    `질문   : ${question.label}\n` +
    `카드   : ${cards.map((c) => `${c.name}(${c.orientation === "역방향" ? "역" : "정"})`).join(" · ")}\n` +
    `모델   : ${provider === "openai" ? READING_MODEL : GEMINI_READING_MODEL} (${provider})\n`

  // ?raw=1 — 호출 없이 프롬프트만 확인 (요금 안 나감)
  if (params.get("raw")) {
    return text(
      `${header}\n` +
        `────── system (캐릭터+주제 · 캐싱 대상 ${system.length}자) ──────\n${system}\n\n` +
        `────── user (이번 카드 ${user.length}자) ──────\n${user}\n`
    )
  }

  const startedAt = Date.now()
  try {
    const result =
      provider === "openai"
        ? await runReading({ topicKey, question, cards })
        : await runReadingWithGemini({ topicKey, question, cards })
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
    const { inputTokens, outputTokens, cachedInputTokens } = result.usage

    return text(
      `${header}` +
        `걸린시간: ${seconds}초\n` +
        `토큰   : 입력 ${inputTokens} (캐싱됨 ${cachedInputTokens}) · 출력 ${outputTokens}\n` +
        `${"─".repeat(50)}\n\n${result.text}\n`
    )
  } catch (error) {
    // 모델 이름이 틀렸거나 키가 없을 때 무엇이 문제인지 그대로 보여줍니다.
    const message = error instanceof Error ? error.message : String(error)
    return text(`${header}\n실패했습니다.\n\n${message}\n`, 500)
  }
}
