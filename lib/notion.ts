// lib/notion.ts
// -----------------------------------------------------------------------------
// Notion API 호출 및 데이터 가공을 담당하는 모듈입니다.
// 공식 SDK(@notionhq/client) v5 기준으로 작성되었습니다.
//
// ⚠️ 중요: Notion SDK v5(API 버전 2025-09-03)부터는 데이터베이스(Database)가
// 하나 이상의 "데이터 소스(Data Source)"를 담는 컨테이너로 바뀌었습니다.
// 따라서 기존의 `notion.databases.query()` 는 더 이상 존재하지 않으며,
// `notion.dataSources.query()` 를 사용해야 합니다.
// 이 파일에서는 사용자가 입력한 NOTION_DATABASE_ID 로부터 데이터 소스 ID를
// 자동으로 찾아서 질의(query)하도록 처리합니다.
// -----------------------------------------------------------------------------

import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"

// 환경 변수 읽기 (.env.local 에 정의)
const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

// Notion 클라이언트 인스턴스 생성
// 환경 변수가 없을 때를 대비해 빈 문자열을 넘겨도 인스턴스 생성 자체는 됩니다.
// (실제 호출 시점에 환경 변수 존재 여부를 확인합니다.)
export const notion = new Client({ auth: NOTION_API_KEY })

// Notion 블록 -> Markdown 변환기
const n2m = new NotionToMarkdown({ notionClient: notion })

// -----------------------------------------------------------------------------
// 타입 정의
// -----------------------------------------------------------------------------
export interface Post {
  id: string
  title: string
  slug: string
  summary: string
  category: string | null
  publishedDate: string | null
  coverImage: string | null
  arcana: string | null // "Major Arcana" | "Minor Arcana"
  suit: string | null // "Wands" | "Cups" | "Swords" | "Pentacles" | null(메이저)
  element: string | null // "Earth" | "Fire" | "Air" | "Water" | null
  number: number | null // 카드 번호 (메이저는 0~21, 마이너는 1~14)
}

// -----------------------------------------------------------------------------
// 내부 유틸: 데이터 소스 ID 해석
// 데이터베이스 ID로 데이터베이스를 조회하여 첫 번째 데이터 소스의 ID를 가져옵니다.
// 매 요청마다 조회하지 않도록 모듈 스코프에 캐시합니다.
// -----------------------------------------------------------------------------
let cachedDataSourceId: string | null = null

async function getDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId

  if (!NOTION_DATABASE_ID) {
    throw new Error("환경 변수 NOTION_DATABASE_ID 가 설정되지 않았습니다.")
  }

  // 데이터베이스를 조회하면 data_sources 배열을 반환합니다. (SDK v5)
  const database = await notion.databases.retrieve({
    database_id: NOTION_DATABASE_ID,
  })

  // @ts-expect-error: data_sources 는 v5 응답 타입에 포함됩니다.
  const dataSources = database.data_sources as { id: string; name: string }[] | undefined

  if (!dataSources || dataSources.length === 0) {
    throw new Error("해당 데이터베이스에서 데이터 소스를 찾을 수 없습니다.")
  }

  cachedDataSourceId = dataSources[0].id
  return cachedDataSourceId
}

// -----------------------------------------------------------------------------
// 내부 유틸: Notion 페이지 객체 -> Post 객체로 가공
// 각 속성(Property) 타입에 맞춰 안전하게 값을 추출합니다.
// -----------------------------------------------------------------------------
function mapPageToPost(page: any): Post {
  const props = page.properties ?? {}

  // Title 타입 추출 (Name)
  const title = props["Name"]?.title?.map((t: any) => t.plain_text).join("") ?? "제목 없음"

  // Rich text 타입 추출 (Slug, Summary)
  const slug = props["Slug"]?.rich_text?.map((t: any) => t.plain_text).join("") ?? ""
  const summary = props["Summary"]?.rich_text?.map((t: any) => t.plain_text).join("") ?? ""

  // Select 타입 추출 (Category)
  const category = props["Category"]?.select?.name ?? null

  // Date 타입 추출 (Published Date)
  const publishedDate = props["Published Date"]?.date?.start ?? null

  // Files & media 타입 추출 (Files) - 첫 번째 파일을 썸네일로 사용
  const files = props["Files"]?.files ?? []
  const firstFile = files[0]
  const coverImage = firstFile
    ? firstFile.type === "external"
      ? firstFile.external?.url ?? null
      : firstFile.file?.url ?? null
    : null

    // Select 타입 추출 (Arcana, Suit, Element)
  const arcana = props["Arcana"]?.select?.name ?? null
  const suit = props["Suit"]?.select?.name ?? null
  const element = props["Element"]?.select?.name ?? null

  // Number 타입 추출
  const number = props["Number"]?.number ?? null

  return {
    id: page.id,
    title,
    slug,
    summary,
    category,
    publishedDate,
    coverImage,
    arcana,
    suit,
    element,
    number,
  }
}

// -----------------------------------------------------------------------------
// 공개 API: 게시된(Published) 게시글 목록을 발행일 최신순으로 조회
// -----------------------------------------------------------------------------
export async function getPublishedPosts(): Promise<Post[]> {
  // 환경 변수가 없으면 빈 배열을 반환하여 화면이 깨지지 않게 합니다.
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.warn("[v0] Notion 환경 변수가 설정되지 않았습니다. 빈 목록을 반환합니다.")
    return []
  }

  try {
    const dataSourceId = await getDataSourceId()

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      // Published 체크박스가 true 인 항목만 필터링
      filter: {
        property: "Published",
        checkbox: { equals: true },
      },
      // Published Date 기준 내림차순(최신순) 정렬
      sorts: [
        {
          property: "Published Date",
          direction: "descending",
        },
      ],
    })

    return response.results.map(mapPageToPost)
  } catch (error) {
    console.error("[v0] getPublishedPosts 에러:", error)
    return []
  }
}

// -----------------------------------------------------------------------------
// 공개 API: Slug 로 단일 게시글의 메타데이터 조회
// -----------------------------------------------------------------------------
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) return null

  try {
    const dataSourceId = await getDataSourceId()

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          { property: "Slug", rich_text: { equals: slug } },
          { property: "Published", checkbox: { equals: true } },
        ],
      },
    })

    if (response.results.length === 0) return null
    return mapPageToPost(response.results[0])
  } catch (error) {
    console.error("[v0] getPostBySlug 에러:", error)
    return null
  }
}

// -----------------------------------------------------------------------------
// 공개 API: 페이지 ID 로 본문 콘텐츠를 Markdown 문자열로 조회
// notion-to-md 를 사용하여 Notion 블록을 Markdown 으로 변환합니다.
// -----------------------------------------------------------------------------
export async function getPostContent(pageId: string): Promise<string> {
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId)
    const mdString = n2m.toMarkdownString(mdBlocks)
    const raw = mdString.parent ?? ""

    // notion-to-md가 토글(toggle) 블록 내용에 붙이는 들여쓰기(공백)를 제거합니다.
    // 마크다운은 줄 앞 공백이 4칸 이상이면 "코드 블록"으로 잘못 인식하기 때문에,
    // 코드 펜스(```) 안이 아닌 줄은 앞쪽 공백을 정리해줍니다.
    let insideCodeFence = false
    const cleaned = raw
      .split("\n")
      .map((line) => {
        if (line.trim().startsWith("```")) {
          insideCodeFence = !insideCodeFence
          return line
        }
        if (insideCodeFence) return line
        return line.replace(/^\s+/, "")
      })
      .join("\n")

    return cleaned
  } catch (error) {
    console.error("[v0] getPostContent 에러:", error)
    return ""
  }
}

// -----------------------------------------------------------------------------
// 공개 API: 모든 게시글의 Slug 목록 (sitemap / generateStaticParams 용)
// -----------------------------------------------------------------------------
export async function getAllSlugs(): Promise<{ slug: string; publishedDate: string | null }[]> {
  const posts = await getPublishedPosts()
  return posts.map((p) => ({ slug: p.slug, publishedDate: p.publishedDate }))
}
// -----------------------------------------------------------------------------
// 공개 API: 현재 슬러그의 이전/다음 게시글을 가져옵니다. (좌우 스와이프 내비게이션용)
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 공개 API: 같은 그룹(메이저 전체, 또는 같은 슈트) 안에서 이전/다음 카드를 가져옵니다.
// 예: 펜타클 3번 → 이전은 펜타클 2번, 다음은 펜타클 4번
// -----------------------------------------------------------------------------
export async function getAdjacentPosts(
  currentSlug: string
): Promise<{ prev: Post | null; next: Post | null }> {
  const posts = await getPublishedPosts()
  const current = posts.find((p) => p.slug === currentSlug)

  if (!current || current.number === null) return { prev: null, next: null }

  // 같은 그룹만 추려냅니다: 메이저는 메이저끼리, 마이너는 같은 슈트끼리
  const groupKey = current.arcana === "Major Arcana" ? "major" : current.suit
  const sameGroup = posts
    .filter((p) => {
      const pGroupKey = p.arcana === "Major Arcana" ? "major" : p.suit
      return pGroupKey === groupKey && p.number !== null
    })
    .sort((a, b) => (a.number as number) - (b.number as number))

  const index = sameGroup.findIndex((p) => p.slug === currentSlug)
  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? sameGroup[index - 1] : null,
    next: index < sameGroup.length - 1 ? sameGroup[index + 1] : null,
  }
}