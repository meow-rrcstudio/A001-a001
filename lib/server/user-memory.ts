// lib/server/user-memory.ts
// 이 사람에 대해 알게 된 것을 쌓고 꺼냅니다.
//
// ┌─ 무엇을 쌓는가 ───────────────────────────────────────────────────
// │ 대화 원문이 아니라 한 줄짜리 사실입니다.
// │   "이 사람은 이직을 준비하고 있다"
// │   "이 사람은 조언보다 들어주기를 원한다"
// │
// │ 샨티가 답을 쓰면서 같은 응답 안에 함께 적어 보냅니다 (memo). 기억을
// │ 남기자고 AI 를 한 번 더 부르지 않습니다 — 무료 등급의 벽은 하루
// │ "요청 수"라 한 번이 비쌉니다 (lib/ai/gemini.ts 주석 참고).
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 여기 쌓인 것은 다음 대화마다 프롬프트에 실립니다. 틀린 것이 하나
//    섞이면 그 사람의 모든 대화가 그만큼 틀어집니다. 그래서 상한을 두고,
//    모양이 이상한 것은 들이지 않습니다.
import "server-only"

import {
  CHAT_MEMO_KINDS,
  CHAT_MEMO_MAX,
  CHAT_MEMO_MAX_CHARS,
  type ChatMemo,
  type ChatMemoKind,
} from "@/lib/ai/reading-chat"
import { getSupabaseAdmin } from "@/lib/supabase/server"

/**
 * 한 사람에게 쌓아둘 수 있는 사실의 최대 개수.
 *
 * 넘으면 오래된 것(마지막으로 다시 들은 지 가장 오래된 것)부터 버립니다.
 * 상한이 없으면 프롬프트가 사람마다 무한정 자라고, 그건 곧 값이자
 * 답변 품질입니다 — 백 줄을 들려주면 모델은 그중 아무거나 씁니다.
 */
export const USER_MEMORY_MAX = 40

/**
 * 한 번의 대화에 실어보낼 최대 개수.
 *
 * 쌓인 것이 마흔이어도 다 보내지 않습니다. 최근에 다시 들은 것 위주로
 * 열다섯이면 충분하고, 그 이상은 "아는 척 늘어놓기"를 부추깁니다.
 */
export const USER_MEMORY_PROMPT_MAX = 15

const KINDS = new Set<string>(CHAT_MEMO_KINDS)

/**
 * 사실 한 줄을 저장할 모양으로 다듬습니다.
 *
 * ⚠️ 공백을 여기서 반드시 접어야 합니다. 표의 unique 가 (user_id, kind,
 *    fact) 로 걸려 있어서, "이 사람은  이직을 준비한다"(공백 둘)와
 *    "이 사람은 이직을 준비한다"가 다른 줄로 쌓입니다.
 */
function normalize(fact: string): string {
  return fact.replace(/\s+/g, " ").trim().slice(0, CHAT_MEMO_MAX_CHARS)
}

/** 모델이 준 memo 에서 쓸 수 있는 것만 걸러냅니다 */
export function cleanMemos(raw: unknown): ChatMemo[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const memos: ChatMemo[] = []

  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const kind = (item as { kind?: unknown }).kind
    const fact = (item as { fact?: unknown }).fact
    if (typeof kind !== "string" || !KINDS.has(kind)) continue
    if (typeof fact !== "string") continue

    const clean = normalize(fact)
    // 너무 짧은 것은 사실이 아니라 부스러기입니다 ("응", "그렇다")
    if (clean.length < 4) continue

    // 같은 요청 안에서 같은 말을 두 번 준 경우
    const key = `${kind}:${clean}`
    if (seen.has(key)) continue
    seen.add(key)

    memos.push({ kind: kind as ChatMemoKind, fact: clean })
    if (memos.length >= CHAT_MEMO_MAX) break
  }

  return memos
}

/**
 * 대화에 들려보낼 것을 꺼냅니다. 최근에 다시 들은 것부터.
 *
 * 못 읽어도 빈 배열입니다 — 기억이 없으면 처음 만난 것처럼 대할 뿐이고,
 * 그것 때문에 대화가 막히지는 않습니다.
 */
export async function readUserMemories(userId: string | undefined): Promise<ChatMemo[]> {
  if (!userId) return []
  const admin = getSupabaseAdmin()
  if (!admin) return []

  const { data, error } = await admin
    .from("user_memories")
    .select("kind, fact")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(USER_MEMORY_PROMPT_MAX)

  if (error) {
    // 표를 아직 안 만든 배포일 수 있습니다. 그때는 예전과 똑같이 동작합니다.
    console.warn("[user-memory] 기억을 못 읽었습니다:", error.message)
    return []
  }

  return (data ?? []) as ChatMemo[]
}

/**
 * 새로 알게 된 것을 쌓습니다.
 *
 * 같은 말이 다시 나오면 새 줄을 만들지 않고 updated_at 만 새로 찍습니다 —
 * 그래서 자주 나오는 사실이 오래 남고, 한 번 스쳐간 것이 먼저 밀립니다.
 *
 * 실패해도 조용히 넘어갑니다. 답은 이미 사람에게 나갔고, 기억 한 줄을
 * 못 남긴 것 때문에 대화를 깨뜨릴 이유가 없습니다.
 */
export async function rememberFacts(
  userId: string | undefined,
  readingId: string | undefined,
  memos: ChatMemo[]
): Promise<void> {
  if (!userId || memos.length === 0) return
  const admin = getSupabaseAdmin()
  if (!admin) return

  const now = new Date().toISOString()
  const { error } = await admin.from("user_memories").upsert(
    memos.map((m) => ({
      user_id: userId,
      kind: m.kind,
      fact: m.fact,
      reading_id: readingId ?? null,
      updated_at: now,
    })),
    { onConflict: "user_id,kind,fact" }
  )

  if (error) {
    console.warn("[user-memory] 기억을 못 남겼습니다:", error.message)
    return
  }

  await trimToCap(userId)
}

/**
 * 상한을 넘은 만큼 오래된 것부터 버립니다.
 *
 * 최근에 다시 들은 순서로 세어서 USER_MEMORY_MAX 번째 뒤를 지웁니다.
 */
async function trimToCap(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) return

  const { data, error } = await admin
    .from("user_memories")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    // 상한 뒤에 남은 것들만 봅니다. 한 번에 몰아 지울 일은 없으니 넉넉히.
    .range(USER_MEMORY_MAX, USER_MEMORY_MAX + 200)

  if (error || !data || data.length === 0) return

  const { error: deleteError } = await admin
    .from("user_memories")
    .delete()
    .in(
      "id",
      data.map((row) => row.id)
    )

  if (deleteError) {
    console.warn("[user-memory] 오래된 기억을 못 지웠습니다:", deleteError.message)
  }
}
