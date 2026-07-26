// lib/home-categories.ts
// [단일 진실 소스] 홈 화면의 카테고리 카드 6개와 그 안에 들어갈 인용구.
//
// ┌─ 인용구는 "달마다" 바뀝니다 ──────────────────────────────────────
// │ 카테고리마다 문구를 여러 개(pool) 두고, 그 달의 번호로 하나를 고릅니다.
// │ 무작위가 아니라 날짜로 정해지기 때문에
// │   · 서버와 브라우저가 항상 같은 문구를 그려서 깜빡임이 없고
// │   · 나올 수 있는 조합이 pool 길이만큼뿐이라 미리 다 확인할 수 있습니다
// │
// │ 문구를 추가하려면 quotes 배열에 한 줄 더 넣으면 됩니다. 배열이 길어질수록
// │ 회전 주기가 길어집니다(4개면 4개월 주기).
// │
// │ ※ 카드 높이가 160px로 고정이라 인용구는 두 줄 안에 들어가야 합니다.
// │    한글·영문 기준 40자, 한자·가나 기준 20자 정도가 안전합니다.
// └──────────────────────────────────────────────────────────────────
import type { ReadingTopicSlug } from "@/lib/reading-topics"

export interface Quote {
  /** 인용구 본문 */
  text: string
  /** 출처 표기 (원문 언어로 적습니다) */
  source: string
  /** 글자 방향. 히브리어·아랍어처럼 오른쪽에서 왼쪽으로 읽는 글은 "rtl" */
  dir?: "rtl"
}

export interface HomeCategory {
  /** 리딩 주제 slug — lib/reading-topics.ts 와 같은 값이어야 합니다 */
  slug: ReadingTopicSlug
  /** 카드에 보이는 이름 */
  label: string
  quotes: Quote[]
}

export const homeCategories: HomeCategory[] = [
  {
    slug: "self",
    label: "나",
    quotes: [
      { text: "Γνῶθι σεαυτόν.", source: "Δελφοί" },
      { text: "知人者智，自知者明.", source: "老子" },
      { text: "The unexamined life is not worth living.", source: "Socrates" },
      { text: "吾日三省吾身.", source: "論語" },
    ],
  },
  {
    slug: "daily",
    label: "일상",
    quotes: [
      { text: "古池や 蛙飛びこむ 水の音。", source: "松尾芭蕉" },
      { text: "平常心是道.", source: "馬祖道一" },
      { text: "Carpe diem.", source: "Horatius" },
      { text: "日日是好日.", source: "雲門" },
    ],
  },
  {
    slug: "love",
    label: "사랑",
    quotes: [
      { text: "月が綺麗ですね。", source: "夏目漱石" },
      { text: "Ἔρως ἀνίκατε μάχαν.", source: "Σοφοκλῆς" },
      { text: "Ubi amor, ibi oculus.", source: "Ricardus" },
      { text: "사랑은 서로를 바라보는 것이 아니라 같은 곳을 보는 것.", source: "Saint-Exupéry" },
    ],
  },
  {
    slug: "friend",
    label: "친구",
    quotes: [
      { text: "Ὁ φίλος ἄλλος αὐτός.", source: "Ἀριστοτέλης" },
      { text: "有朋自遠方來，不亦樂乎.", source: "論語" },
      { text: "Amicus certus in re incerta cernitur.", source: "Ennius" },
      { text: "A friend may well be reckoned the masterpiece of nature.", source: "Emerson" },
    ],
  },
  {
    slug: "career",
    label: "생산적인 일.",
    quotes: [
      { text: "Stay hungry. Stay foolish.", source: "Steve Jobs" },
      { text: "天行健，君子以自強不息.", source: "易經" },
      { text: "Festina lente.", source: "Augustus" },
      { text: "Nulla dies sine linea.", source: "Plinius" },
    ],
  },
  {
    slug: "money",
    label: "그저 돈.",
    quotes: [
      { text: "איזהו עשיר? השמח בחלקו.", source: "בן זומא", dir: "rtl" },
      { text: "知足者富.", source: "老子" },
      { text: "Non qui parum habet, sed qui plus cupit, pauper est.", source: "Seneca" },
      { text: "Money often costs too much.", source: "Emerson" },
    ],
  },
]

/**
 * 그 달에 보여줄 인용구를 고릅니다.
 * 무작위가 아니라 "연·월"로 정해지므로 같은 달에는 항상 같은 문구가 나옵니다.
 *
 * @param date 기준 날짜 (테스트·미리보기에서 다른 달을 확인할 때 넘깁니다)
 */
export function quoteOfMonth(category: HomeCategory, date: Date = new Date()): Quote {
  const monthIndex = date.getFullYear() * 12 + date.getMonth()
  return category.quotes[monthIndex % category.quotes.length]
}

/** 검정 아카이빙 배너에 들어가는 내용 */
export const archiveBanner = {
  title: "아카이빙",
  subtitle: "Tarot · Oracle · Yoga · Movie · Book",
  href: "/archive",
} as const
