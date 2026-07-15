// components/card-spread.tsx
// 카드 배열(스프레드) 레이아웃을 번호 슬롯으로 그려주는 컴포넌트입니다.
//
// [진짜 연동] 슬롯의 좌표 원본은 lib/spread-layouts.ts 입니다.
// 그 파일의 left/top/rotate 숫자를 고치면 실제 리딩 화면과
// 스타일가이드(/design-1859)의 스프레드가 함께 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 판 전체 비율 : aspectClassName (기본 aspect-[16/10])
// │                  세로로 긴 스프레드(켈틱 크로스 등)는 aspect-[16/13] 권장
// │ · 카드 한 장 폭: cardWidthClassName (기본 w-[16%] = 판 너비의 16%)
// │                  카드가 많은 스프레드는 w-[13%] 처럼 줄이면 여유가 생김
// │ · 배치 좌표    : lib/spread-layouts.ts 에서 수정 (% 단위)
// └──────────────────────────────────────────────────────────────────
import { spreadLayouts, type LayoutKey } from "@/lib/spread-layouts"
import { TarotCardSlot } from "@/components/tarot-card"

export function CardSpread({
  layout,
  aspectClassName = "aspect-[16/10]",
  cardWidthClassName = "w-[16%]",
  className = "",
}: {
  layout: LayoutKey
  aspectClassName?: string
  cardWidthClassName?: string
  className?: string
}) {
  const slots = spreadLayouts[layout]

  return (
    <div className={`relative w-full ${aspectClassName} ${className}`}>
      {slots.map((slot, i) => (
        <div
          key={i}
          className={`absolute ${cardWidthClassName}`}
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
