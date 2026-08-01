// components/followup-banner.tsx
// 이어묻기가 얼마 안 남았을 때 입력창 위에 얹히는 얇은 띠.
//
// ┌─ 왜 카드가 아니라 띠인가 ─────────────────────────────────────────
// │ 예전에는 대화 흐름 안에 상자로 넣었습니다. 그러면 나누던 이야기를
// │ 밀어 올려서, 답을 읽는 중에 화면이 움직입니다. 얇은 띠로 입력창에
// │ 얹으면 자리를 뺏지 않고, 마음에 안 들면 닫을 수 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 두 단계 ─────────────────────────────────────────────────────────
// │ FOLLOWUP_WARN_AT(5)부터        남은 횟수만 조용히 셉니다
// │ FOLLOWUP_NEARLY_DONE_AT(2)부터 미리 한 개 더 쓰는 길을 함께 냅니다
// │
// │ 다섯 번 남았을 때부터 결제를 권하면, 아직 한참 물어볼 수 있는 사람에게
// │ 미터기를 들이대는 셈입니다. 정말 끝이 보일 때만 권합니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 다 쓴 뒤에는 이 띠를 쓰지 않습니다. 닫을 수 있는 안내로 막다른 길을
//    알리면, 닫아버린 사람에게는 먹통인 입력창만 남습니다. 그때는 닫히지
//    않는 카드로 바꿔 답니다 (components/reading-result-view.tsx).
"use client"

import Link from "next/link"
import { X } from "lucide-react"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"

export function FollowupBanner({
  leftToAsk,
  /** 남은 별조각. 0 이면 사러 가는 길을 냅니다 */
  credits,
  /** 미리 한 개 더 쓰기를 권할 때인지 (FOLLOWUP_NEARLY_DONE_AT 이하) */
  offerMore,
  onSpend,
  onDismiss,
}: {
  leftToAsk: number
  credits: number
  offerMore: boolean
  onSpend: () => void
  onDismiss: () => void
}) {
  return (
    <div className="pointer-events-auto mb-2 flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2.5">
      <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
        이 판으로 {leftToAsk}번 더 물어볼 수 있어요
        {offerMore && (
          <span className="ml-1.5 text-muted-foreground">
            {credits > 0
              ? `${CREDIT_UNIT.one} 한 ${CREDIT_UNIT.counter}면 이어서 더 물어요`
              : `${CREDIT_UNIT.one}이 있으면 이어서 더 물어요`}
          </span>
        )}
      </p>

      {/* 권할 때만 손잡이를 냅니다 — 다섯 번 남았을 때는 세어주기만 합니다 */}
      {offerMore &&
        (credits > 0 ? (
          <button
            type="button"
            onClick={onSpend}
            className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary transition-opacity hover:opacity-70"
          >
            한 {CREDIT_UNIT.counter} 더 쓰기
            <span className="ml-1 font-normal text-muted-foreground">
              ({countCredits(credits)})
            </span>
          </button>
        ) : (
          <Link
            href="/my/credits"
            className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary transition-opacity hover:opacity-70"
          >
            더 받기
          </Link>
        ))}

      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />

      <button
        type="button"
        onClick={onDismiss}
        aria-label="알림 닫기"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
