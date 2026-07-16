// lib/card-archive.ts
// -----------------------------------------------------------------------------
// [노션 자동 매칭] 카드 아카이브 목록(/tarot/astrology)의 데이터 로직입니다.
//
// 노션에 글을 올릴 때 Slug만 규칙에 맞으면 이 페이지에 자동으로 나타납니다.
//   Slug 규칙: 덱이름-대분류-숫자
//   예) universal-swords-5  → Universal waite 덱 / swords 대분류 / 5번
//       lenormand-heart-1   → Lenormand 덱 / heart 대분류 / 1번
//   예전 형식(universal-major-00, 숫자 두 자리)도 그대로 인식합니다.
//
// 새 덱·새 대분류도 코드 수정 없이 글만 올리면 섹션과 필터 칩이 자동 생성됩니다.
// 덱 이름을 예쁘게 표기하고 싶으면 아래 deckLabels 에 한 줄만 추가하세요.
// -----------------------------------------------------------------------------

export interface ArchiveCard {
  slug: string //   노션 글의 Slug (블로그 링크에 사용)
  number: number // 카드 번호 (슬러그 마지막 조각)
  title: string //  노션 글 제목 (예: "The Hierophant - 전통과 신뢰")
}

export interface ArchiveCategory {
  key: string //   슬러그의 대분류 조각 (예: "swords")
  label: string // 화면 표기 (예: "swords", "major arcana")
  cards: ArchiveCard[]
}

export interface ArchiveDeck {
  key: string //   슬러그의 덱 조각 (예: "universal")
  label: string // 화면 표기 (예: "Universal waite")
  categories: ArchiveCategory[]
}

// 덱 표기 이름 — 없는 덱은 첫 글자만 대문자로 자동 표기됩니다.
const deckLabels: Record<string, string> = {
  universal: "Universal waite",
  lenormand: "Lenormand",
  oracle: "Oracle",
}

// 대분류 표기 이름 — 없는 대분류는 슬러그 조각을 그대로 씁니다.
const categoryLabels: Record<string, string> = {
  major: "major arcana",
  minor: "minor arcana",
}

// 섹션·컬럼이 나열되는 순서 (앞에 없는 것은 이름순으로 뒤에 붙습니다)
const deckOrder = ["universal", "lenormand", "oracle"]
const categoryOrder = ["major", "minor", "wands", "cups", "swords", "pentacles", "spade", "heart"]

/** 슬러그를 덱/대분류/번호로 분해. 규칙에 맞지 않으면 null (일반 블로그 글). */
export function parseCardSlug(
  slug: string
): { deck: string; category: string; number: number } | null {
  const parts = slug.trim().toLowerCase().split("-")
  if (parts.length < 3) return null
  const numberPart = parts[parts.length - 1]
  if (!/^\d+$/.test(numberPart)) return null
  return {
    deck: parts[0],
    category: parts.slice(1, -1).join("-"),
    number: parseInt(numberPart, 10), // "00"도 0으로 인식 (예전 형식 호환)
  }
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function orderIndex(order: string[], key: string) {
  const index = order.indexOf(key)
  return index === -1 ? order.length : index
}

/** 노션 글 목록 → 덱/대분류로 묶인 아카이브 구조 (번호순 정렬, 중복 슬러그 제거) */
export function buildCardArchive(posts: { slug: string; title: string }[]): ArchiveDeck[] {
  const deckMap = new Map<string, Map<string, Map<number, ArchiveCard>>>()

  for (const post of posts) {
    const parsed = parseCardSlug(post.slug)
    if (!parsed) continue

    if (!deckMap.has(parsed.deck)) deckMap.set(parsed.deck, new Map())
    const categoryMap = deckMap.get(parsed.deck)!
    if (!categoryMap.has(parsed.category)) categoryMap.set(parsed.category, new Map())
    const cardMap = categoryMap.get(parsed.category)!
    // 같은 번호의 글이 여럿이면 먼저 온 글(최신 발행순 조회라 최신 글)을 유지
    if (!cardMap.has(parsed.number)) {
      cardMap.set(parsed.number, { slug: post.slug, number: parsed.number, title: post.title })
    }
  }

  const decks: ArchiveDeck[] = []
  for (const [deckKey, categoryMap] of deckMap) {
    const categories: ArchiveCategory[] = []
    for (const [categoryKey, cardMap] of categoryMap) {
      categories.push({
        key: categoryKey,
        label: categoryLabels[categoryKey] ?? categoryKey,
        cards: [...cardMap.values()].sort((a, b) => a.number - b.number),
      })
    }
    categories.sort(
      (a, b) =>
        orderIndex(categoryOrder, a.key) - orderIndex(categoryOrder, b.key) ||
        a.key.localeCompare(b.key)
    )
    decks.push({ key: deckKey, label: deckLabels[deckKey] ?? capitalize(deckKey), categories })
  }

  decks.sort(
    (a, b) =>
      orderIndex(deckOrder, a.key) - orderIndex(deckOrder, b.key) || a.key.localeCompare(b.key)
  )
  return decks
}
