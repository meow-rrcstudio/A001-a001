// components/tarot-card.tsx
// Card.pdf 시안의 타로 카드 기본 요소 3종 (자리표시자 스타일).
// 실제 카드 이미지가 들어가는 리딩용 카드는 components/card-back.tsx 입니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 카드 비율      : aspect-[2/3] (가로 2 : 세로 3). 실제 타로 카드 비율.
// │ · 카드 크기      : 쓰는 쪽에서 감싸는 div의 너비로 정합니다.
// │                    예) <div className="w-24"><TarotCardFront /></div> → 96px 폭
// │ · 모서리 둥글기  : rounded-lg (globals.css의 --radius 기준)
// │ · 테두리 색      : border-border / 바탕색: bg-muted
// │ · 뒷면 안쪽 패널 : p-[7%]가 바깥 여백, 안쪽 색은 연한 살구빛 크림
// │ · 슬롯 번호      : font-mono text-sm text-muted-foreground
// └──────────────────────────────────────────────────────────────────

/** 카드 앞면 (빈 자리표시자) */
export function TarotCardFront({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aspect-[2/3] w-full rounded-lg border border-border bg-muted shadow-sm ${className}`}
    />
  )
}

/** 카드 뒷면 — 바깥 프레임 + 안쪽 크림 패널 */
export function TarotCardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aspect-[2/3] w-full rounded-lg border border-border bg-muted p-[7%] shadow-sm ${className}`}
    >
      <div className="h-full w-full rounded-[4px] border border-border bg-[oklch(0.96_0.013_50)]" />
    </div>
  )
}

/** 번호 슬롯 — 스프레드에서 "몇 번째 카드 자리"인지 표시 */
export function TarotCardSlot({
  number,
  className = "",
}: {
  number?: number | string
  className?: string
}) {
  return (
    <div
      className={`flex aspect-[2/3] w-full items-center justify-center rounded-lg border border-border bg-muted ${className}`}
    >
      {number !== undefined && (
        <span className="font-mono text-sm text-muted-foreground">{number}</span>
      )}
    </div>
  )
}
