// lib/server/free-quota.ts
// 무료 리딩을 사이트 전체에서 하루 몇 판까지 내줄지.
//
// ┌─ lib/server/rate-limit.ts 와 무엇이 다른가 ───────────────────────
// │ 그쪽은 "한 사람이 너무 빨리 두드리는 것"을 막는 과속방지턱이고,
// │ 서버 한 대의 기억 속에만 삽니다. 이쪽은 "오늘 우리가 쓸 돈"의
// │ 총량이라 서버가 몇 대든 같은 숫자를 봐야 합니다.
// │
// │ 그래서 Upstash Redis 를 씁니다. INCR 은 서버가 여럿이어도 한 번에
// │ 하나씩만 올라가서, 999 에서 두 요청이 동시에 들어와도 둘 다
// │ 통과하는 일이 없습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 창을 나누는 이유 ────────────────────────────────────────────────
// │ 하루 한 창(1000판/24시간)으로 두면, 아침에 몰린 날은 저녁에 온
// │ 사람이 종일 닫힌 문만 봅니다. 창을 쪼개면(예: 6시간마다 250판)
// │ 하루에 네 번 문이 열려서, 기다리는 시간이 최대 6시간이 됩니다.
// │
// │ 창을 "굴러가는 24시간"이 아니라 "고정된 칸"으로 둔 것은 말해줄 수
// │ 있기 때문입니다 — 굴러가는 창은 언제 풀리는지 설명할 수가 없어서
// │ "잠시 뒤"밖에 못 합니다. 고정 칸이면 "18시에 열린다"고 말합니다.
// │
// │ 기준 시각은 한국 시간입니다. 여기서 "오늘"은 한국의 오늘입니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import { Redis } from "@upstash/redis"

/** 창 하나에 내줄 무료 리딩 수 */
export const FREE_READING_LIMIT = Number(process.env.FREE_READING_LIMIT || 1000)

/**
 * 창 하나의 길이(시간). 24 면 하루 한 번, 6 이면 하루 네 번 열립니다.
 *
 * ⚠️ 24 를 나누어떨어지는 값이어야 창이 자정에 딱 맞습니다
 *    (1·2·3·4·6·8·12·24). 아니면 아래에서 24 로 되돌립니다.
 */
const RAW_WINDOW_HOURS = Number(process.env.FREE_READING_WINDOW_HOURS || 24)
export const FREE_WINDOW_HOURS =
  Number.isInteger(RAW_WINDOW_HOURS) && RAW_WINDOW_HOURS > 0 && 24 % RAW_WINDOW_HOURS === 0
    ? RAW_WINDOW_HOURS
    : 24

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

/** 지금이 몇 번째 창인지와, 그 창이 끝나는 시각 */
function currentWindow(now: number) {
  // 한국 시간으로 옮겨서 창을 가릅니다 — 자정에 맞추기 위해서입니다.
  const kst = now + KST_OFFSET_MS
  const slot = Math.floor(kst / (FREE_WINDOW_HOURS * HOUR_MS))
  const endsKst = (slot + 1) * FREE_WINDOW_HOURS * HOUR_MS
  return { slot, resetAt: endsKst - KST_OFFSET_MS }
}

export interface FreeQuota {
  allowed: boolean
  /** 이 창에서 남은 판 수 */
  remaining: number
  /** 문이 다시 열리는 시각 (epoch ms) */
  resetAt: number
}

/**
 * 무료 리딩 한 판을 씁니다.
 *
 * ⚠️ Redis 가 없으면 막지 않고 통과시킵니다(열린 채로 실패).
 *    한도는 돈을 아끼려는 장치이고, 이게 죽었다고 무료 리딩을 통째로
 *    닫으면 아끼는 돈보다 잃는 게 큽니다. 한도를 다 써도 하루 몇천 원인
 *    반면, 문이 잘못 닫히면 그날 오는 사람을 전부 돌려보냅니다.
 *    대신 조용히 넘어가지 않고 콘솔에 남깁니다.
 */
export async function takeFreeReading(): Promise<FreeQuota> {
  const now = Date.now()
  const { slot, resetAt } = currentWindow(now)

  if (!redis) {
    console.warn("[free-quota] Redis 가 없어 무료 리딩 한도를 세지 않습니다")
    return { allowed: true, remaining: FREE_READING_LIMIT, resetAt }
  }

  const key = `free-reading:${FREE_WINDOW_HOURS}h:${slot}`

  let used: number
  try {
    used = await redis.incr(key)
    // 이 창에서 처음 올라간 것이면 창이 끝날 때 스스로 사라지게 합니다.
    // (지나간 창의 숫자를 들고 있을 이유가 없습니다)
    if (used === 1) {
      await redis.expire(key, Math.ceil((resetAt - now) / 1000) + 60)
    }
  } catch (error) {
    console.warn("[free-quota] 세는 데 실패했습니다 — 통과시킵니다", error)
    return { allowed: true, remaining: FREE_READING_LIMIT, resetAt }
  }

  return {
    allowed: used <= FREE_READING_LIMIT,
    remaining: Math.max(0, FREE_READING_LIMIT - used),
    resetAt,
  }
}

/** 문이 열리는 시각을 한국 시간 "18시"·"자정" 으로 */
export function reopenLabel(resetAt: number): string {
  const kst = new Date(resetAt + KST_OFFSET_MS)
  const hour = kst.getUTCHours()
  if (hour === 0) return "자정"
  return `${hour}시`
}

/**
 * 문이 닫혔을 때 샨티가 하는 말.
 *
 * ⚠️ "한도"·"무료"·"비용" 같은 말을 쓰지 않습니다. 우리 쪽 사정이고,
 *    듣는 사람이 할 수 있는 일도 아닙니다 (lib/chat-errors.ts 의
 *    quotaDay 와 같은 원칙). 언제 다시 되는지만 분명히 말합니다.
 */
export function doorClosedMessage(resetAt: number): { message: string; hint: string } {
  const when = reopenLabel(resetAt)
  return {
    message: "오늘은 이 몸이 카드를 볼 만큼 봤다냥. 잠시 문을 내리겠네.",
    hint:
      FREE_WINDOW_HOURS >= 24
        ? `${when}에 다시 열어둘 테니 그때 오라냥.`
        : `${when}에 다시 열린다냥. 기다리기 싫으면 크레딧으로 지금 볼 수 있어.`,
  }
}
