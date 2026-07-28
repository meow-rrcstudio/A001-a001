// lib/server/rate-limit.ts
// 짧은 시간에 같은 사람이 AI 를 몇 번까지 부를 수 있는지 셉니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 크레딧이 있으니 괜찮다고 생각하기 쉽지만, 구멍이 하나 있습니다.
// │ /api/reading 은 "이 판이 네 것이냐"만 봅니다. 그래서 같은 판 id 로
// │ 몇 번이고 다시 부르면 그때마다 제미나이가 새로 돌아갑니다 —
// │ 크레딧은 한 장만 냈는데 요금과 한도는 계속 나갑니다.
// │ 이어묻기 횟수처럼 판마다 세는 장치가 해석 쪽엔 없어서, 여기서 막습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 솔직하게 적어둡니다. 이 셈은 서버 한 대의 기억 속에만 있습니다.
//    Vercel 은 요청을 여러 대에 나눠 주고 한동안 조용하면 그 기억이
//    통째로 사라지므로, 작정하고 두드리는 사람을 완전히 막지는 못합니다.
//    "실수로 새로고침을 연타하는 것"과 "간단한 스크립트"를 막는 과속방지턱
//    입니다. 진짜 벽은 크레딧이고, 사람이 늘면 Redis 같은 공용 저장소나
//    Vercel 의 방화벽으로 옮겨야 합니다.
import "server-only"

import { NextResponse } from "next/server"

type Window = { count: number; resetAt: number }

// 키 하나당 창 하나. 지나간 창은 아래에서 걷어냅니다.
const windows = new Map<string, Window>()

// 기억이 무한정 불어나지 않도록, 가끔 지나간 것을 치웁니다.
const MAX_KEYS = 5000

function sweep(now: number) {
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key)
  }
}

/**
 * 통과하면 null, 막히면 그대로 돌려보낼 429 응답.
 *
 * @param key   누구인지 (보통 "이름:사용자id")
 * @param limit 창 하나 안에서 허용할 횟수
 * @param windowMs 창의 길이
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now()

  if (windows.size > MAX_KEYS) sweep(now)

  const current = windows.get(key)
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  current.count += 1
  if (current.count <= limit) return null

  // 얼마나 기다려야 하는지 함께 알려줍니다. "잠시 뒤"보다 훨씬 낫습니다.
  const seconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  return NextResponse.json(
    { error: `조금 빠르구먼. ${seconds}초 뒤에 다시 청해보라냥.` },
    { status: 429, headers: { "retry-after": String(seconds) } }
  )
}

/**
 * 사용자를 가리키는 키를 만듭니다.
 *
 * 로그인 전(또는 Supabase 연결 전)에는 사용자 id 가 없으니 접속 주소로
 * 대신합니다. 완벽하진 않지만 없는 것보다 낫습니다.
 */
export function rateKey(name: string, userId: string | null | undefined, request: Request) {
  if (userId) return `${name}:u:${userId}`
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  return `${name}:ip:${ip}`
}
