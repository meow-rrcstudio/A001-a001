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
  const cacheKey = id ? `ai-summary:v2:${id}` : null
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
                  text: `다음은 "${title}"에 대한 타로 카드 해석 글입니다. 이 글을 딱 3개의 서로 다른 관점으로 요약해주세요.

1번째 불릿: 이 카드의 핵심 의미나 키워드를 압축한 한 줄
2번째 불릿: 연애·직업·금전 중 가장 눈에 띄는 실전 조언 한 줄
3번째 불릿: 역방향일 때 주의할 점, 또는 이 카드 해석에서 반전이 되는 포인트 한 줄

각 불릿은 22자 내외, 명사형이나 짧은 문장으로 끝내주세요. 세 불릿이 서로 겹치는 내용이면 안 됩니다.

---
${content.slice(0, 4000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
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
      // 그래도 깨지는 극히 드문 경우를 위한 안전망 (대괄호 등 JSON 기호까지 확실히 제거)
      bullets = cleaned
        .split("\n")
        .map((line: string) => line.replace(/^[-*"[\]\s]+|["[\],\s]+$/g, "").trim())
        .filter((line: string) => line.length > 0 && line.length < 60)
        .slice(0, 3)
      console.warn("[v0] JSON 파싱 실패, 텍스트에서 대체 추출:", bullets)
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