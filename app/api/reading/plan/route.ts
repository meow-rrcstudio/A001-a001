// app/api/reading/plan/route.ts
// 질문을 받아 배열(몇 장, 어떤 자리)과 샨티의 첫 말을 정합니다.
//
// 해석보다 훨씬 짧은 호출이라 2초 안팎이면 끝납니다.
// 실패해도 흐름이 끊기지 않도록 기본 배열로 되돌아갑니다.
import { NextResponse } from "next/server"
import { CREDIT_UNIT, withJosa } from "@/lib/credit-packs"
import { ACTIVE_CHARACTER } from "@/lib/character"
import {
  FALLBACK_PLAN,
  PLAN_INSTRUCTION,
  PLAN_JSON_SCHEMA,
  SPREAD_CHOICES,
  planHint,
  type ReadingPlan,
} from "@/lib/ai/reading-plan"
// ⚠️ 배열 고르기는 해석과 "다른 모델"을 씁니다. 무료 등급의 하루 요청
//    한도가 모델별이라, 같은 모델로 두 번 부르면 한 판에 해석 몫까지
//    같이 깎입니다 (lib/ai/gemini.ts 의 GEMINI_PLAN_MODEL 주석 참고).
import { GEMINI_FALLBACK_MODEL, GEMINI_PLAN_MODEL, GEMINI_READING_MODEL } from "@/lib/ai/gemini"
import { requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/credit-rules"
import { hasEverPaid } from "@/lib/server/free-reading"
import { doorClosedMessage, takeFreeReading } from "@/lib/server/free-quota"
import { freeSpreadFor } from "@/lib/free-question"
import {
  auditFreeQuestion,
  needsCare,
  safetyDirective,
  SAFETY_BASELINE,
} from "@/lib/question-safety"

export const dynamic = "force-dynamic"
export const maxDuration = 30


/**
 * 화면이 "이미 정해진 배열"을 함께 보냈는지 봅니다.
 *
 * 준비된 질문(lib/reading-content.ts)에는 사람이 손으로 쓴 배열이 딸려
 * 있습니다 — 자리 이름도, 뽑을 때 들려주는 말도 그 질문에 맞춰 쓰인 것입니다.
 * 그런 질문에까지 AI 를 부르면, 공들여 쓴 글이 일반적인 문구로 덮입니다.
 *
 * ⚠️ 화면이 보낸 값이라 그대로 믿지 않습니다. 배열 이름이 우리가 아는
 *    것인지, 자리 수가 그 배열과 맞는지 대조하고, 글자 수도 자릅니다 —
 *    이 글은 그대로 AI 프롬프트에 실려 나갑니다.
 */
type PreparedSpread = { layoutKey: string; positions: { label: string; guide: string }[] }

function readPreparedSpread(raw: unknown): PreparedSpread | null {
  if (!raw || typeof raw !== "object") return null
  const { layoutKey, positions } = raw as {
    layoutKey?: unknown
    positions?: unknown
  }
  if (typeof layoutKey !== "string" || !Array.isArray(positions)) return null

  const choice = SPREAD_CHOICES.find((s) => s.key === layoutKey)
  if (!choice || positions.length !== choice.count) return null

  const cleaned = positions.map((p) => {
    const { label, guide } = (p ?? {}) as { label?: unknown; guide?: unknown }
    return {
      label: String(label ?? "").slice(0, 40),
      guide: String(guide ?? "").slice(0, 120),
    }
  })
  if (cleaned.some((p) => !p.label)) return null

  return { layoutKey, positions: cleaned }
}

export async function POST(request: Request) {
  let question = ""
  let prepared: PreparedSpread | null = null
  try {
    const body = (await request.json()) as { question?: string; prepared?: unknown }
    question = String(body.question ?? "").trim()
    prepared = readPreparedSpread(body.prepared)
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }
  if (!question) {
    return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 })
  }
  // 직접 친 물음만 읽어봅니다 — 준비된 칩 질문은 사람이 설계한 것이라
  // 분류도 배열도 건드리지 않습니다.
  const audit = prepared ? null : auditFreeQuestion(question)
  // ⚠️ 배열 고르기가 실패했을 때 쓰는 기본값입니다.
  //
  //    예전에는 무슨 질문이든 세 장(FALLBACK_PLAN)이었습니다. 그런데 이
  //    호출은 생각보다 자주 실패합니다 — 무료 등급의 하루 몫이 모델마다
  //    스무 번이고, 맛보기 해석이 같은 모델을 씁니다. 그래서 바쁜 날에는
  //    자유 질문이 통째로 세 장으로 떨어졌습니다. "세 장뿐이라 약하다"의
  //    실제 원인입니다.
  //
  //    이제 기본값도 여섯 장이고, 자리 이름은 분류에 맞춥니다.
  const preset = freeSpreadFor(audit)
  const fallbackPlan: ReadingPlan = audit
    ? { layoutKey: preset.layoutKey, intro: preset.intro, positions: preset.positions }
    : FALLBACK_PLAN

  // ── 여기가 타로점 한 판이 시작되는 자리입니다 ──────────────────────
  // 크레딧을 깎는 것도, 판을 만드는 것도 여기 한 곳에서만 합니다.
  // 예전에는 화면이 깎았는데, 그러면 이 호출을 건너뛰는 것만으로 공짜였습니다.
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 판을 시작하는 자리라 크레딧이 이미 막아주지만, 크레딧이 없는 상태로
  // 두드리는 것(402 만 계속 받는 호출)까지 세어 막습니다.
  const limited = rateLimit(rateKey("plan", user?.id, request), 12, 10 * 60_000)
  if (limited) return limited

  let readingId: string | undefined
  // 이 판에 딸려가는 이어묻기 몫. 화면이 남은 횟수를 셀 때 이 값을 봅니다
  // (연결 전에는 산 판과 같게 둡니다 — 깎을 근거가 없으니까요).
  let followupsAllowed = FOLLOWUPS_PER_CREDIT
  // 한 번이라도 결제한 적이 있는 사람인가 (선물 이어묻기는 그렇지 않은
  // 사람에게만 딸려옵니다). 판을 만든 뒤에도 봐야 해서 밖에 둡니다.
  let paidBefore = true

  if (user) {
    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })

    // ⚠️ 여기서는 크레딧을 깎지 않습니다. 잔액이 있는지만 봅니다.
    //
    //    예전에는 이 자리에서 깎았습니다. 그런데 이 호출은 "질문을 고른
    //    순간"에 일어납니다 — 아직 카드를 섞지도, 뽑지도, 해석을 보지도
    //    않은 때입니다. 그래서 마음이 바뀌어 뒤로 가거나, 해석이 실패하면
    //    받은 것 없이 크레딧만 사라졌습니다. ("두 번밖에 안 봤는데 없다"의
    //    실제 원인입니다)
    //
    //    깎는 자리는 해석이 실제로 도착하는 곳(app/api/reading/route.ts)으로
    //    옮겼습니다. 열쇠가 reading:<판id> 라 판 하나에 한 번만 깎입니다.
    //
    // ⚠️ 잔액 확인이 판 만들기보다 먼저입니다. 예전에는 판을 먼저 만들고
    //    모자라면 지웠는데, 그 사이에 아래 무료 문까지 끼어들면서 "시작도
    //    못 한 판"이 남을 자리가 늘었습니다. 아무것도 만들지 않고 돌려보내는
    //    편이 되돌릴 것이 없습니다.
    const { data: balance } = await admin
      .from("credit_balance")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle()

    if ((balance?.credits ?? 0) < 1) {
      return NextResponse.json(
        { error: `${withJosa(CREDIT_UNIT.one, "이가")} 부족해요.`, needCredits: true },
        { status: 402 }
      )
    }

    // ── 선물로 보는 판인가, 산 판인가 ──────────────────────────────
    // 한 번이라도 결제한 적이 있으면 손님입니다 (lib/server/free-reading.ts).
    const paid = await hasEverPaid(admin, user.id)
    paidBefore = paid

    if (!paid) {
      // ⚠️ 여기서 이어묻기 3회를 판에 박지 않습니다.
      //
      //    예전에는 박았습니다. 그런데 선물 3회가 붙는 자리가 두 곳이었고
      //    (이 판 · 가입 전 맛보기 판), 그 판이 아닌 데서 대화를 이어가려
      //    하면 남는 길이 "별조각 한 장 더 쓰고 이어서 묻기"뿐이었습니다.
      //    누르면 방금 받은 선물 별조각이 그 자리에서 나갔습니다.
      //
      //    이제 3회는 계정에 있고, 판을 만든 뒤 아래에서 끌어옵니다.
      //    이미 다른 판에서 썼다면 이 판은 0회로 시작합니다 (선물은 모두
      //    합쳐 세 번입니다).
      followupsAllowed = 0

      // 그리고 사이트 전체의 무료 총량에서 한 판을 꺼내 씁니다.
      // 다 떨어졌으면 문을 내립니다 — 하지만 크레딧으로 가는 길은
      // 열어둔 채로입니다 (우리 사정으로 막는 것이지, 이 사람이 뭘
      // 잘못해서가 아닙니다).
      //
      // ⚠️ 무료 몫은 여기서 한 번만 꺼냅니다. 이어묻기·카드 더 뽑기는
      //    같은 판이라 다시 꺼내지 않습니다 — 판을 시작하는 자리가
      //    크레딧과 마찬가지로 여기 한 곳뿐이기 때문입니다.
      const quota = await takeFreeReading()
      if (!quota.allowed) {
        const { message, hint } = doorClosedMessage(quota.resetAt)
        return NextResponse.json(
          { error: message, hint, kind: "doorClosed", reopenAt: quota.resetAt },
          { status: 429 }
        )
      }
    }

    // 판을 만들고, 그 id 를 열쇠 삼아 (나중에) 크레딧을 깎습니다.
    // 열쇠가 판마다 달라서 같은 판으로 두 번 깎이지 않습니다.
    const { data: created, error: createError } = await admin
      .from("readings")
      .insert({
        user_id: user.id,
        // ⚠️ 사용자가 친 그대로 남깁니다. 한동안 민감한 물음을 다른 문장으로
        //    바꿔 저장했는데, 그러면 기록에 묻지도 않은 물음이 남고 나중에
        //    "내가 이런 걸 물었다고?" 가 됩니다. 조심하는 방법은 저장이
        //    아니라 프롬프트 지침입니다 (lib/question-safety.ts).
        question: question.slice(0, 500),
        followups_allowed: followupsAllowed,
      })
      .select("id")
      .single()

    if (createError || !created) {
      console.error("[reading/plan] 판을 못 만들었습니다:", createError?.message)
      return NextResponse.json({ error: "타로점을 시작하지 못했어요." }, { status: 500 })
    }

    readingId = created.id

    // 선물 이어묻기를 이 판으로 끌어옵니다 (계정에 남아 있으면).
    //
    // ⚠️ 실패해도 판은 그대로 씁니다. 004 를 아직 안 돌린 배포에서는
    //    함수가 없어 실패하는데, 여기서 멈추면 타로점이 통째로 안 됩니다.
    if (!paidBefore) {
      const { data: granted, error: giftError } = await admin.rpc("claim_welcome_followups", {
        p_user_id: user.id,
        p_reading_id: readingId,
      })
      if (giftError) {
        console.warn("[reading/plan] 선물 이어묻기를 못 끌어왔습니다:", giftError.message)
      } else if (typeof granted === "number" && granted > 0) {
        followupsAllowed += granted
      }
    }
  }

  // ── 이미 배열이 정해진 질문 ──────────────────────────────────────
  // 준비된 질문에는 사람이 손으로 쓴 배열이 딸려 있습니다. 자리 이름도,
  // 뽑을 때 들려주는 말도 그 질문에 맞춰 쓰인 것이라 AI 가 고른 일반적인
  // 문구보다 낫습니다. 그러니 묻지 않고 그대로 씁니다.
  //
  // ⚠️ 예전에는 준비된 질문에도 AI 를 불러 덮어썼습니다. "그 사람은 지금
  //    나를 어떻게 생각할까?"의 켈틱 십자 열 장(지나온 흐름 · 밑바닥의
  //    진심 · 마음의 최종 방향…)이 통째로 세 장짜리 일반 배열로 바뀌었고,
  //    뽑을 때 들려주는 말도 함께 밋밋해졌습니다.
  //
  // 덤으로 호출이 한 번 줄어 2초쯤 빨라지고, 제미나이 하루 몫도 아낍니다.
  if (prepared) {
    if (readingId) {
      await getSupabaseAdmin()
        ?.from("readings")
        .update({
          layout_key: prepared.layoutKey,
          positions: prepared.positions.map((p) => p.label),
        })
        .eq("id", readingId)
    }
    // intro 는 화면이 주제별 확인 문구로 채웁니다 (lib/reading-prompt-templates.ts).
    return NextResponse.json({ ...prepared, intro: "", readingId, followupsAllowed })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ ...fallbackPlan, readingId, followupsAllowed, audit: audit ?? undefined })

  try {
    const askPlan = (model: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: [
                    ACTIVE_CHARACTER.persona,
                    PLAN_INSTRUCTION,
                    SAFETY_BASELINE,
                    safetyDirective(audit),
                    planHint(audit),
                  ]
                    .filter(Boolean)
                    .join("\n\n"),
                },
              ],
            },
            // 사용자가 친 글은 user 자리에만, 그것도 씻어내서 싣습니다
            // (audit.question 이 씻어낸 원문입니다).
            contents: [{ role: "user", parts: [{ text: `질문: ${audit?.question ?? question.slice(0, 200)}` }] }],
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

    // ⚠️ 한 번만 물어보고 포기하면 안 됩니다.
    //    · 429 하루 몫에 닿음 — 통은 "프로젝트 × 모델"이라 다른 모델은 남아 있습니다
    //    · 404 그런 모델이 없음 — 구글이 이름을 닫으면 우리 잘못 없이 옵니다
    //      (실제로 gemini-2.5-flash-lite 가 404 로 죽은 적이 있습니다 —
    //       lib/ai/gemini.ts 의 같은 주석 참고)
    //    해석 쪽에는 이 재시도가 있었는데 배열 고르기에는 없어서, 여기만
    //    조용히 기본 배열로 떨어지고 있었습니다.
    let response = await askPlan(GEMINI_PLAN_MODEL)
    if (response.status === 429 || response.status === 404) {
      const next = [GEMINI_FALLBACK_MODEL, GEMINI_READING_MODEL].find(
        (m) => m && m !== GEMINI_PLAN_MODEL
      )
      if (next) {
        console.warn(
          `[reading/plan] ${GEMINI_PLAN_MODEL} 가 ${response.status} 라 ${next} 로 다시 시도합니다`
        )
        await response.text() // 몸통을 비워 연결을 놓아줍니다
        response = await askPlan(next)
      }
    }

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
      return NextResponse.json({ ...fallbackPlan, readingId, followupsAllowed, audit: audit ?? undefined })
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

    return NextResponse.json({ ...plan, readingId, followupsAllowed, audit: audit ?? undefined })
  } catch (error) {
    // 배열을 못 골랐다고 흐름을 멈추진 않습니다. 대신 까닭은 로그로 남깁니다.
    console.warn("[reading/plan] 배열 고르기 실패 — 기본값으로 갑니다:", error)
    return NextResponse.json({ ...fallbackPlan, readingId, followupsAllowed, audit: audit ?? undefined })
  }
}
