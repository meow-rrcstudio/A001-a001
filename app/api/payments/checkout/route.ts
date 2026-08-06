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
import { TOSS_CLIENT_KEY, makeOrderId } from "@/lib/toss"
import { readyPayment } from "@/lib/kakaopay"
import { activeProvider, isTestMode } from "@/lib/payments/provider"

export const dynamic = "force-dynamic"

/**
 * 이 길만 서울에서 돌립니다.
 *
 * ⚠️ 카카오페이는 결제 준비를 청한 곳과 결제창을 여는 곳이 크게 다르면
 *    막을 수 있습니다. Vercel 기본 지역은 미국이라, 미국에서 준비를
 *    청하고 한국에서 결제창을 열면 "접근금지"가 뜹니다.
 *    돈이 오가는 길이니 카카오와 가까운 곳에서 부릅니다.
 */
export const preferredRegion = "icn1"


export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 })
  }

  // 주문만 만들고 결제는 안 하는 호출을 반복하면 pending 줄이 쌓입니다.
  // 사람이 결제창을 여닫는 속도로는 닿지 않을 만큼 넉넉히 둡니다.
  const limited = rateLimit(rateKey("checkout", user.id, request), 20, 10 * 60_000)
  if (limited) return limited

  // 어느 결제사로 받을지는 한 곳에서 정합니다 (lib/payments/provider.ts).
  const provider = activeProvider()
  if (!provider) {
    // 키가 아직 없는 배포입니다. 화면은 이 답을 받아 "준비 중"으로 그립니다.
    return NextResponse.json({ error: "결제가 아직 열리지 않았어요." }, { status: 503 })
  }

  // ⚠️ 운영 배포에 테스트 키가 올라가 있으면 결제창은 열리는데 돈은 한 푼도
  //    들어오지 않습니다. 화면에도 표시가 나가지만, 그 표시를 못 보고
  //    지나가는 일이 실제로 잦아서 서버 로그에도 남깁니다.
  if (isTestMode(provider) && process.env.VERCEL_ENV === "production") {
    console.error(`[payments/checkout] 운영 배포인데 ${provider} 테스트 키입니다 — 실결제가 되지 않습니다`)
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
    provider,
    order_id: orderId,
    // 전자상거래법 제6조는 대금 결제 기록을 5년 보관하라고 정합니다.
    // 탈퇴하면 user_id 가 비워지므로(001 마이그레이션), 누가 냈는지는
    // 결제 줄 자체에 박아 둬야 합니다. 탈퇴 시점에 채우는 길도 있지만
    // (app/api/account/delete), 그 한 번이 실패하면 영영 비어 있게 됩니다.
    buyer_email: user.email ?? null,
  })

  if (error) {
    // 여기서 실패하면 결제창을 띄우면 안 됩니다. 대조할 줄이 없으면
    // 승인이 떨어져도 크레딧을 줄 근거가 없어서, 돈만 받고 마는 모양이
    // 됩니다.
    console.error("[payments/checkout] 주문을 못 남겼습니다:", error.message)
    return NextResponse.json({ error: "결제를 시작하지 못했어요." }, { status: 500 })
  }

  const orderName = nameCredits(pack.credits)

  // ── 카카오페이 — 여기서 "결제 준비"까지 마칩니다 ───────────────────
  //
  // 토스는 화면이 SDK 로 결제창을 열지만, 카카오는 서버가 먼저 준비를
  // 청하고 받은 주소로 사용자를 "이동"시킵니다. 그래서 준비가 이 자리에
  // 들어옵니다.
  //
  // ⚠️ 받은 tid 를 반드시 저장합니다. 승인할 때 필요한데 다시 받을 길이
  //    없습니다 — 잃어버리면 낸 돈을 확인할 방법이 사라집니다.
  if (provider === "kakaopay") {
    const origin = new URL(request.url).origin
    const back = (path: string) =>
      `${origin}${path}?provider=kakaopay&orderId=${encodeURIComponent(orderId)}`

    const ready = await readyPayment({
      orderId,
      // ⚠️ 개인정보를 넣지 말라고 카카오 문서가 못박고 있습니다
      //    (실명·휴대폰번호·이메일·ID 금지). 계정 uuid 만 넘깁니다.
      userKey: user.id,
      itemName: orderName,
      amountKrw: pack.priceKrw,
      approvalUrl: back("/my/credits/success"),
      cancelUrl: back("/my/credits/fail"),
      failUrl: back("/my/credits/fail"),
    })

    if (!ready.ok) {
      console.error(`[payments/checkout] 카카오 결제 준비 실패 — 주문 ${orderId}: ${ready.code} ${ready.message}`)
      await admin
        .from("purchases")
        .update({ status: "failed", failure_reason: `ready ${ready.code}: ${ready.message}`.slice(0, 300) })
        .eq("order_id", orderId)
      return NextResponse.json({ error: ready.message }, { status: 502 })
    }

    const { error: tidError } = await admin
      .from("purchases")
      .update({ payment_key: ready.value.tid })
      .eq("order_id", orderId)

    if (tidError) {
      // tid 를 못 남기면 승인할 길이 없습니다. 결제창을 띄우지 않습니다 —
      // 띄웠다가는 돈만 나가고 우리가 확인하지 못합니다.
      console.error("[payments/checkout] tid 를 못 남겼습니다:", tidError.message)
      return NextResponse.json({ error: "결제를 시작하지 못했어요." }, { status: 500 })
    }

    return NextResponse.json({
      provider,
      orderId,
      amount: pack.priceKrw,
      orderName,
      // 화면이 기기에 맞는 것을 고릅니다 (PC 는 팝업, 모바일은 이동).
      redirect: {
        pc: ready.value.pcUrl,
        mobile: ready.value.mobileUrl,
        app: ready.value.appUrl,
      },
    })
  }

  // ── 토스 — 결제창은 화면이 SDK 로 엽니다 ──────────────────────────
  return NextResponse.json({
    provider,
    orderId,
    amount: pack.priceKrw,
    // 결제 내역에 남는 이름입니다 (결제창과 카드 명세서에 보입니다).
    // ⚠️ 여기에 이름을 직접 적지 마세요 — lib/credit-packs.ts 에서 가져옵니다.
    //    직접 적었더니 "크레딧"에서 "별조각"으로 바꾼 뒤에도 결제창에만
    //    옛 이름이 남았습니다. 카드 명세서에 찍히는 글자라 더 나쁩니다.
    orderName,
    clientKey: TOSS_CLIENT_KEY,
    // 토스가 같은 사람의 결제를 묶어 보는 데 씁니다. 이메일 대신 id 를
    // 넘깁니다 — 남에게 넘어가도 그것만으로는 누구인지 알 수 없습니다.
    customerKey: user.id,
  })
}
