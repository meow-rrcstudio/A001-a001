// app/api/payments/checkout/route.ts
// 결제창을 띄우기 전에 서버가 주문을 하나 만들어 둡니다.
//
// ┌─ 여기서 무엇을 하는가 ────────────────────────────────────────────
// │ 1. 로그인한 사람인지 본다
// │ 2. 화면이 고른 묶음 이름(packKey)으로 가격표에서 값을 찾는다
// │ 3. 주문번호를 만들고 purchases 에 pending 한 줄을 남긴다
// │ 4. 주문번호와 금액을 화면에 돌려준다 → 화면이 그걸로 결제창을 연다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 금액은 반드시 여기서 정합니다. 화면이 보내온 금액을 쓰면 888 대신
//    1 을 적어 보내는 것만으로 크레딧을 살 수 있습니다. 화면에서 오는 건
//    "어느 묶음인지"뿐이고, 그게 얼마인지는 서버만 압니다.
//
// ⚠️ 여기서는 크레딧을 주지 않습니다. 결제창을 띄운 것과 돈이 빠져나간
//    것은 전혀 다른 일입니다 — 주는 자리는 승인이 떨어지는
//    app/api/payments/confirm 한 곳뿐입니다.
import { NextResponse } from "next/server"
import { findPack, nameCredits } from "@/lib/credit-packs"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getCurrentUser, getSupabaseAdmin } from "@/lib/supabase/server"
import { TOSS_CLIENT_KEY, isTossConfigured, makeOrderId } from "@/lib/toss"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 })
  }

  // 주문만 만들고 결제는 안 하는 호출을 반복하면 pending 줄이 쌓입니다.
  // 사람이 결제창을 여닫는 속도로는 닿지 않을 만큼 넉넉히 둡니다.
  const limited = rateLimit(rateKey("checkout", user.id, request), 20, 10 * 60_000)
  if (limited) return limited

  if (!isTossConfigured) {
    // 키가 아직 없는 배포입니다. 화면은 이 답을 받아 "준비 중"으로 그립니다.
    return NextResponse.json({ error: "결제가 아직 열리지 않았어요." }, { status: 503 })
  }

  let packKey = ""
  try {
    packKey = String(((await request.json()) as { packKey?: string }).packKey ?? "")
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 })
  }

  const pack = findPack(packKey)
  if (!pack) {
    return NextResponse.json({ error: "그런 묶음이 없어요." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "서버 설정이 아직 없어요." }, { status: 503 })
  }

  const orderId = makeOrderId(pack.key)

  const { error } = await admin.from("purchases").insert({
    user_id: user.id,
    pack_key: pack.key,
    credits: pack.credits,
    amount_krw: pack.priceKrw,
    status: "pending",
    provider: "toss",
    order_id: orderId,
  })

  if (error) {
    // 여기서 실패하면 결제창을 띄우면 안 됩니다. 대조할 줄이 없으면
    // 승인이 떨어져도 크레딧을 줄 근거가 없어서, 돈만 받고 마는 모양이
    // 됩니다.
    console.error("[payments/checkout] 주문을 못 남겼습니다:", error.message)
    return NextResponse.json({ error: "결제를 시작하지 못했어요." }, { status: 500 })
  }

  return NextResponse.json({
    orderId,
    amount: pack.priceKrw,
    // 결제 내역에 남는 이름입니다 (토스 화면과 카드 명세서에 보입니다).
    // ⚠️ 여기에 이름을 직접 적지 마세요 — lib/credit-packs.ts 에서 가져옵니다.
    //    직접 적었더니 "크레딧"에서 "별조각"으로 바꾼 뒤에도 결제창에만
    //    옛 이름이 남았습니다. 카드 명세서에 찍히는 글자라 더 나쁩니다.
    orderName: nameCredits(pack.credits),
    clientKey: TOSS_CLIENT_KEY,
    // 토스가 같은 사람의 결제를 묶어 보는 데 씁니다. 이메일 대신 id 를
    // 넘깁니다 — 남에게 넘어가도 그것만으로는 누구인지 알 수 없습니다.
    customerKey: user.id,
  })
}
