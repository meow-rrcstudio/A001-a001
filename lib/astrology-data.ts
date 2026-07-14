// lib/astrology-data.ts
export interface AstrologyCard {
  id: number
  name: string
  nameEn: string
  slug: string
  meaning: string
}

export interface AstrologyDeck {
  id: string
  name: string
  cardType: string
  count: number
  cards: AstrologyCard[]
  headerBg: string
  altHeaderBg: string
}

// Universal Waite 카드만 추가
export const astrologyDecks: AstrologyDeck[] = [
  {
    id: 'universal-waite',
    name: 'Universal waite',
    cardType: 'minor arcana',
    count: 22,
    headerBg: 'bg-[#e8d8d2]',
    altHeaderBg: 'bg-[#cadff6]',
    cards: [
  { id: 0, name: 'The Fool', nameEn: 'TheFool', slug: 'universal-major-00', meaning: '새로운 시작' },
  { id: 1, name: 'The Magician', nameEn: 'TheMagician', slug: 'universal-major-01', meaning: '창조력과 의지' },
  { id: 2, name: 'The High Priestess', nameEn: 'HighPriestess', slug: 'universal-major-02', meaning: '직관과 지혜' },
  { id: 3, name: 'The Empress', nameEn: 'TheEmpress', slug: 'universal-major-03', meaning: '풍요로움과 창조성' },
  { id: 4, name: 'The Emperor', nameEn: 'TheEmperor', slug: 'universal-major-04', meaning: '권위와 리더십' },
  { id: 5, name: 'The Hierophant', nameEn: 'Hierophant', slug: 'universal-major-05', meaning: '전통과 신뢰' },
  { id: 6, name: 'The Lovers', nameEn: 'TheLovers', slug: 'universal-major-06', meaning: '선택과 관계' },
  { id: 7, name: 'The Chariot', nameEn: 'TheChariot', slug: 'universal-major-07', meaning: '의지와 통제' },
  { id: 8, name: 'Strength', nameEn: 'Strength', slug: 'universal-major-08', meaning: '내면의 힘' },
  { id: 9, name: 'The Hermit', nameEn: 'TheHermit', slug: 'universal-major-09', meaning: '내면의 성찰' },
  { id: 10, name: 'Wheel of Fortune', nameEn: 'WheelOfFortune', slug: 'universal-major-10', meaning: '운명의 순환' },
  { id: 11, name: 'Justice', nameEn: 'Justice', slug: 'universal-major-11', meaning: '정의와 균형' },
  { id: 12, name: 'The Hanged Man', nameEn: 'HangedMan', slug: 'universal-major-12', meaning: '희생과 관점' },
  { id: 13, name: 'Death', nameEn: 'Death', slug: 'universal-major-13', meaning: '변환과 재생' },
  { id: 14, name: 'Temperance', nameEn: 'Temperance', slug: 'universal-major-14', meaning: '조화와 절제' },
  { id: 15, name: 'The Devil', nameEn: 'TheDevil', slug: 'universal-major-15', meaning: '속박과 욕망' },
  { id: 16, name: 'The Tower', nameEn: 'TheTower', slug: 'universal-major-16', meaning: '갑작스러운 변화' },
  { id: 17, name: 'The Star', nameEn: 'TheStar', slug: 'universal-major-17', meaning: '희망과 영감' },
  { id: 18, name: 'The Moon', nameEn: 'TheMoon', slug: 'universal-major-18', meaning: '직관과 환상' },
  { id: 19, name: 'The Sun', nameEn: 'TheSun', slug: 'universal-major-19', meaning: '성공과 명확성' },
  { id: 20, name: 'Judgement', nameEn: 'Judgement', slug: 'universal-major-20', meaning: '각성과 부름' },
  { id: 21, name: 'The World', nameEn: 'TheWorld', slug: 'universal-major-21', meaning: '완성' },
],
  },
]

export const astrologyFilters = [
  { id: 'all', label: '전체' },
  { id: 'minor', label: 'Minor arcana' },
  { id: 'major', label: 'Major Arcana' },
  { id: 'bondage', label: '속박' },
  { id: 'liberation', label: '해방' },
]