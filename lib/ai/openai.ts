// lib/ai/openai.ts
// 샨티의 해석을 실제로 생성하는 곳. 서버에서만 불립니다.
//
// ⚠️ 이 파일은 절대 클라이언트에서 import 하지 마세요. API 키가 브라우저로
//    넘어갑니다. 부르는 쪽은 app/api/ 아래의 라우트여야 합니다.
//
// 프롬프트는 lib/reading-prompt-templates.ts 의 buildReadingMessages() 가
// 이미 캐릭터+주제(system) / 이번 카드(user) 로 나눠서 줍니다.
// 여기서는 그걸 그대로 넘기기만 합니다.
import OpenAI from "openai"
import { buildReadingMessages, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"

/**
 * 쓸 모델. 환경변수로 덮어쓸 수 있게 해두었습니다 —
 * 문체를 비교할 때 배포 없이 Vercel 에서 바꿔가며 볼 수 있습니다.
 * 예) 저렴한 쪽을 보고 싶으면 OPENAI_MODEL=gpt-5-mini
 */
export const READING_MODEL = process.env.OPENAI_MODEL || "gpt-5"

/** 폭주 방지용 상한. 프롬프트가 650±150자를 요구하므로 넉넉한 값입니다. */
const MAX_OUTPUT_TOKENS = 4000

export interface ReadingRunResult {
  text: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    /** 캐싱되어 싸게 처리된 입력 토큰. 페르소나 분리가 먹히는지 여기서 확인합니다. */
    cachedInputTokens: number
  }
}

/**
 * 카드 한 벌을 받아 샨티의 해석 원문을 돌려줍니다.
 * 아직 화면이 쓰는 {title, summary, keywords, sections} 모양으로 자르지는
 * 않습니다 — 우선 문체부터 확인하는 단계입니다.
 */
export async function runReading({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}): Promise<ReadingRunResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 가 없습니다. Vercel → Settings → Environment Variables 에 넣고 재배포하세요."
    )
  }

  const client = new OpenAI({ apiKey })
  const { system, user } = buildReadingMessages({ topicKey, question, cards })

  const completion = await client.chat.completions.create({
    model: READING_MODEL,
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    messages: [
      // 캐릭터 + 주제. 같은 주제면 매번 글자 하나까지 같아서 캐싱됩니다.
      { role: "system", content: system },
      // 이번에 뽑은 카드만.
      { role: "user", content: user },
    ],
  })

  const usage = completion.usage
  return {
    text: completion.choices[0]?.message?.content ?? "",
    model: completion.model,
    usage: {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      cachedInputTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
    },
  }
}
