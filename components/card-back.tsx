// components/card-back.tsx
// 타로 카드 한 장의 뒷면/앞면을 표현하는 컴포넌트입니다.
// - 뒷면: 실제 라이더-웨이트 "Roses & Lilies" 카드 뒷면 이미지
// - 앞면: 이미지 로드 실패 시 자동으로 예쁜 placeholder로 전환됩니다.
// - reversed: true면 앞면 이미지 자체가 거꾸로(180도) 보이고, 정방향/역방향 뱃지가 붙습니다.
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const CARD_BACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Waite%E2%80%93Smith_Tarot_Roses_and_Lilies_cropped.jpg/500px-Waite%E2%80%93Smith_Tarot_Roses_and_Lilies_cropped.jpg"

export function CardBack({
  selected = false,
  flipped = false,
  reversed = false,
  faceImageUrl,
  faceAlt,
}: {
  selected?: boolean
  flipped?: boolean
  reversed?: boolean
  faceImageUrl?: string
  faceAlt?: string
}) {
  const [faceFailed, setFaceFailed] = useState(false)
  const showOrientationBadge = selected && flipped

  return (
    // select-none + touch-callout none: 카드를 길게 눌러도 브라우저의 이미지 미리보기/
    // 저장 팝업(카드 상세로 넘어가는 듯한 동작)이 뜨지 않게 막습니다.
    <div
      className="relative h-full w-full select-none [-webkit-touch-callout:none] [-webkit-user-select:none]"
      style={{ perspective: 800 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* 뒷면 */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-[6%] ring-1 transition-shadow ${
            selected ? "ring-2 ring-primary shadow-lg shadow-primary/30" : "ring-border"
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src={CARD_BACK_IMAGE || "/placeholder.svg"}
            alt="타로 카드 뒷면"
            fill
            draggable={false}
            className="pointer-events-none object-cover [-webkit-user-drag:none]"
            sizes="200px"
          />
        </div>

        {/* 앞면 — reversed면 이미지 자체를 180도 더 돌려서 거꾸로 보이게 함 */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[6%] ring-1 ring-border"
          style={{
            backfaceVisibility: "hidden",
            transform: reversed ? "rotateY(180deg) rotate(180deg)" : "rotateY(180deg)",
          }}
        >
          {faceImageUrl && !faceFailed ? (
            <Image
              src={faceImageUrl || "/placeholder.svg"}
              alt={faceAlt ?? ""}
              fill
              draggable={false}
              className="pointer-events-none object-cover [-webkit-user-drag:none]"
              sizes="200px"
              onError={() => setFaceFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20 p-2 text-center text-[10px] leading-tight text-muted-foreground">
              {faceAlt}
            </div>
          )}
        </div>
      </motion.div>

    </div>
  )
}