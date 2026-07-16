// lib/ai-summary.ts
import { Redis } from "@upstash/redis"

export type AISummaryResult =
  | { status: "ok"; bullets: string[] }
  | { status: "quota" }
  | { status: "unavailable" }

// Upstash Redis 클라이언트 (env 미설정 시 캐싱을 건너뜁니다)
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

// 요약 캐시 유효기간: 7일
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7

export async function getAISummary(content: string, title: string, id?: string): Promise<AISummaryResult> {
  // v4: 잘린 문장이 저장된 캐시를 무효화 (버전을 올리면 전부 새로 생성됩니다)
  const cacheKey = id ? `ai-summary:v4:${id}` : null
  if (redis && cacheKey) {
    try {
      const cached = await redis.get<{ status: "ok"; bullets: string[] }>(cacheKey)
      if (cached?.status === "ok" && Array.isArray(cached.bullets) && cached.bullets.length > 0) {
        return cached
      }
    } catch (error) {
      console.error("[v0] AI 요약 캐시 조회 실패:", error)
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("[v0] GEMINI_API_KEY가 설정되지 않아 AI 요약을 건너뜁니다.")
    return { status: "unavailable" }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `다음은 "${title}"라는 제목의 블로그 글입니다. 글을 처음 읽는 독자가 3문장만 읽고도 내용을 파악할 수 있도록 요약해주세요.

규칙:
- 정확히 3개의 문장으로 요약합니다.
- 반드시 글에 실제로 담긴 내용만 쓰세요. 글에 없는 일반적인 상식이나 추측을 지어내면 안 됩니다.
- 1번째 문장: 이 글이 무엇을 다루는지 — 핵심 주제와 그 의미
- 2번째 문장: 글에서 가장 중요하게 설명하는 해석이나 포인트
- 3번째 문장: 독자가 가져갈 조언, 또는 글의 마무리가 전하는 메시지
- 각 문장은 40~80자의 자연스럽고 완결된 문장으로, "~해요"체로 통일해주세요.
- 세 문장의 내용이 서로 겹치면 안 됩니다.

---
${content.slice(0, 8000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            // Gemini 2.5는 답하기 전에 내부적으로 "생각"을 하는데, 그 분량도 출력 한도에서
            // 차감되어 답이 중간에 잘리는 원인이 됩니다. 요약에는 불필요하므로 끕니다.
            thinkingConfig: { thinkingBudget: 0 },
            // Gemini가 순수 JSON 배열만 반환하도록 API 차원에서 강제합니다.
            // (앞뒤 설명 문구나 마크다운 코드블럭이 섞여서 파싱이 깨지는 문제를 근본적으로 방지)
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3,
            },
          },
        }),
      }
    )

    if (response.status === 429) {
      console.warn("[v0] AI 요약 무료 한도 초과 (429)")
      return { status: "quota" }
    }

    if (!response.ok) {
      console.error("[v0] AI 요약 API 에러:", response.status)
      return { status: "unavailable" }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const cleaned = text.replace(/```json|```/g, "").trim()

    let bullets: string[] = []
    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) bullets = parsed.filter((b) => typeof b === "string" && b.trim().length > 0)
    } catch {
      // 답이 중간에 잘리면 JSON이 깨집니다. 잘린 토막을 보여주거나 캐시에 저장하는 것보다
      // "준비 중" 안내가 낫습니다 — 다음 방문 때 다시 시도됩니다.
      console.warn("[v0] AI 요약 JSON 파싱 실패 (응답이 잘렸을 가능성):", cleaned.slice(0, 120))
      return { status: "unavailable" }
    }

    if (bullets.length === 0) {
      return { status: "unavailable" }
    }

    const result: AISummaryResult = { status: "ok", bullets: bullets.slice(0, 3) }

    if (redis && cacheKey) {
      try {
        await redis.set(cacheKey, result, { ex: CACHE_TTL_SECONDS })
      } catch (error) {
        console.error("[v0] AI 요약 캐시 저장 실패:", error)
      }
    }

    return result
  } catch (error) {
    console.error("[v0] AI 요약 생성 실패:", error)
    return { status: "unavailable" }
  }
}