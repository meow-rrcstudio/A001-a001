// app/api/payments/config/route.ts
// "지금 결제를 열 수 있는가" 를 화면에 알려줍니다.
//
// ┌─ 왜 서버에 물어보는가 ────────────────────────────────────────────
// │ 예전에는 화면이 NEXT_PUBLIC_TOSS_CLIENT_KEY 가 있는지로 판단했습니다.
// │ 두 가지가 어긋납니다.
// │
// │  1) 결제사가 둘이 됩니다 (웹=카카오페이 · 앱인토스=토스). 카카오페이는
// │     브라우저로 나가는 키가 아예 없어서, 그 방식으로는 "결제 준비 안
// │     됨"으로 보입니다 — 살 수 있는데 못 사는 화면이 됩니다.
// │  2) NEXT_PUBLIC_ 값은 빌드할 때 코드에 박힙니다. Vercel 에서 키를
// │     넣어도 재배포 전에는 화면이 옛 값을 봅니다.
// │
// │ 그래서 서버가 답합니다. 서버는 언제나 지금 값을 봅니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 여기서 키를 내보내지 않습니다. "열 수 있는가 / 테스트인가"만 답합니다.
import { NextResponse } from "next/server"
import { activeProvider, isTestMode } from "@/lib/payments/provider"

export const dynamic = "force-dynamic"

export interface PaymentConfig {
  /** 결제를 시작할 수 있는 상태인가 */
  ready: boolean
  /** 테스트 열쇠로 도는 중인가 (화면이 "실제로 결제되지 않아요"를 띄웁니다) */
  test: boolean
}

export async function GET() {
  const provider = activeProvider()

  return NextResponse.json({
    ready: provider !== null,
    test: provider !== null && isTestMode(provider),
  } satisfies PaymentConfig)
}
