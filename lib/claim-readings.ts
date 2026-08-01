// lib/claim-readings.ts
// 로그인한 순간, 브라우저에만 있던 타로점을 서버로 옮깁니다.
//
// 왜 필요한지는 app/api/readings/claim/route.ts 의 머리말에 적었습니다.
// 여기는 "언제 부르는가"만 맡습니다.
"use client"

import { listAll, removeReadings } from "@/lib/reading-archive"

/**
 * 옛 주소(브라우저 id) → 새 주소(서버 id) 짝을 적어두는 곳.
 *
 * ┌─ 왜 남겨야 하는가 ────────────────────────────────────────────────
 * │ 맛보기 화면의 로그인 넛지는 "이 판으로 돌아오라"며 브라우저 id 로
 * │ 길을 걸어둡니다(/my/rlx3k...). 그런데 로그인하는 사이 그 판은 서버로
 * │ 옮겨지고 새 id 를 받습니다. 짝을 적어두지 않으면, 돌아온 사람은
 * │ 있지도 않은 주소에 닿아 "찾을 수 없어요"를 봅니다.
 * │ 옛 주소로 들어오면 새 주소로 넘겨보냅니다 (app/my/[id]/page.tsx).
 * └──────────────────────────────────────────────────────────────────
 */
const MAP_KEY = "soulseoul.readings.claimed.v1"

/** 옛 주소로 들어온 사람을 어디로 보내야 하는지. 모르면 null */
export function resolveClaimedId(localId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(MAP_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    return map[localId] ?? null
  } catch {
    return null
  }
}

function rememberClaimed(pairs: { localId: string; serverId: string }[]) {
  if (typeof window === "undefined" || pairs.length === 0) return
  try {
    const raw = window.localStorage.getItem(MAP_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    for (const pair of pairs) map[pair.localId] = pair.serverId
    window.localStorage.setItem(MAP_KEY, JSON.stringify(map))
  } catch {
    // 못 적어도 옮기기 자체는 끝났습니다. 목록에는 보입니다.
  }
}

/**
 * 이 브라우저 세션에서 이미 옮겼는지.
 *
 * useAccount 는 화면마다 돌아갑니다. 이 표시가 없으면 페이지를 옮길 때마다
 * 옮기기를 다시 시도합니다 — 서버가 중복을 막아주지 않으므로 같은 판이
 * 여러 번 쌓입니다.
 *
 * ⚠️ 모듈 바깥(파일 수준)에 둡니다. 리액트 상태로 두면 화면이 새로 그려질
 *    때 함께 초기화됩니다.
 */
let claimTried = false

/** 로그아웃하면 다시 시도할 수 있게 풀어줍니다 (다른 사람이 로그인할 수 있으므로) */
export function resetClaim() {
  claimTried = false
}

/**
 * 브라우저에 남은 판을 서버로 옮깁니다.
 *
 * 옮겨진 것만 브라우저에서 지웁니다 — 서버가 일부만 받아들였을 때
 * 나머지까지 사라지지 않도록.
 *
 * @returns 옮긴 건수 (0이면 옮길 게 없었거나 실패)
 */
export async function claimLocalReadings(): Promise<number> {
  if (claimTried) return 0
  claimTried = true

  const local = listAll()
  if (local.length === 0) return 0

  try {
    const response = await fetch("/api/readings/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        readings: local.map((r) => ({
          id: r.id,
          question: r.question,
          topicLabel: r.topicLabel,
          at: r.at,
          layoutKey: r.layoutKey,
          positions: r.positions,
          cards: r.cards,
          promptText: r.promptText,
          result: r.result,
        })),
      }),
    })
    if (!response.ok) {
      // 다음 기회에 다시 시도할 수 있게 풀어둡니다
      claimTried = false
      return 0
    }

    const data = (await response.json()) as {
      claimed?: { localId: string; serverId: string }[]
    }
    const claimed = Array.isArray(data.claimed) ? data.claimed : []

    // 짝을 먼저 적고 나서 지웁니다. 순서가 뒤집히면, 지운 직후에 창이
    // 닫혔을 때 옛 주소로 돌아올 길이 사라집니다.
    rememberClaimed(claimed)
    removeReadings(claimed.map((c) => c.localId))
    return claimed.length
  } catch {
    // 연결이 끊겼습니다. 브라우저 기록은 그대로 있으니 다음에 다시 시도합니다.
    claimTried = false
    return 0
  }
}
