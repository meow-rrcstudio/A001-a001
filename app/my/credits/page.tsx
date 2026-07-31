// app/my/credits/page.tsx
// 크레딧 사기 — 묶음을 고르는 화면입니다.
//
// 홈과 같은 말투로 그립니다: 라임 바탕 + 검정 잉크, 명조 제목,
// 얇은 검정 선으로 나눈 목록, 강조할 것 하나만 검정 배너.
// (components/home-category-card.tsx · home-archive-banner.tsx 와 같은 결)
//
// ┌─ 결제 ────────────────────────────────────────────────────────────
// │ 누르면 토스 결제창이 뜹니다 (lib/toss-checkout.ts).
// │ 크레딧은 여기서 들어오지 않습니다 — 돌아온 뒤 승인이 떨어지는
// │ /my/credits/success 에서 들어옵니다.
// │
// │ ⚠️ 키(NEXT_PUBLIC_TOSS_CLIENT_KEY)가 없는 배포에서는 버튼을 내지 않고
// │    "곧 열려요"로 둡니다. 눌리지도 않는 버튼은 고장 난 것처럼 보입니다.
// │    키는 빌드에 박히므로, 넣은 뒤 반드시 재배포해야 버튼이 나옵니다.
// └──────────────────────────────────────────────────────────────────
//
// 묶음·가격·부르는 말은 전부 lib/credit-packs.ts 에서 옵니다.
// 값을 바꾸려면 여기가 아니라 그 파일을 고치세요.
"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { Footer } from "@/components/footer"
import { useAccount } from "@/lib/use-account"
import {
  CREDIT_PACKS,
  CREDIT_UNIT,
  countCredits,
  formatKrw,
  nameCredits,
  pricePerCredit,
  type CreditPack,
} from "@/lib/credit-packs"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/reading-entitlement"
import { CreditLedger } from "@/components/credit-ledger"
import { isTossReady, isTossTestKey } from "@/lib/toss-client"
import { openTossCheckout } from "@/lib/toss-checkout"

/**
 * 묶음 한 줄 — 홈 카테고리 카드와 같은 결(명조 제목 + 보조 설명).
 *
 * 줄 전체가 버튼입니다. 오른쪽 작은 글씨만 누를 수 있게 하면 손가락으로는
 * 잘 안 눌립니다.
 */
function PackRow({
  pack,
  dark = false,
  onBuy,
  busy = false,
  canBuy,
}: {
  pack: CreditPack
  dark?: boolean
  onBuy: () => void
  /** 이 줄의 결제창을 여는 중 */
  busy?: boolean
  /** 결제를 열 수 있는 배포인가 (아니면 누를 수 없는 안내로 둡니다) */
  canBuy: boolean
}) {
  const title = dark ? "text-white" : "text-black"
  const sub = dark ? "text-white/80" : "text-black/70"

  const inner = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span className={`block font-myeongjo text-xl font-bold leading-tight ${title}`}>
          {nameCredits(pack.credits)}
        </span>
        <span className={`mt-1.5 block text-sm ${sub}`}>
          한 {CREDIT_UNIT.counter}에 {formatKrw(pricePerCredit(pack))}
          {pack.featured && " · 가장 알뜰해요"}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className={`block text-lg font-semibold ${title}`}>{formatKrw(pack.priceKrw)}</span>
        <span className={`mt-0.5 block text-xs ${sub}`}>
          {!canBuy ? "곧 열려요" : busy ? "여는 중…" : "사기"}
        </span>
      </span>
    </>
  )

  // 결제가 아직 없는 배포에서는 누를 것을 내지 않습니다
  if (!canBuy) return <div className="flex items-center gap-4 p-6">{inner}</div>

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={busy}
      className="flex w-full items-center gap-4 p-6 text-left transition-opacity hover:opacity-80 disabled:opacity-60"
    >
      {inner}
    </button>
  )
}

export default function CreditsPage() {
  const { account, ready } = useAccount()
  // 지금 결제창을 여는 중인 묶음 (두 번 눌러 두 주문이 생기지 않게)
  const [buying, setBuying] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  // 로그인 전에는 살 수 없습니다 — 크레딧이 붙을 자리가 없으니까요.
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

  if (!ready) return <div className="min-h-screen bg-brand-lime" />

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col ${HEADER_SPACE}`}>
        {/* surface="lime": 이 화면은 배경이 이미 라임입니다.
            스크림은 색 장식이 아니라 "본문이 고정 헤더 밑을 지날 때 버튼이
            읽히게" 하는 장치라 끄지 않습니다 — 끄면 아래 검정 묶음 줄이
            버튼 뒤로 그대로 지나갑니다. 대신 연라임 중간색을 뺀 스크림으로
            바꿔 끼웁니다 (그 중간색이 라임 위에서 밝은 줄을 만들었습니다). */}
        <PageHeader variant="sub" backHref="/my/settings" surface="lime" />

        <div className="px-6">
          <h1 className="font-myeongjo text-2xl font-bold text-black">{CREDIT_UNIT.one}</h1>
          <p className="mt-1.5 text-sm text-black/80">
            {account.isLoggedIn
              ? `지금 ${countCredits(account.credits)} 남았어요.`
              : "로그인하면 남은 개수를 볼 수 있어요."}
          </p>
        </div>

        {/* 무엇을 사는 것인지 — 사기 전에 알아야 할 한 가지 */}
        <div className="mt-6 px-6">
          <div className="rounded-2xl bg-brand-lime-soft p-5">
            <p className="text-[15px] leading-relaxed text-black">
              {nameCredits(1)}으로 타로점 한 판을 봐요.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-black/70">
              해석을 받은 뒤 샨티에게 이어서 묻는 건 같은 한 판이라 더 들지 않아요
              (한 판에 {FOLLOWUPS_PER_CREDIT}번까지).
            </p>
          </div>
        </div>

        {/* 묶음 — 값이 오르는 순서 그대로 두고, 추천 하나만 검정으로
            (홈의 아카이빙 배너와 같은 방식).
            ⚠️ 추천을 맨 위로 끌어올리지 않습니다. 작은 묶음과 큰 묶음이
               뒤섞이면 어느 게 큰 것인지 한눈에 안 들어옵니다. */}
        <div className="mt-7 divide-y divide-black border-y border-black">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.key} className={pack.featured ? "bg-black" : ""}>
              <PackRow
                pack={pack}
                dark={pack.featured}
                canBuy={canBuy}
                busy={buying === pack.key}
                onBuy={() => void buy(pack.key)}
              />
            </div>
          ))}
        </div>

        {/* 결제창을 열지 못했을 때 — 누른 자리 바로 아래에서 말합니다 */}
        {buyError && (
          <div className="mt-3 px-6">
            <p className="text-sm leading-relaxed text-black">{buyError}</p>
          </div>
        )}

        {/* 로그인 전이면 살 수가 없습니다. 그 사실과 길을 함께 둡니다 */}
        {isTossReady && !account.isLoggedIn && (
          <div className="mt-4 px-6">
            <Link
              href="/login?next=/my/credits"
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand-ink px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              로그인하고 사기
            </Link>
          </div>
        )}

        {/* 테스트 키로 붙어 있는 배포 — 진짜 결제를 기다리는 일이 없도록
            분명히 말합니다. 계약 전에 흐름을 확인할 때의 상태입니다. */}
        {isTossReady && isTossTestKey && (
          <div className="mt-4 px-6">
            <p className="text-xs leading-relaxed text-black/70">
              지금은 테스트 결제예요. 실제로 돈이 빠져나가지 않아요.
            </p>
          </div>
        )}

        {/* 사기 전에 알아야 하는 것 — 전자상거래법은 청약철회 조건을 "구매
            전에" 알 수 있게 하라고 합니다. 결제 버튼 옆이 아니라 묶음 바로
            아래에 두는 이유입니다: 고르는 눈이 여기를 지나갑니다. */}
        <div className="mt-4 px-6">
          <p className="text-xs leading-relaxed text-black/70">
            쓰지 않은 {CREDIT_UNIT.one}은 언제든 돌려드려요. 이미 본 해석은 돌려드리지 못해요.{" "}
            <Link href="/refund" className="underline underline-offset-4 hover:opacity-70">
              환불정책
            </Link>
            <span className="px-1">·</span>
            <Link href="/terms" className="underline underline-offset-4 hover:opacity-70">
              이용약관
            </Link>
          </p>
        </div>

        {/* 어디에 썼는지 — 잔액만 보여주고 내역을 감추면 셈이 맞는지
            아무도 확인할 수 없습니다 (로그인 전에는 그려지지 않습니다). */}
        <div className="px-6">
          <CreditLedger />
        </div>

        {/* ⚠️ 결제가 붙은 배포에서는 이 말을 지웁니다. 살 수 있는 화면에
            "아직 준비 중"이 남아 있으면, 방금 산 사람이 자기가 뭘 한 건지
            헷갈립니다. */}
        {!isTossReady && (
          <p className="mt-7 px-6 text-center text-sm leading-relaxed text-black/70">
            결제는 아직 준비 중이에요.
            <br />
            가입할 때 드린 {CREDIT_UNIT.one}으로 먼저 봐주세요.
          </p>
        )}

        <div className="mt-6 px-6 pb-10 text-center">
          <Link
            // 카드 그림 아카이브(/tarot)가 아니라 실제로 타로를 보는 길입니다
            href="/tarot/ask"
            className="text-sm text-black underline underline-offset-4 hover:opacity-70"
          >
            타로 보러 가기
          </Link>
        </div>
      </main>

      <Footer variant="lime" />
    </div>
  )
}
