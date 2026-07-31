// lib/server/free-quota.ts
// 무료 리딩을 사이트 전체에서 몇 판까지 내줄지.
//
// ┌─ lib/server/rate-limit.ts 와 무엇이 다른가 ───────────────────────
// │ 그쪽은 "한 사람이 너무 빨리 두드리는 것"을 막는 과속방지턱이고,
// │ 서버 한 대의 기억 속에만 삽니다. 이쪽은 "오늘 우리가 쓸 돈"의
// │ 총량이라 서버가 몇 대든 같은 숫자를 봐야 합니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 어떻게 세는가 — 창마다 채우고, 남으면 이월 ──────────────────────
// │ 6시간마다 250판을 채웁니다. 그 창에서 다 못 쓰면 남은 만큼 다음
// │ 창으로 넘어가고, 쌓여도 1,000판(하루치)을 넘지 않습니다.
// │
// │ 왜 이월하는가 — 새벽 창은 거의 비어 있고 저녁 창은 몰립니다.
// │ 이월이 없으면 새벽에 안 쓴 250판은 그냥 사라지고, 정작 사람이
// │ 몰리는 저녁엔 문이 닫힙니다. 안 쓴 몫은 아낀 돈이 아니라
// │ 그냥 놓친 사람입니다.
// │
// │ 왜 상한을 두는가 — 이월만 있고 상한이 없으면 조용한 며칠이 쌓여
// │ 하루에 수천 판이 나갈 수 있습니다. 상한이 있으면 아무리 쌓여도
// │ 하루치를 넘지 않습니다. 이월은 "총량을 늘리는 것"이 아니라
// │ "총량 안에서 시간대 쏠림을 흡수하는 것"이어야 합니다.
// │
// │ 채우는 것을 조금씩 흘려보내지 않고 창 경계에서 한꺼번에 하는 이유:
// │ 조금씩 채우면 문이 닫힌 지 몇 초 만에 한 판이 생겨서 "문을 내렸다"는
// │ 말이 거짓이 됩니다. 경계에서 한 번에 채워야 "18시에 열린다"고
// │ 분명히 말할 수 있습니다.
// │
// │ 기준 시각은 한국 시간입니다. 여기서 "오늘"은 한국의 오늘입니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import { Redis } from "@upstash/redis"
import { CREDIT_UNIT, withJosa } from "@/lib/credit-packs"

/** 하루에 내줄 무료 리딩 수 = 쌓일 수 있는 최대치(이월 상한) */
export const FREE_READING_LIMIT = Number(process.env.FREE_READING_LIMIT || 1000)

/**
 * 창 하나의 길이(시간). 6 이면 하루 네 번(00·06·12·18시) 채웁니다.
 *
 * ┌─ 6시간이면 하루가 이렇게 나뉩니다 ────────────────────────────────
 * │   00시 채움 — 새벽 (00~06)   거의 안 쓰이고 대부분 이월됩니다
 * │   06시 채움 — 아침 (06~12)
 * │   12시 채움 — 점심 (12~18)
 * │   18시 채움 — 저녁 (18~24)
 * │
 * │ 아침·점심·저녁이 각자 자기 창을 갖습니다. 창을 더 크게 잡으면
 * │ (12시간) 점심과 저녁이 같은 창을 나눠 쓰게 되어, 점심에 몰린 날
 * │ 저녁 사람은 남은 것만 줍습니다.
 * │
 * │ 새벽 창을 따로 두는 것이 아깝지 않은 이유는 이월 때문입니다 —
 * │ 새벽에 안 쓴 몫은 사라지지 않고 아침으로 넘어갑니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 24 를 나누어떨어지는 값이어야 창이 자정에 딱 맞습니다
 *    (1·2·3·4·6·8·12·24). 아니면 아래에서 6 으로 되돌립니다.
 */
const RAW_WINDOW_HOURS = Number(process.env.FREE_READING_WINDOW_HOURS || 6)
export const FREE_WINDOW_HOURS =
  Number.isInteger(RAW_WINDOW_HOURS) && RAW_WINDOW_HOURS > 0 && 24 % RAW_WINDOW_HOURS === 0
    ? RAW_WINDOW_HOURS
    : 6

/** 창 하나에서 채우는 양 — 하루치를 창 수로 나눕니다 */
export const FREE_PER_WINDOW = Math.floor(FREE_READING_LIMIT / (24 / FREE_WINDOW_HOURS))

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

/** 지금이 몇 번째 창인지와, 다음 창이 시작되는 시각 */
function currentWindow(now: number) {
  // 한국 시간으로 옮겨서 창을 가릅니다 — 자정에 맞추기 위해서입니다.
  const kst = now + KST_OFFSET_MS
  const slot = Math.floor(kst / (FREE_WINDOW_HOURS * HOUR_MS))
  const nextKst = (slot + 1) * FREE_WINDOW_HOURS * HOUR_MS
  return { slot, resetAt: nextKst - KST_OFFSET_MS }
}

/**
 * 한 판 쓰고 남은 것을 돌려줍니다. 원자적으로 돌아야 해서 Lua 로 보냅니다.
 *
 * ⚠️ 읽고 → 계산하고 → 쓰기를 따로 하면, 마지막 한 판을 두고 두 요청이
 *    동시에 들어왔을 때 둘 다 통과합니다. Lua 안에서는 한 번에 하나씩만
 *    돕니다.
 */
const TAKE = `
local key   = KEYS[1]
local cap   = tonumber(ARGV[1])
local per   = tonumber(ARGV[2])
local slot  = tonumber(ARGV[3])
local ttl   = tonumber(ARGV[4])

local got     = redis.call('HMGET', key, 'balance', 'slot')
local balance = tonumber(got[1])
local last    = tonumber(got[2])

if balance == nil or last == nil then
  -- 처음 보는 창(또는 오래 조용해 사라진 뒤)이면 한 창치로 시작합니다.
  -- 가득 채워 시작하면 배포 직후에 하루치가 한 번에 나갈 수 있습니다.
  balance = per
  last = slot
elseif slot > last then
  -- 지나간 창 수만큼 채우되, 상한을 넘지 않습니다.
  balance = math.min(cap, balance + (slot - last) * per)
  last = slot
end

local allowed = 0
if balance >= 1 then
  balance = balance - 1
  allowed = 1
end

redis.call('HMSET', key, 'balance', balance, 'slot', last)
redis.call('EXPIRE', key, ttl)
return { allowed, balance }
`

/** 조용해도 이월이 살아 있도록 넉넉히 (이보다 오래 비면 한 창치로 되돌아갑니다) */
const TTL_SECONDS = 3 * 24 * 60 * 60

export interface FreeQuota {
  allowed: boolean
  /** 쓰고 난 뒤 남은 판 수 */
  remaining: number
  /** 다음으로 채워지는 시각 (epoch ms) */
  resetAt: number
}

/**
 * 무료 리딩 한 판을 씁니다.
 *
 * ⚠️ Redis 가 없거나 죽으면 막지 않고 통과시킵니다(열린 채로 실패).
 *    한도는 돈을 아끼려는 장치인데, 이게 죽었다고 무료 리딩을 통째로
 *    닫으면 아끼는 돈보다 잃는 게 큽니다. 하루치를 다 써도 몇천 원인
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

  const key = `free-reading:${FREE_WINDOW_HOURS}h`

  try {
    const result = (await redis.eval(
      TAKE,
      [key],
      [FREE_READING_LIMIT, FREE_PER_WINDOW, slot, TTL_SECONDS],
    )) as [number, number]

    const allowed = result[0] === 1
    const remaining = result[1]

    // 문이 닫히는 순간은 남깁니다 — 한도를 올릴지 창을 쪼갤지는
    // "얼마나 자주 닫히는가"를 봐야 정할 수 있습니다.
    if (!allowed) {
      console.warn(
        `[free-quota] 무료 리딩 문을 내렸습니다 (창 ${FREE_WINDOW_HOURS}시간 · 창당 ${FREE_PER_WINDOW}판 · 상한 ${FREE_READING_LIMIT}판)`,
      )
    }

    return { allowed, remaining, resetAt }
  } catch (error) {
    console.warn("[free-quota] 세는 데 실패했습니다 — 통과시킵니다", error)
    return { allowed: true, remaining: FREE_READING_LIMIT, resetAt }
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
    hint: `${when}에 다시 열린다냥. 기다리기 싫으면 ${withJosa(CREDIT_UNIT.one, "으로로")} 지금 볼 수 있어.`,
  }
}
