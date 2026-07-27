// lib/ai/gemini.ts
// 샨티의 해석을 제미나이로 생성합니다. 서버에서만 불립니다.
//
// ⚠️ 이 파일은 절대 클라이언트에서 import 하지 마세요. API 키가 브라우저로
//    넘어갑니다. 부르는 쪽은 app/api/ 아래의 라우트여야 합니다.
//
// lib/ai/openai.ts 와 같은 모양(runReading)을 돌려주므로 부르는 쪽에서는
// 어느 쪽을 쓰든 코드가 같습니다. SDK 없이 fetch 만 씁니다 —
// lib/ai-summary.ts 가 이미 같은 방식으로 제미나이를 부르고 있습니다.
import { buildReadingMessages, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import type { ReadingRunResult } from "@/lib/ai/openai"

/** 환경변수로 덮어쓸 수 있습니다 (배포 없이 모델 비교) */
export const GEMINI_READING_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

const MAX_OUTPUT_TOKENS = 4000

export async function runReadingWithGemini({
  topicKey,
  question,
  cards,
  surface = "inline",
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
  /** 사이트 안에서 읽어주므로 기본은 "inline" — 맺음말 링크가 붙지 않습니다. */
  surface?: "prompt" | "inline"
}): Promise<ReadingRunResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY 가 없습니다. Vercel → Settings → Environment Variables 를 확인하세요."
    )
  }

  const { system, user } = buildReadingMessages({ topicKey, question, cards, surface })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_READING_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 캐릭터 + 주제. 매번 같아서 캐싱 대상입니다.
        systemInstruction: { parts: [{ text: system }] },
        // 이번에 뽑은 카드만.
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`제미나이 호출 실패 (${response.status})\n\n${body}`)
  }

  const data = await response.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""

  const usage = data?.usageMetadata ?? {}
  return {
    text,
    model: GEMINI_READING_MODEL,
    usage: {
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
      cachedInputTokens: usage.cachedContentTokenCount ?? 0,
    },
  }
}
