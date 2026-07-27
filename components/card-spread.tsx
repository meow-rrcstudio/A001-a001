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

/** 이 배열에 실제로 놓인 카드 한 장 */
export interface SpreadCard {
  name: string
  reversed: boolean
  imageUrl: string
}

export function CardSpread({
  layout,
  cards,
  aspectClassName = "aspect-[16/10]",
  cardWidthClassName = "w-[16%]",
  className = "",
}: {
  layout: LayoutKey
  /**
   * 뽑힌 카드. 주면 번호 대신 그 카드 그림이 놓입니다 —
   * 해석 화면의 미니 배열이 이걸 씁니다. 안 주면 번호 슬롯(스타일가이드).
   */
  cards?: SpreadCard[]
  aspectClassName?: string
  cardWidthClassName?: string
  className?: string
}) {
  const slots = spreadLayouts[layout]

  return (
    <div className={`relative w-full ${aspectClassName} ${className}`}>
      {slots.map((slot, i) => {
        const card = cards?.[i]
        return (
          <div
            key={i}
            className={`absolute ${cardWidthClassName}`}
            style={{
              left: slot.left,
              top: slot.top,
              transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
            }}
          >
            {card ? (
              <span
                title={`${card.name}${card.reversed ? " (역방향)" : ""}`}
                className="block aspect-[1144/1919] overflow-hidden rounded-[3px] bg-card outline outline-[0.5px] outline-black/20"
              >
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className={`h-full w-full object-cover ${card.reversed ? "rotate-180" : ""}`}
                  />
                )}
              </span>
            ) : (
              <TarotCardSlot number={i + 1} />
            )}
          </div>
        )
      })}
    </div>
  )
}
