// app/my/credits/page.tsx
// 크레딧 사기 — 묶음을 고르는 화면입니다.
//
// 홈과 같은 말투로 그립니다: 라임 바탕 + 검정 잉크, 명조 제목,
// 얇은 검정 선으로 나눈 목록, 강조할 것 하나만 검정 배너.
// (components/home-category-card.tsx · home-archive-banner.tsx 와 같은 결)
//
// ⚠️ 아직 결제가 붙어 있지 않습니다. 토스페이먼츠 계약이 끝나면 buy() 안에서
//    결제창을 띄우면 됩니다. 그때까지는 "곧 열려요"라고 솔직히 말합니다 —
//    눌리지도 않는 버튼은 고장 난 것처럼 보입니다.
//
// 묶음·가격·부르는 말은 전부 lib/credit-packs.ts 에서 옵니다.
// 값을 바꾸려면 여기가 아니라 그 파일을 고치세요.
"use client"

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

/** 묶음 한 줄 — 홈 카테고리 카드와 같은 결(명조 제목 + 보조 설명) */
function PackRow({ pack, dark = false }: { pack: CreditPack; dark?: boolean }) {
  const title = dark ? "text-white" : "text-black"
  const sub = dark ? "text-white/80" : "text-black/70"

  return (
    <div className="flex items-center gap-4 p-6">
      <span className="min-w-0 flex-1">
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
        {/* 결제가 붙기 전까지는 버튼 대신 상태만 보여줍니다 */}
        <span className={`mt-0.5 block text-xs ${sub}`}>곧 열려요</span>
      </span>
    </div>
  )
}

export default function CreditsPage() {
  const { account, ready } = useAccount()

  if (!ready) return <div className="min-h-screen bg-brand-lime" />

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime">
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col ${HEADER_SPACE}`}>
        <PageHeader variant="sub" backHref="/my/settings" />

        <div className="px-6">
          <h1 className="font-myeongjo text-2xl font-bold text-black">{CREDIT_UNIT.one}</h1>
          <p className="mt-1.5 text-sm text-black/80">
            {account.isLoggedIn
              ? `지금 ${countCredits(account.credits)} 남았어요.`
              : "로그인하면 남은 장수를 볼 수 있어요."}
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
            ⚠️ 추천을 맨 위로 끌어올리지 않습니다. 1장·5장·12장이 뒤섞이면
               어느 게 큰 묶음인지 한눈에 안 들어옵니다. */}
        <div className="mt-7 divide-y divide-black border-y border-black">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.key} className={pack.featured ? "bg-black" : ""}>
              <PackRow pack={pack} dark={pack.featured} />
            </div>
          ))}
        </div>

        {/* 어디에 썼는지 — 잔액만 보여주고 내역을 감추면 셈이 맞는지
            아무도 확인할 수 없습니다 (로그인 전에는 그려지지 않습니다). */}
        <div className="px-6">
          <CreditLedger />
        </div>

        <p className="mt-7 px-6 text-center text-sm leading-relaxed text-black/70">
          결제는 아직 준비 중이에요.
          <br />
          가입할 때 드린 {CREDIT_UNIT.one}으로 먼저 봐주세요.
        </p>

        <div className="mt-6 px-6 pb-10 text-center">
          <Link
            // 카드 그림 아카이브(/tarot)가 아니라 실제로 타로를 보는 길입니다
            href="/tarot/reading"
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
