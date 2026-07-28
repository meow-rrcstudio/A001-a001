// lib/server/reading-cards.ts
// 보관된 타로점의 카드 목록을 화면이 바로 그릴 수 있는 모양으로 되살립니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 화면은 카드를 { name, reversed, imageUrl } 로 그립니다. 그런데 해석을
// │ 요청할 때는 AI 에게 줄 { name, orientation } 만 보내고 있었습니다.
// │ 서버는 받은 그대로 DB 에 적었으니, 다시 열었을 때 그림 주소가 없어
// │ 카드가 회색 네모로만 나왔습니다.
// │
// │ 보내는 쪽은 고쳤지만, 그 전에 본 타로점들은 이미 그림 주소 없이
// │ 저장돼 있습니다. 카드 이름은 남아 있으니 이름으로 그림을 찾아
// │ 채워 넣습니다 — 옛 기록도 같이 살아납니다.
// └──────────────────────────────────────────────────────────────────
import "server-only"

import { allTarotCards } from "@/lib/tarot-cards"

const byName = new Map(allTarotCards.map((c) => [c.nameKo, c]))

/** 화면이 쓰는 카드 한 장 */
export interface StoredCard {
  name: string
  reversed: boolean
  imageUrl: string
}

type LooseCard = {
  name?: string
  reversed?: boolean
  orientation?: string
  imageUrl?: string
}

/** 저장된 카드 배열을 화면이 쓰는 모양으로 (빠진 값은 이름으로 채웁니다) */
export function restoreCards(raw: unknown): StoredCard[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const card = (item ?? {}) as LooseCard
    const name = card.name ?? ""
    return {
      name,
      // 예전 기록은 reversed 대신 orientation("역방향")만 있습니다
      reversed: card.reversed ?? card.orientation === "역방향",
      imageUrl: card.imageUrl || byName.get(name)?.imageUrl || "",
    }
  })
}
