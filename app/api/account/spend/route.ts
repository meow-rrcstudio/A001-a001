// app/api/account/spend/route.ts
// 크레딧 한 장을 씁니다.
//
// 브라우저가 아니라 여기서 깎아야 합니다. 화면에서 깎으면 그 줄을 건너뛰는
// 것만으로 공짜가 됩니다.
//
// 확인과 차감은 DB 함수 spend_credit() 안에서 한 덩어리로 일어납니다.
// 여기서 "잔액 조회 → 차감" 두 번에 나눠 부르면, 그 사이에 들어온 두 번째
// 요청이 같이 통과해 한 장으로 두 판을 볼 수 있습니다.
import { NextResponse } from "next/server"
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SpendBody {
  /** reading = 새 타로점 시작, extend = 한 장 더 써서 이어묻기 */
  reason?: "reading" | "extend"
  /** 같은 일로 두 번 깎이지 않게 하는 열쇠 (같은 값이면 한 번만 깎입니다) */
  key?: string
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "결제 설정이 아직 없어요." }, { status: 503 })
  }

  let body: SpendBody = {}
  try {
    body = (await request.json()) as SpendBody
  } catch {
    // 본문이 없어도 기본값으로 진행합니다
  }

  const reason = body.reason === "extend" ? "extend" : "reading"

  const { data, error } = await admin.rpc("spend_credit", {
    p_user_id: user.id,
    p_reason: reason,
    p_reading_id: null,
    p_key: body.key ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const credits = typeof data === "number" ? data : -1
  if (credits < 0) {
    return NextResponse.json({ error: "크레딧이 부족해요.", credits: 0 }, { status: 402 })
  }

  return NextResponse.json({ credits })
}
