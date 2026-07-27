// lib/ai/reading-schema.ts
// 해석을 화면이 바로 쓸 수 있는 조각으로 받기 위한 형식 정의입니다.
//
// 통짜 글로 받으면 화면(ReadingResultView)이 제목·요약·키워드·섹션을
// 나눌 수가 없습니다. 그래서 AI 에게 이 모양으로 내놓으라고 강제합니다.

/** AI 에게 강제할 출력 모양 (Gemini responseSchema / OpenAI json_schema 공용) */
export const READING_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "뽑은 카드 이름을 ·로 연결하고 — 뒤에 주제를 붙인 제목",
    },
    summary: {
      type: "string",
      description: "핵심 요약 1~2문장. 핵심 메시지는 **굵게**.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "핵심 키워드 5~6개. 명사형, 톤 중립.",
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string", description: "섹션 제목" },
          body: { type: "string", description: "섹션 본문" },
        },
        required: ["heading", "body"],
        // 스트리밍될 때 제목이 먼저 오도록
        propertyOrdering: ["heading", "body"],
      },
      description:
        "카드 흐름 → 주제별 조언 → 이 몸의 조언 → 한 줄 메시지 → 더 물어봐도 좋다냥 순서",
    },
  },
  required: ["title", "summary", "keywords", "sections"],
  // 스트리밍 순서 = 화면에 그려지는 순서
  propertyOrdering: ["title", "summary", "keywords", "sections"],
} as const

/**
 * 사이트 안에서 읽어줄 때만 붙는 출력 형식 지시.
 * 스키마가 모양은 강제하지만, 어느 내용이 어디로 가는지는 말로 알려줘야 합니다.
 */
export const READING_JSON_INSTRUCTION = `@output_json{
형식=JSON_한_덩어리|설명문_없이_JSON만,
title=제목_섹션_그대로,
summary=핵심_요약_섹션_그대로(인사말은_넣지_말_것),
keywords=핵심_키워드_배열,
sections=나머지_섹션들을_순서대로|각_원소={heading:섹션제목,body:본문},
sections_순서=카드_흐름>주제별_조언>이_몸의_조언>한_줄_메시지>더_물어봐도_좋다냥,
body=여러_문단이면_줄바꿈으로_이어_쓰기|불릿은_줄마다_"· "로_시작,
NOTE=인사("샨티의 인사")는_따로_넣지_않는다_화면이_이미_말풍선으로_보여준다
}`

/**
 * 스트리밍 도중의 불완전한 JSON 을 최대한 읽어냅니다.
 *
 * 글자가 도착하는 중에는 `{"title":"컵의 나이` 처럼 중간에 끊긴 상태라
 * 그냥 JSON.parse 하면 실패합니다. 열려 있는 문자열·괄호를 임시로 닫아
 * "지금까지 도착한 만큼"을 읽어냅니다. 실패하면 null 을 돌려줍니다.
 */
export function parsePartialJson<T>(text: string): T | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 코드 펜스(```json)를 붙여 보내는 경우 벗겨냅니다.
  const body = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim()
  if (!body.startsWith("{") && !body.startsWith("[")) return null

  try {
    return JSON.parse(body) as T
  } catch {
    // 아래에서 닫아보고 다시 시도합니다.
  }

  // 어디까지 열려 있는지 훑습니다 (문자열 안의 괄호는 세지 않도록).
  const stack: string[] = []
  let inString = false
  let escaped = false
  for (const char of body) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === "\\" && inString) {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === "{" || char === "[") stack.push(char)
    else if (char === "}" || char === "]") stack.pop()
  }

  let repaired = body
  if (inString) repaired += '"'
  // 값이 오다 만 자리(`"summary":` 뒤가 빈 경우)는 잘라냅니다.
  repaired = repaired.replace(/,\s*$/, "").replace(/:\s*$/, ': ""')
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]"
  }

  try {
    return JSON.parse(repaired) as T
  } catch {
    return null
  }
}
