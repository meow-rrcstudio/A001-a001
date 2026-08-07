// lib/content/resolve.ts
// 새 콘텐츠(질문 + 스프레드)를 화면·서버가 쓰던 모양으로 이어줍니다.
//
// ┌─ 왜 다리를 놓는가 ────────────────────────────────────────────────
// │ 화면과 프롬프트와 두 API 라우트가 모두 ReadingQuestion 하나를 봅니다
// │   { slug, label, layoutKey, positions: [{ label, guide }] }
// │
// │ 새 콘텐츠는 그 하나가 **둘**로 갈려 있습니다 — 질문(무엇을 묻는가)과
// │ 스프레드(어떻게 펼치는가). 한 질문이 배열 두 개를 들고 있어서 판마다
// │ 다른 것이 나갑니다.
// │
// │ 부르는 쪽을 전부 고치는 대신, 고른 결과를 옛 모양으로 눌러 돌려줍니다.
// │ 그러면 이번에 바꾸는 것은 "질문이 어디서 오는가" 하나로 끝납니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 랜덤은 판마다 **한 번만** 굴립니다. 화면이 한 번 굴리고 서버가 또
//    굴리면, 사람은 「마음의 거울」을 보는데 샨티는 「감정의 파도」를
//    읽습니다 — 자리 이름이 통째로 어긋납니다. 그래서 고른 배열의 id 를
//    들고 다니고, 서버는 그 id 로 **다시 고르지 않고 찾습니다**.
import type { ReadingTopicSlug } from "@/lib/reading-topics"
import type { LayoutKey } from "@/lib/spread-layouts"
import { PREPARED, type PreparedQuestion } from "@/lib/content/questions"
import { SPREADS, type Spread, type SpreadId } from "@/lib/content/spreads"
import { SHUFFLE_POOL, type Line } from "@/lib/content/lines"
import { drawLine } from "@/lib/content/ordinal"
import { pickFor, PICK_MODE } from "@/lib/content/pick"
import type { TraitProfile } from "@/lib/content/traits"

/** 옛 ReadingQuestion 과 같은 모양 + 이번에 고른 배열이 무엇인지 */
export interface ResolvedQuestion {
  slug: string
  label: string
  layoutKey: LayoutKey
  positions: { label: string; guide: string; long: string }[]
  readingStyle?: "variety_show"

  /** 이번 판에 고른 배열 — 서버에 함께 보내야 같은 것을 봅니다 */
  spreadId: SpreadId
  /** 「🌙 마음의 거울」 — 화면과 프롬프트에 씁니다 */
  spreadName: string
  spreadEmoji: string
  /** 질문을 고른 직후 건네는 말 (이미 하나로 골라둔 것) */
  confirmLine: string
  /** 섞는 동안 건네는 말들 */
  shuffleLines: string[]
}

export function preparedFor(topic: ReadingTopicSlug): PreparedQuestion[] {
  return PREPARED[topic] ?? []
}

export function findPrepared(
  topic: ReadingTopicSlug,
  slug: string
): PreparedQuestion | undefined {
  return preparedFor(topic).find((q) => q.slug === slug)
}

/**
 * 질문 하나를 이번 판에 쓸 모양으로 폅니다.
 *
 * @param spreadId 이미 고른 배열이 있으면 그것을 씁니다(서버가 이 길로
 *   옵니다). 없으면 여기서 한 번 고릅니다(화면이 이 길로 옵니다).
 *
 * ⚠️ 넘어온 spreadId 가 이 질문의 것이 아니면 무시하고 다시 고릅니다.
 *    요청은 손으로 만들 수 있어서, 「지금의 나」를 묻고 켈틱 십자 열 장을
 *    받아가는 식이 가능해집니다.
 */
export function resolveQuestion(
  topic: ReadingTopicSlug,
  slug: string,
  spreadId?: string | null,
  profile?: TraitProfile | null
): ResolvedQuestion | null {
  const prepared = findPrepared(topic, slug)
  if (!prepared) return null
  return resolvePrepared(prepared, spreadId, profile)
}

export function resolvePrepared(
  prepared: PreparedQuestion,
  spreadId?: string | null,
  profile?: TraitProfile | null
): ResolvedQuestion | null {
  const asked = spreadId && prepared.spreads.includes(spreadId) ? spreadId : null
  const candidates = prepared.spreads
    .map((id) => ({ id, spread: SPREADS[id] }))
    .filter((s): s is { id: SpreadId; spread: Spread } => Boolean(s.spread))

  if (candidates.length === 0) {
    // 콘텐츠가 어긋났다는 뜻입니다 (scripts/check-content.mjs 가 미리 잡습니다).
    return null
  }

  const chosen = asked
    ? (candidates.find((c) => c.id === asked) ?? candidates[0])
    : pickFor(
        candidates.map((c) => ({ ...c, resonatesWith: c.spread.resonatesWith })),
        profile,
        PICK_MODE.spread
      )

  const { id, spread } = chosen
  const total = spread.positions.length

  return {
    slug: prepared.slug,
    label: prepared.label,
    layoutKey: spread.layoutKey,
    positions: spread.positions.map((p, i) => ({
      label: p.label,
      // 뽑기 직전에 들려주는 말. 번호는 여기서 붙습니다 — 콘텐츠에 박으면
      // 자리를 늘리거나 순서를 바꿀 때 조용히 틀립니다.
      guide: drawLine(p.short, i, total),
      long: p.long,
    })),
    readingStyle: prepared.readingStyle,
    spreadId: id,
    spreadName: spread.name,
    spreadEmoji: spread.emoji,
    confirmLine: pickFor(prepared.confirms, profile, PICK_MODE.confirm).text,
    shuffleLines: shuffleLinesFor(prepared),
  }
}

/**
 * 섞는 동안의 말.
 *
 * 대개는 결(shuffleStyle)마다 모아둔 풀에서 꺼냅니다. 이 질문만 쓰는 말을
 * 따로 적어두었으면(shuffles) 그것을 먼저 씁니다.
 */
function shuffleLinesFor(prepared: PreparedQuestion): string[] {
  const own = prepared.shuffles ?? []
  const pool = SHUFFLE_POOL[prepared.shuffleStyle] ?? []
  // 풀은 순서대로 다 씁니다 — 섞을 때마다 한 줄씩 넘어가는 자리라, 하나만
  // 골라두면 두 번째 섞음부터 할 말이 없습니다.
  return [...own, ...pool].map((line: Line) => line.text)
}
