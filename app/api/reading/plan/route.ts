// app/api/reading/plan/route.ts
// 질문을 받아 배열(몇 장, 어떤 자리)과 샨티의 첫 말을 정합니다.
//
// 해석보다 훨씬 짧은 호출이라 2초 안팎이면 끝납니다.
// 실패해도 흐름이 끊기지 않도록 기본 배열로 되돌아갑니다.
import { NextResponse } from "next/server"
import { ACTIVE_CHARACTER } from "@/lib/character"
import {
  FALLBACK_PLAN,
  PLAN_INSTRUCTION,
  PLAN_JSON_SCHEMA,
  SPREAD_CHOICES,
  type ReadingPlan,
} from "@/lib/ai/reading-plan"
import { GEMINI_READING_MODEL } from "@/lib/ai/gemini"
import { requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/credit-rules"

export const dynamic = "force-dynamic"
export const maxDuration = 30


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

  // ── 여기가 타로점 한 판이 시작되는 자리입니다 ──────────────────────
  // 크레딧을 깎는 것도, 판을 만드는 것도 여기 한 곳에서만 합니다.
  // 예전에는 화면이 깎았는데, 그러면 이 호출을 건너뛰는 것만으로 공짜였습니다.
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  let readingId: string | undefined
  if (user) {
    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })

    // 판을 먼저 만들고, 그 id 를 열쇠 삼아 크레딧을 깎습니다.
    // 열쇠가 판마다 달라서 같은 판으로 두 번 깎이지 않습니다.
    const { data: created, error: createError } = await admin
      .from("readings")
      .insert({
        user_id: user.id,
        question: question.slice(0, 500),
        followups_allowed: FOLLOWUPS_PER_CREDIT,
      })
      .select("id")
      .single()

    if (createError || !created) {
      console.error("[reading/plan] 판을 못 만들었습니다:", createError?.message)
      return NextResponse.json({ error: "타로점을 시작하지 못했어요." }, { status: 500 })
    }

    readingId = created.id

    const { data: left, error: spendError } = await admin.rpc("spend_credit", {
      p_user_id: user.id,
      p_reason: "reading",
      p_reading_id: readingId,
      p_key: `reading:${readingId}`,
    })

    if (spendError || typeof left !== "number" || left < 0) {
      // 크레딧이 모자라면 방금 만든 판을 도로 지웁니다 —
      // 시작도 못 한 판이 기록에 남으면 안 됩니다.
      await admin.from("readings").delete().eq("id", readingId)
      return NextResponse.json(
        { error: "크레딧이 부족해요.", needCredits: true },
        { status: 402 }
      )
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ ...FALLBACK_PLAN, readingId })

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
            maxOutputTokens: 3000,
            // 생각 토큰도 maxOutputTokens 에서 깎입니다. 켜두면 생각만 하다
            // 한도에 닿아 빈 응답이 오고, 무슨 질문이든 기본 배열로 떨어집니다.
            thinkingConfig: { thinkingBudget: 0 },
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
      // 조용히 넘어가면 "무슨 질문이든 3장"이 되는데 원인을 알 길이 없습니다.
      console.warn(
        `[reading/plan] 배열이 어긋나 기본값으로 대체합니다 — layoutKey=${plan?.layoutKey}, ` +
          `positions=${Array.isArray(plan?.positions) ? plan.positions.length : "없음"}, ` +
          `finishReason=${data?.candidates?.[0]?.finishReason ?? "없음"}`
      )
      return NextResponse.json({ ...FALLBACK_PLAN, readingId })
    }

    // 고른 배열을 판에 적어둡니다 (다시 열었을 때 그때 모양 그대로 놓이도록)
    if (readingId) {
      await getSupabaseAdmin()
        ?.from("readings")
        .update({
          layout_key: plan.layoutKey,
          positions: plan.positions.map((p) => p.label),
        })
        .eq("id", readingId)
    }

    return NextResponse.json({ ...plan, readingId })
  } catch (error) {
    // 배열을 못 골랐다고 흐름을 멈추진 않습니다. 대신 까닭은 로그로 남깁니다.
    console.warn("[reading/plan] 배열 고르기 실패 — 기본값으로 갑니다:", error)
    return NextResponse.json({ ...FALLBACK_PLAN, readingId })
  }
}
