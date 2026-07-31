// lib/server/free-reading.ts
// "이 판은 우리가 그냥 내주는 판인가, 돈을 받고 내주는 판인가"를 가릅니다.
//
// 두 곳이 이 답을 봅니다.
//   · 이어묻기 몫   — 선물 판은 WELCOME_FOLLOWUPS, 산 판은 FOLLOWUPS_PER_CREDIT
//   · 무료 총량 한도 — 선물 판만 lib/server/free-quota.ts 의 문을 지납니다
//
// ┌─ 왜 "크레딧의 출처"가 아니라 "산 적이 있는가"로 가르는가 ──────────
// │ 크레딧은 원장(credit_entries)의 합계라서, 잔액에 남은 한 장이 선물에서
// │ 온 것인지 결제에서 온 것인지 가리킬 수 없습니다. 섞이면 그만입니다.
// │
// │ 그래서 판이 아니라 사람을 봅니다 — 한 번이라도 돈을 낸 적이 있으면
// │ 그 뒤로는 손님입니다. 선물 한 장이 남아 있어도 이어묻기를 3회로
// │ 깎지 않고, 무료 총량 문에 세우지도 않습니다. 돈을 낸 사람을 우리
// │ 사정으로 기다리게 하는 것이 제일 나쁩니다.
// │
// │ 반대 방향의 손해(선물만 받은 사람이 산 판처럼 대접받는 것)는 없습니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * 이 사람이 한 번이라도 결제한 적이 있는가.
 *
 * ⚠️ 못 읽으면 "낸 적 있다"고 답합니다(열린 채로 실패). 이 값이 틀렸을 때
 *    두 방향의 무게가 다릅니다 —
 *      true 로 잘못 보면  선물 판에 이어묻기를 몇 번 더 내주고 맙니다
 *      false 로 잘못 보면 돈을 낸 사람에게 문을 닫고 3회로 깎습니다
 *    조회 한 번 실패한 값으로 뒤쪽을 저지를 수는 없습니다.
 */
export async function hasEverPaid(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await admin
    .from("credit_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "purchase")
    .limit(1)

  if (error) {
    console.warn("[free-reading] 결제 이력을 못 읽었습니다 — 손님으로 봅니다:", error.message)
    return true
  }

  return (data?.length ?? 0) > 0
}
