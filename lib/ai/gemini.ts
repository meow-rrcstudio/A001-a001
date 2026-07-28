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
import { READING_JSON_SCHEMA } from "@/lib/ai/reading-schema"

/** 환경변수로 덮어쓸 수 있습니다 (배포 없이 모델 비교) */
export const GEMINI_READING_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

/**
 * 한 번에 받을 수 있는 토큰 한도.
 *
 * ⚠️ 생각(thinking)에 쓴 토큰도 여기서 같이 깎입니다. 그래서 생각을 켤
 *    때는 반드시 넉넉해야 합니다 — 좁으면 생각만 하다 한도에 닿아
 *    글자를 한 자도 안 내놓고 finishReason=MAX_TOKENS 로 끝납니다.
 *    화면에는 오류도 글도 없이 빈 칸만 남아서 원인을 찾기가 아주
 *    어렵습니다 (실제로 그렇게 한 번 막혔습니다).
 *    최소한 THINKING_BUDGET 의 몇 배는 되게 두세요.
 */
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 16000)

/**
 * 답하기 전에 얼마나 생각할지.
 *
 * 처음엔 0(생각 끄기)이었습니다. 위 경고대로 해석이 통째로 사라졌던 걸
 * 막으려는 응급처치였는데, 진짜 원인은 따로 있었고 한도만 넓히면
 * 됐습니다. 생각을 끈 채로 두니 카드 여러 장을 엮어 하나의 이야기로
 * 만드는 힘이 눈에 띄게 떨어졌습니다 — 장마다 따로 노는 해설이 나옵니다.
 *
 * 그래서 다시 켜되 상한을 둡니다. 무제한(-1)으로 두면 느려지고 답이
 * 언제 올지 알 수 없습니다. 환경변수로 배포 없이 조절할 수 있습니다.
 */
const THINKING_BUDGET = Number(process.env.GEMINI_THINKING_BUDGET || 2048)

// 생각이 한도를 다 먹어버리는 조합(빈 화면)을 아예 만들 수 없게 막습니다.
// 환경변수로 잘못 조여도 여기서 되돌려 놓습니다.
const SAFE_MAX_OUTPUT_TOKENS = Math.max(MAX_OUTPUT_TOKENS, THINKING_BUDGET * 4)

const THINKING = { thinkingBudget: THINKING_BUDGET }

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
        generationConfig: { maxOutputTokens: SAFE_MAX_OUTPUT_TOKENS, thinkingConfig: THINKING },
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

  if (!text.trim()) {
    throw new Error(
      `제미나이가 글자를 하나도 내놓지 않았습니다 ` +
        `(finishReason=${data?.candidates?.[0]?.finishReason ?? "없음"}).`
    )
  }

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

/**
 * 위와 같지만 결과를 조각내어 흘려보냅니다.
 *
 * 해석 한 편에 20초 가까이 걸리므로, 다 만들어질 때까지 기다리면 화면이
 * 멈춘 것처럼 보입니다. 도착하는 대로 넘겨서 제목 → 요약 → 키워드 →
 * 섹션 순으로 채워지게 합니다.
 *
 * 돌려주는 것은 "지금까지 쌓인 JSON 문자열"입니다. 아직 완성되지 않은
 * 상태라 받는 쪽에서 parsePartialJson 으로 읽어냅니다.
 */
export function streamReadingWithGemini({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}): AsyncGenerator<string> {
  const { system, user } = buildReadingMessages({ topicKey, question, cards, surface: "inline" })
  return streamGeminiJson({ system, user, schema: READING_JSON_SCHEMA })
}

/**
 * 정해진 모양(JSON 스키마)으로 답을 받아 조각내어 흘려보냅니다.
 *
 * 해석·면담이 이 함수를 함께 씁니다. 돌려주는 것은 "지금까지 쌓인 JSON
 * 문자열"이라, 받는 쪽에서 parsePartialJson 으로 읽어냅니다.
 */
export async function* streamGeminiJson({
  system,
  user,
  schema,
  maxOutputTokens = SAFE_MAX_OUTPUT_TOKENS,
}: {
  system: string
  user: string
  schema: unknown
  maxOutputTokens?: number
}): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 가 없습니다. Vercel 환경변수를 확인하세요.")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_READING_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          maxOutputTokens,
          thinkingConfig: THINKING,
          // 화면이 바로 쓸 수 있는 조각으로 받습니다.
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    }
  )

  if (!response.ok || !response.body) {
    throw new Error(`제미나이 호출 실패 (${response.status})\n\n${await response.text()}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulated = ""
  // 글자 없이 끝났을 때 "왜"를 말해주기 위해 마지막 상태를 들고 있습니다.
  let finishReason = ""
  let blockReason = ""
  // 아무것도 못 읽었을 때 실제로 뭐가 왔는지 보여주려고 앞부분만 남깁니다.
  let rawHead = ""

  /**
   * "data: {...}" 한 줄을 읽습니다.
   *
   * ⚠️ 빈 줄(이벤트 구분자)로 끊지 않습니다. 예전엔 buffer.split("\n\n") 로
   *    끊었는데 두 가지가 망가졌습니다.
   *    · 서버가 CRLF 를 쓰면 구분자가 "\r\n\r\n" 이라 "\n\n" 이 아예
   *      없습니다 — 한 조각도 못 읽고 조용히 끝났습니다 (빈 화면의 원인)
   *    · 마지막 이벤트는 뒤에 빈 줄이 안 붙어 buffer 에 남은 채 버려졌습니다
   *    제미나이는 한 줄에 JSON 한 덩어리를 담아 보내므로 줄 단위로 읽습니다.
   */
  function readLine(line: string): string | null {
    const trimmed = line.trim()
    if (!trimmed.startsWith("data:")) return null
    const payload = trimmed.slice(5).trim()
    if (!payload || payload === "[DONE]") return null
    try {
      const data = JSON.parse(payload)
      finishReason = data?.candidates?.[0]?.finishReason ?? finishReason
      blockReason = data?.promptFeedback?.blockReason ?? blockReason
      const piece: string =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
      return piece || null
    } catch {
      // 아직 덜 온 줄 — 다음 조각과 합쳐질 때 다시 시도됩니다
      return null
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (rawHead.length < 400) rawHead += text.slice(0, 400 - rawHead.length)
    buffer += text

    // \r\n 과 \n 을 모두 받아냅니다. 마지막 조각은 아직 덜 왔을 수 있으니 남깁니다.
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const piece = readLine(line)
      if (piece) {
        accumulated += piece
        yield accumulated
      }
    }
  }

  // 마지막 줄은 뒤에 줄바꿈이 없어 buffer 에 남습니다 — 여기서 마저 읽습니다.
  const tail = readLine(buffer)
  if (tail) {
    accumulated += tail
    yield accumulated
  }

  // 한 글자도 못 받았는데 조용히 끝나면 화면엔 빈 칸만 남습니다.
  // 그럴 바엔 무엇이 왔는지 들고 실패하는 편이 낫습니다.
  if (!accumulated.trim()) {
    throw new Error(
      `제미나이가 글자를 하나도 내놓지 않았습니다 ` +
        `(finishReason=${finishReason || "없음"}${blockReason ? `, blockReason=${blockReason}` : ""}). ` +
        `받은 것: ${rawHead ? JSON.stringify(rawHead.slice(0, 300)) : "아무것도 오지 않음"}`
    )
  }
}
