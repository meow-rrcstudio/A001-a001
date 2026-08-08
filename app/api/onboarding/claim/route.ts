// app/api/onboarding/claim/route.ts
// 샨티를 깨우며 고른 것을 방금 로그인한 사람의 기억으로 옮깁니다.
//
// ┌─ 왜 새 표를 만들지 않았는가 ──────────────────────────────────────
// │ "이 사람은 어떤 사람인가"를 담는 자리는 이미 있습니다 —
// │ public.user_memories (situation·person·trait·care). 샨티는 대화마다
// │ 그것을 읽고(lib/reading-prompt-templates.ts 의 "이 사람에 대해 알고
// │ 있는 것"), 무엇을 어떻게 쓸지도 정해져 있습니다
// │ (lib/character.ts 의 @memory_use).
// │
// │ 온보딩 결과를 담을 표를 따로 만들면 그 모든 것을 한 벌 더 짜야 하고,
// │ 두 벌은 반드시 어긋납니다. 온보딩은 "대화에서 알게 될 것을 미리 한 번
// │ 듣는 일"이지 다른 종류의 앎이 아닙니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 브라우저가 보낸 **문장**을 쓰지 않습니다. 이름표(고른 키워드)만 받고,
//    실제로 쌓을 문장은 서버가 lib/onboarding.ts 의 표에서 꺼냅니다.
//    문장을 그대로 받으면 이 API 가 "아무 문장이나 프롬프트에 심는 구멍"이
//    됩니다 — user_memories 의 RLS 가 넣기를 서비스 키로만 막아둔 까닭이
//    바로 그것이라, 여기서 열어주면 막아둔 뜻이 없어집니다.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { rememberFacts } from "@/lib/server/user-memory"
import {
  DRAWN_KEYWORDS,
  FEAR_KEYWORDS,
  ONBOARDING_CARDS,
  PICK_MAX,
  answersToMemos,
  type OnboardingAnswers,
} from "@/lib/onboarding"

export const dynamic = "force-dynamic"

/** 아는 이름표만 남깁니다. 모르는 것은 조용히 버립니다 */
function knownLabels(raw: unknown, known: readonly { label: string }[]): string[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set(known.map((k) => k.label))
  const picked: string[] = []
  for (const item of raw) {
    if (typeof item !== "string" || !allowed.has(item)) continue
    if (picked.includes(item)) continue
    picked.push(item)
    if (picked.length >= PICK_MAX) break
  }
  return picked
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 로그인 전이면 옮길 곳이 없습니다. 브라우저에 그대로 둡니다.
  // (200 으로 돌려주되 claimed 를 안 찍게 해서, 다음 로그인 때 다시 옵니다)
  if (!user) return NextResponse.json({ saved: 0 })

  // 한 사람이 이 문을 여러 번 두드릴 일은 없습니다. 온보딩은 한 번이고,
  // 다시 해도 로그인 확인 때 한 번씩입니다.
  const limited = rateLimit(rateKey("onboarding-claim", user.id, request), 10, 10 * 60_000)
  if (limited) return limited

  const raw = (body ?? {}) as Partial<OnboardingAnswers>
  const cardSlug =
    typeof raw.cardSlug === "string" && ONBOARDING_CARDS.some((c) => c.slug === raw.cardSlug)
      ? raw.cardSlug
      : null

  const answers: OnboardingAnswers = {
    drawn: knownLabels(raw.drawn, DRAWN_KEYWORDS),
    fears: knownLabels(raw.fears, FEAR_KEYWORDS),
    cardSlug,
  }

  const memos = answersToMemos(answers)
  if (memos.length === 0) return NextResponse.json({ saved: 0 })

  // readingId 는 없습니다 — 이 앎은 어느 판에서 나온 것이 아닙니다.
  await rememberFacts(user.id, undefined, memos)

  return NextResponse.json({ saved: memos.length })
}
