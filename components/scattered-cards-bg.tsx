// components/scattered-cards-bg.tsx
"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { getReadingDeck, getScatteredLayout } from "@/lib/reading-session"

export function ScatteredCardsBackground() {
  // 배경 연출은 20장이면 충분 (덱이 커져도 무거워지지 않게)
  const cards = useMemo(() => getReadingDeck().slice(0, 20), [])

  const layout = useMemo(() => {
    return cards.map((_, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const neat = { top: `${20 + row * 22}%`, left: `${20 + col * 20}%` }
      return { neat, scattered: getScatteredLayout(i) }
    })
  }, [cards.length])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {cards.map((card, i) => (
        <motion.div
          key={card.slug}
          className="absolute aspect-[1144/1919] w-[38vw] max-w-44 overflow-hidden rounded-lg shadow-2xl"
          initial={{ top: layout[i].neat.top, left: layout[i].neat.left, rotate: 0, opacity: 0 }}
          animate={{
            top: layout[i].scattered.top,
            left: layout[i].scattered.left,
            rotate: layout[i].scattered.rotate,
            opacity: 1,
          }}
          transition={{ duration: 1.1, delay: i * 0.05, ease: "easeOut" }}
        >
          <Image src={card.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-background/70" />
    </div>
  )
}