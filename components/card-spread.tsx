// components/card-spread.tsx
// 카드 배열(스프레드) 레이아웃을 번호 슬롯으로 그려주는 컴포넌트입니다.
//
// [진짜 연동] 슬롯의 좌표 원본은 lib/spread-layouts.ts 입니다.
// 그 파일의 left/top/rotate 숫자를 고치면 실제 리딩 화면과
// 스타일가이드(/design-1859)의 스프레드가 함께 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 판 전체 비율 : aspect-[16/10] → 세로가 더 필요하면 aspect-[16/12]
// │ · 카드 한 장 폭: w-[16%] (판 너비의 16%) → 숫자를 키우면 카드가 커짐
// │ · 배치 좌표    : lib/spread-layouts.ts 에서 수정 (% 단위)
// └──────────────────────────────────────────────────────────────────
import { spreadLayouts, type LayoutKey } from "@/lib/spread-layouts"
import { TarotCardSlot } from "@/components/tarot-card"

export function CardSpread({
  layout,
  className = "",
}: {
  layout: LayoutKey
  className?: string
}) {
  const slots = spreadLayouts[layout]

  return (
    <div className={`relative aspect-[16/10] w-full ${className}`}>
      {slots.map((slot, i) => (
        <div
          key={i}
          className="absolute w-[16%]"
          style={{
            left: slot.left,
            top: slot.top,
            transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
          }}
        >
          <TarotCardSlot number={i + 1} />
        </div>
      ))}
    </div>
  )
}
