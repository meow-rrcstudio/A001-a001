// lib/reading-session.ts
"use client"

import { allTarotCards, type TarotCardInfo } from "@/lib/tarot-cards"

const STORAGE_KEY = "reading-deck-slugs"
const DECK_SIZE = 48 // 부채꼴 밀도를 위해 78장 중 48장 사용 (전부 실제로 뽑을 수 있는 카드)

export function getReadingDeck(): TarotCardInfo[] {
  if (typeof window === "undefined") return allTarotCards.slice(0, DECK_SIZE)

  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const slugs: string[] = JSON.parse(saved)
      const bySlug = new Map(allTarotCards.map((c) => [c.slug, c]))
      const deck = slugs.map((s) => bySlug.get(s)).filter(Boolean) as TarotCardInfo[]
      if (deck.length === slugs.length && deck.length > 0) return deck
    } catch {
      // 파싱 실패 시 아래에서 새로 만듭니다.
    }
  }

  const shuffled = [...allTarotCards].sort(() => Math.random() - 0.5).slice(0, DECK_SIZE)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shuffled.map((c) => c.slug)))
  return shuffled
}

export function resetReadingDeck() {
  if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY)
}

// 주제선택 화면과 셔플 화면이 "같은 카드가 같은 자리에 있다"고 느끼도록,
// 두 화면이 동일한 계산식으로 카드 위치를 정합니다.
export function getScatteredLayout(index: number) {
  const seed = index * 137.5
  return {
    top: `${5 + ((seed * 1.7) % 85)}%`,
    left: `${5 + ((seed * 2.3) % 85)}%`,
    rotate: ((seed * 3.1) % 50) - 25,
  }
}