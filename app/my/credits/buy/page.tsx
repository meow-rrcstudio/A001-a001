// app/my/credits/buy/page.tsx
// 별조각 구매하기 — 묶음을 고르는 화면입니다.
//
// ┌─ 왜 사용내역과 갈랐는가 ──────────────────────────────────────────
// │ 예전에는 /my/credits 한 장에 가격표와 사용내역이 함께 있었습니다.
// │ 사러 들어온 사람은 가격표 아래로 남의 셈을 한참 지나가야 했고,
// │ 셈을 보러 들어온 사람은 가격표부터 봐야 했습니다. 볼일이 둘이면
// │ 화면도 둘입니다.
// │   · /my/credits      나의 별조각 — 남은 개수와 사용내역
// │   · /my/credits/buy   여기      — 사는 곳
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 결제 ────────────────────────────────────────────────────────────
// │ 누르면 토스 결제창이 뜹니다 (lib/toss-checkout.ts).
// │ 별조각은 여기서 들어오지 않습니다 — 돌아온 뒤 승인이 떨어지는
// │ /my/credits/success 에서 들어옵니다.
// │
// │ ⚠️ 키(NEXT_PUBLIC_TOSS_CLIENT_KEY)가 없는 배포에서는 버튼을 내지 않고
// │    "곧 열려요"로 둡니다. 눌리지도 않는 버튼은 고장 난 것처럼 보입니다.
// │    키는 빌드에 박히므로, 넣은 뒤 반드시 재배포해야 버튼이 나옵니다.
// └──────────────────────────────────────────────────────────────────
//
// 묶음·가격·부르는 말은 전부 lib/credit-packs.ts 에서 옵니다.
// 값을 바꾸려면 여기가 아니라 그 파일을 고치세요.
//
// ⚠️ 청약철회 조건은 이 화면에 적지 않습니다. 푸터의 이용약관·환불정책이
//    모든 화면에 항상 붙어 있어서 사기 전에 닿을 수 있습니다. 고르는
//    화면에 약관 문단을 얹으면 정작 읽어야 할 값(가격)이 뒤로 밀립니다.
"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useAccount } from "@/lib/use-account"
import {
  CREDIT_PACKS,
  CREDIT_UNIT,
  formatKrw,
  nameCredits,
  pricePerCredit,
  withJosa,
  type CreditPack,
} from "@/lib/credit-packs"
import { isTossReady, isTossTestKey } from "@/lib/toss-client"
import { openTossCheckout } from "@/lib/toss-checkout"
import { CreditList, CreditScreen } from "../credit-screen"

/**
 * 묶음 한 줄 — 이름 + 개당 값 / 오른쪽에 값과 들어가는 화살표.
 *
 * 줄 전체가 버튼입니다. 오른쪽 작은 글씨만 누를 수 있게 하면 손가락으로는
 * 잘 안 눌립니다.
 *
 * ⚠️ 추천 묶음을 검정 줄로 뒤집지 않습니다. 목록 한가운데가 검게 반전되면
 *    "이건 뭔가 다른 것"으로 읽혀서, 값을 나란히 비교하던 눈이 한 번
 *    끊깁니다. 추천은 개당 값 옆의 한마디로 충분합니다.
 */
function PackRow({
  pack,
  onBuy,
  busy = false,
  canBuy,
}: {
  pack: CreditPack
  onBuy: () => void
  /** 이 줄의 결제창을 여는 중 */
  busy?: boolean
  /** 결제를 열 수 있는 배포인가 (아니면 누를 수 없는 안내로 둡니다) */
  canBuy: boolean
}) {
  const inner = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-myeongjo text-xl font-bold leading-tight text-foreground">
          {nameCredits(pack.credits)}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          개당 {formatKrw(pricePerCredit(pack))}
          {pack.featured && "·가장 알뜰해요!"}
        </span>
      </span>

      {/* 값과 "곧 열려요"를 한 칸에 세로로 쌓습니다. 옆으로 늘어놓으면
          결제가 열리지 않은 배포에서만 줄이 좁아져서, 왼쪽 개당 값이
          두 줄로 접힙니다 (같은 목록이 배포마다 다르게 보입니다). */}
      <span className="shrink-0 text-right">
        <span className="block text-lg font-bold text-accent">{formatKrw(pack.priceKrw)}</span>
        {!canBuy && <span className="mt-0.5 block text-xs text-muted-foreground">곧 열려요</span>}
      </span>

      {/* 아직 결제가 열리지 않은 배포에서는 들어갈 곳이 없으니 화살표도 없습니다.
          자리는 남겨둡니다 — 열린 배포와 줄 폭이 달라지지 않게. */}
      {canBuy ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
      ) : (
        <span className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
    </>
  )

  // 결제가 아직 없는 배포에서는 누를 것을 내지 않습니다
  if (!canBuy) return <div className="flex items-center gap-3 px-5 py-4">{inner}</div>

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={busy}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/5 disabled:opacity-60"
    >
      {inner}
    </button>
  )
}

export default function BuyCreditsPage() {
  const { account, ready } = useAccount()
  // 지금 결제창을 여는 중인 묶음 (두 번 눌러 두 주문이 생기지 않게)
  const [buying, setBuying] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  // 로그인 전에는 살 수 없습니다 — 별조각이 붙을 자리가 없으니까요.
  // 버튼을 내주고 401 로 돌려보내는 것보다, 로그인 길을 먼저 내주는 편이 낫습니다.
  const canBuy = isTossReady && account.isLoggedIn

  async function buy(packKey: string) {
    if (buying) return
    setBuying(packKey)
    setBuyError(null)
    const result = await openTossCheckout(packKey)
    if (!result.ok) setBuyError(result.message)
    setBuying(null)
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <CreditScreen
      title={`${CREDIT_UNIT.one} 구매하기`}
      balance={account.isLoggedIn ? account.credits : null}
    >
      {/* 무엇을 사는 것인지 — 사기 전에 알아야 할 한 가지.
          상자에 담지 않고 한 줄로 둡니다. 목록 바로 위 한 줄이면 읽힙니다. */}
      <p className="mt-6 text-sm text-muted-foreground">
        {withJosa(nameCredits(1), "으로로")} 타로점 한 판을 봐요.
      </p>

      {/* 묶음 — 값이 오르는 순서 그대로.
          ⚠️ 추천을 맨 위로 끌어올리지 않습니다. 작은 묶음과 큰 묶음이
             뒤섞이면 어느 게 큰 것인지 한눈에 안 들어옵니다. */}
      <CreditList>
        {CREDIT_PACKS.map((pack, i) => (
          <div key={pack.key} className={i > 0 ? "border-t border-border" : ""}>
            <PackRow
              pack={pack}
              canBuy={canBuy}
              busy={buying === pack.key}
              onBuy={() => void buy(pack.key)}
            />
          </div>
        ))}
      </CreditList>

      {/* 결제창을 열지 못했을 때 — 누른 자리 바로 아래에서 말합니다 */}
      {buyError && <p className="mt-3 text-sm leading-relaxed text-foreground">{buyError}</p>}

      {/* 로그인 전이면 살 수가 없습니다. 그 사실과 길을 함께 둡니다 */}
      {isTossReady && !account.isLoggedIn && (
        <Link
          href="/login?next=/my/credits/buy"
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          로그인하고 사기
        </Link>
      )}

      {/* 테스트 키로 붙어 있는 배포 — 진짜 결제를 기다리는 일이 없도록
          분명히 말합니다. 계약 전에 흐름을 확인할 때의 상태입니다. */}
      {isTossReady && isTossTestKey && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          지금은 테스트 결제예요. 실제로 돈이 빠져나가지 않아요.
        </p>
      )}

      {/* ⚠️ 결제가 붙은 배포에서는 이 말을 지웁니다. 살 수 있는 화면에
          "아직 준비 중"이 남아 있으면, 방금 산 사람이 자기가 뭘 한 건지
          헷갈립니다. */}
      {!isTossReady && (
        <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
          결제는 아직 준비 중이에요.
          <br />
          가입할 때 드린 {CREDIT_UNIT.one}으로 먼저 봐주세요.
        </p>
      )}
    </CreditScreen>
  )
}
