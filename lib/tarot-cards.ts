// lib/tarot-cards.ts
// 78장 전체의 정적 카드 정보(이름, 슬러그, 이미지)입니다.
// Notion에 아직 글이 없어도 이 목록으로 카드 그리드를 그릴 수 있고,
// 슬러그가 우리가 정한 규칙과 일치하므로 Notion에 글을 쓰는 순간
// 자동으로 상세 페이지(/blog/[slug])와 연결됩니다.

export type TarotSuit = "Wands" | "Cups" | "Swords" | "Pentacles"

export interface TarotCardInfo {
  slug: string
  nameKo: string
  nameEn: string
  arcana: "Major Arcana" | "Minor Arcana"
  suit: TarotSuit | null
  number: number
  imageUrl: string
}

// ---------------------------------------------------------------------------
// 메이저 아르카나 (22장) — RWS_Tarot_NN_Name.jpg 패턴, 확인된 안전한 이름
// ---------------------------------------------------------------------------
const majorArcanaNames: { ko: string; en: string; file: string }[] = [
  { ko: "바보", en: "The Fool", file: "Fool" },
  { ko: "마법사", en: "The Magician", file: "Magician" },
  { ko: "여사제", en: "The High Priestess", file: "High_Priestess" },
  { ko: "여황제", en: "The Empress", file: "Empress" },
  { ko: "황제", en: "The Emperor", file: "Emperor" },
  { ko: "교황", en: "The Hierophant", file: "Hierophant" },
  { ko: "연인", en: "The Lovers", file: "Lovers" },
  { ko: "전차", en: "The Chariot", file: "Chariot" },
  { ko: "힘", en: "Strength", file: "Strength" },
  { ko: "은둔자", en: "The Hermit", file: "Hermit" },
  { ko: "운명의 수레바퀴", en: "Wheel of Fortune", file: "Wheel_of_Fortune" },
  { ko: "정의", en: "Justice", file: "Justice" },
  { ko: "매달린 사람", en: "The Hanged Man", file: "Hanged_Man" },
  { ko: "죽음", en: "Death", file: "Death" },
  { ko: "절제", en: "Temperance", file: "Temperance" },
  { ko: "악마", en: "The Devil", file: "Devil" },
  { ko: "탑", en: "The Tower", file: "Tower" },
  { ko: "별", en: "The Star", file: "Star" },
  { ko: "달", en: "The Moon", file: "Moon" },
  { ko: "태양", en: "The Sun", file: "Sun" },
  { ko: "심판", en: "Judgement", file: "Judgement" },
  { ko: "세계", en: "The World", file: "World" },
]

// ---------------------------------------------------------------------------
// 마이너 아르카나 (56장) — 기본 패턴: {Suit}{NN}.jpg
// 단, 완드9는 예외적으로 다른 파일명("Tarot Nine of Wands.jpg")을 씁니다.
// ---------------------------------------------------------------------------
const suits: { key: TarotSuit; ko: string; fileKey: string }[] = [
  { key: "Wands", ko: "완드", fileKey: "Wands" },
  { key: "Cups", ko: "컵", fileKey: "Cups" },
  { key: "Swords", ko: "소드", fileKey: "Swords" },
  { key: "Pentacles", ko: "펜타클", fileKey: "Pents" },
]

const rankNames: { number: number; ko: string; en: string }[] = [
  { number: 1, ko: "에이스", en: "Ace" },
  { number: 2, ko: "2", en: "Two" },
  { number: 3, ko: "3", en: "Three" },
  { number: 4, ko: "4", en: "Four" },
  { number: 5, ko: "5", en: "Five" },
  { number: 6, ko: "6", en: "Six" },
  { number: 7, ko: "7", en: "Seven" },
  { number: 8, ko: "8", en: "Eight" },
  { number: 9, ko: "9", en: "Nine" },
  { number: 10, ko: "10", en: "Ten" },
  { number: 11, ko: "페이지", en: "Page" },
  { number: 12, ko: "나이트", en: "Knight" },
  { number: 13, ko: "퀸", en: "Queen" },
  { number: 14, ko: "킹", en: "King" },
]

function buildMinorArcanaCards(): TarotCardInfo[] {
  const cards: TarotCardInfo[] = []

  for (const suit of suits) {
    for (const rank of rankNames) {
      const slug = `universal-${suit.key.toLowerCase()}-${String(rank.number).padStart(2, "0")}`
      cards.push({
        slug,
        nameKo: `${suit.ko}의 ${rank.ko}`,
        nameEn: `${rank.en} of ${suit.key}`,
        arcana: "Minor Arcana",
        suit: suit.key,
        number: rank.number,
        // 위키미디어 핫링크 대신 사이트에 직접 저장한 이미지(public/tarot) 사용
        imageUrl: `/tarot/${slug}.webp`,
      })
    }
  }

  return cards
}

function buildMajorArcanaCards(): TarotCardInfo[] {
  return majorArcanaNames.map((card, index) => {
    const slug = `universal-major-${String(index).padStart(2, "0")}`
    return {
      slug,
      nameKo: card.ko,
      nameEn: card.en,
      arcana: "Major Arcana" as const,
      suit: null,
      number: index,
      // 위키미디어 핫링크 대신 사이트에 직접 저장한 이미지(public/tarot) 사용
      imageUrl: `/tarot/${slug}.webp`,
    }
  })
}

export const allTarotCards: TarotCardInfo[] = [...buildMajorArcanaCards(), ...buildMinorArcanaCards()]