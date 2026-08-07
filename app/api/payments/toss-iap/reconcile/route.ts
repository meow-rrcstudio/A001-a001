// app/api/payments/toss-iap/reconcile/route.ts
// 인앱결제로 산 것들이 아직 유효한지 훑습니다. 미니앱을 열 때마다 부릅니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 환불이 **토스 쪽에서** 일어납니다. 웹에서는 우리가 환불을 시작하니까
// │ 그 자리에서 별조각도 함께 거두는데, 인앱결제는 사용자가 토스에서
// │ 무릅니다. 우리에게는 아무도 알려주지 않습니다.
// │
// │ 그러면 열 장을 사고 환불받은 뒤에도 열 판을 볼 수 있습니다. 돈은
// │ 돌아갔는데 물건은 남는 것이라, 반드시 우리가 찾아 나서야 합니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 미니앱이 "이거 환불됐어요" 라고 말하는 것을 믿지 않습니다. 그러면
//    남의 주문번호를 보내 남의 별조각을 거둬가게 할 수 있습니다.
//    **우리가 가진 주문만** 훑고, 상태는 토스에게 다시 물어봅니다.
//
// ⚠️ Node 런타임이어야 합니다 (mTLS).
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { TossApiError } from "@/lib/server/toss-api"
import { fetchTossOrder, isTossOrderRefunded } from "@/lib/server/toss-iap"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * 한 번에 훑을 주문 수.
 *
 * ⚠️ 미니앱을 열 때마다 도는 일이라 넉넉히 잡으면 안 됩니다. 주문 하나에
 *    토스 왕복이 한 번씩이고, 요청 한도는 앱당 분당 3,000회입니다 —
 *    사람이 몰리는 시간에 이것만으로 한도를 채울 수 있습니다.
 *    최근 것부터 조금씩 봅니다. 환불은 대개 산 지 얼마 안 되어 일어납니다.
 */
const SCAN_LIMIT = 5

export async function POST() {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value
  if (!user) return NextResponse.json({ revoked: 0 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ revoked: 0 })

  // 내 것 중에서 인앱결제로 산, 아직 살아 있는 주문만.
  const { data: orders } = await admin
    .from("purchases")
    .select("order_id, amount_krw")
    .eq("user_id", user.id)
    .eq("provider", "toss-iap")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(SCAN_LIMIT)

  if (!orders?.length) return NextResponse.json({ revoked: 0 })

  let revoked = 0
  for (const row of orders) {
    try {
      const order = await fetchTossOrder(row.order_id)
      if (!isTossOrderRefunded(order)) continue

      // ⚠️ 돈은 이미 토스가 돌려줬습니다. 우리가 할 일은 **별조각을 거두는
      //    것**뿐입니다. refund_krw 에 우리가 아는 금액을 적어두는 것은
      //    기록용입니다 — 여기서 돈을 다시 움직이지 않습니다.
      const { data, error } = await admin.rpc("refund_purchase", {
        p_order_id: row.order_id,
        p_refund_krw: row.amount_krw,
        p_note: "앱인토스 환불 감지",
      })
      const result = Array.isArray(data) ? data[0] : data
      if (error || !result?.ok) {
        console.error("[toss-iap] 환불 반영 실패", row.order_id, error?.message ?? result?.message)
        continue
      }
      revoked += 1
      console.warn("[toss-iap] 환불 감지 — 별조각 거둠", row.order_id, result.credits_taken)
    } catch (error) {
      // ⚠️ 한 건이 막혀도 나머지는 계속 봅니다. 못 물어본 것은 다음에 다시
      //    옵니다 — 이 일은 미니앱을 열 때마다 돕니다.
      if (error instanceof TossApiError) {
        console.warn("[toss-iap] 조회 실패", row.order_id, error.errorCode)
        continue
      }
      throw error
    }
  }

  return NextResponse.json({ revoked })
}
