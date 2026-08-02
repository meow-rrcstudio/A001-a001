// app/api/account/purchases/route.ts
// 내가 결제한 내역. 결제내역 화면(/my/credits/purchases)이 이걸 봅니다.
//
// ┌─ 별조각 사용내역과 무엇이 다른가 ─────────────────────────────────
// │ /api/account/credits 는 별조각이 오간 기록입니다 — 받은 것, 쓴 것.
// │ 여기는 돈이 오간 기록입니다 — 언제 얼마를 어떤 수단으로 냈나.
// │
// │ 둘을 한 화면에 섞지 않습니다. "가입 선물 +1"과 "6,880원 결제"는
// │ 같은 목록에 놓일 성격이 아닙니다. 환불을 신청하려는 사람이 찾는
// │ 것은 뒤쪽이고, 셈이 맞나 보려는 사람이 찾는 것은 앞쪽입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 환불정책 제5조가 "가입한 이메일 주소와 결제일을 함께 적어 주세요"
//    라고 요구합니다. 그런데 결제일을 볼 화면이 없었습니다 — 문서가
//    요구하는 것을 화면이 내주지 못하고 있었습니다. 이 파일이 그 자리입니다.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** 목록 한 줄 — 화면이 그리는 데 필요한 만큼만 */
export interface PurchaseRow {
  id: string
  /** 언제 결제됐는지 (ISO). 승인 시각이 없으면 만든 시각 */
  at: string
  /** 산 개수 */
  credits: number
  amountKrw: number
  /** paid 결제됨 · canceled 취소·환불됨 */
  status: "paid" | "canceled"
  /** 카드 · 카카오페이 … 없을 수 있습니다 */
  method: string | null
  /** 주문번호 — 문의할 때 이 값을 알려주면 찾기가 빠릅니다 */
  orderId: string
}

export async function GET() {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  // 연결 전(검토용)에는 결제 자체가 없습니다.
  if (!user) return NextResponse.json({ purchases: [] })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ purchases: [] })

  // ⚠️ pending·failed 는 내주지 않습니다. 결제창을 띄웠다가 닫은 것까지
  //    "결제내역"에 쌓이면, 낸 적 없는 줄이 목록을 채워 진짜 결제를
  //    가립니다. 환불을 신청하려는 사람이 찾는 것은 성사된 결제입니다.
  const { data, error } = await admin
    .from("purchases")
    .select("id, created_at, paid_at, credits, amount_krw, status, method, order_id")
    .eq("user_id", user.id)
    .in("status", ["paid", "canceled"])
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[account/purchases] 목록을 못 읽었습니다:", error.message)
    return NextResponse.json({ purchases: [] })
  }

  const purchases: PurchaseRow[] = (data ?? []).map((row) => ({
    id: row.id as string,
    at: (row.paid_at as string | null) ?? (row.created_at as string),
    credits: row.credits as number,
    amountKrw: row.amount_krw as number,
    status: row.status as "paid" | "canceled",
    method: (row.method as string | null) ?? null,
    orderId: row.order_id as string,
  }))

  return NextResponse.json({ purchases })
}
