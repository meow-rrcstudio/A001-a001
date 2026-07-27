// app/api/reading/plan/route.ts
// 질문을 받아 배열(몇 장, 어떤 자리)과 샨티의 첫 말을 정합니다.
//
// 해석보다 훨씬 짧은 호출이라 2초 안팎이면 끝납니다.
// 실패해도 흐름이 끊기지 않도록 기본 배열로 되돌아갑니다.
import { NextResponse } from "next/server"
import { ACTIVE_CHARACTER } from "@/lib/character"
import { PLAN_INSTRUCTION, PLAN_JSON_SCHEMA, SPREAD_CHOICES } from "@/lib/ai/reading-plan"
import { GEMINI_READING_MODEL } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export interface ReadingPlan {
  layoutKey: string
  intro: string
  positions: { label: string; guide: string }[]
}

/** AI 가 실패하거나 이상한 값을 줬을 때 쓰는 기본 배열 */
export const FALLBACK_PLAN: ReadingPlan = {
  layoutKey: "three-arch",
  intro: "흐음, 좋은 질문이구먼. 세 장으로 들여다보자꾸나. 마음을 담아 섞어보라냥.",
  positions: [
    { label: "지금 상황", guide: "지금 놓인 자리를 떠올리며 뽑아보라냥" },
    { label: "그 아래 흐름", guide: "그렇게 된 까닭을 떠올리며 한 장 더 뽑아보라냥" },
    { label: "조언", guide: "자 마지막이야. 지금 필요한 말을 떠올리며 뽑아보라냥" },
  ],
}

export async function POST(request: Request) {
  let question = ""
  try {
    question = String(((await request.json()) as { question?: string }).question ?? "").trim()
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }
  if (!question) {
    return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json(FALLBACK_PLAN)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_READING_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${ACTIVE_CHARACTER.persona}\n\n${PLAN_INSTRUCTION}` }],
          },
          contents: [{ role: "user", parts: [{ text: `질문: ${question.slice(0, 200)}` }] }],
          generationConfig: {
            maxOutputTokens: 1500,
            responseMimeType: "application/json",
            responseSchema: PLAN_JSON_SCHEMA,
          },
        }),
      }
    )
    if (!response.ok) throw new Error(await response.text())

    const data = await response.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const plan = JSON.parse(raw) as ReadingPlan

    // AI 가 장수를 틀리게 줄 수 있으니 배열 정의와 대조합니다.
    const choice = SPREAD_CHOICES.find((s) => s.key === plan.layoutKey)
    if (!choice || !Array.isArray(plan.positions) || plan.positions.length !== choice.count) {
      return NextResponse.json(FALLBACK_PLAN)
    }
    return NextResponse.json(plan)
  } catch {
    // 배열을 못 골랐다고 흐름을 멈추진 않습니다.
    return NextResponse.json(FALLBACK_PLAN)
  }
}
