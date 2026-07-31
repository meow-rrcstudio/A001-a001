// lib/ai/gemini.ts
// 샨티의 해석을 제미나이로 생성합니다. 서버에서만 불립니다.
//
// ⚠️ 이 파일은 절대 클라이언트에서 import 하지 마세요. API 키가 브라우저로
//    넘어갑니다. 부르는 쪽은 app/api/ 아래의 라우트여야 합니다.
//
// lib/ai/openai.ts 와 같은 모양(runReading)을 돌려주므로 부르는 쪽에서는
// 어느 쪽을 쓰든 코드가 같습니다. SDK 없이 fetch 만 씁니다 —
// lib/ai-summary.ts 가 이미 같은 방식으로 제미나이를 부르고 있습니다.
import { buildReadingMessages, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import type { ReadingRunResult } from "@/lib/ai/openai"
import { READING_JSON_SCHEMA } from "@/lib/ai/reading-schema"
// 막혔을 때 사람에게 할 말은 한 곳에서만 정합니다 (화면도 같은 파일을 봅니다).
import { describeChatError, type ChatErrorKind } from "@/lib/chat-errors"

/** 환경변수로 덮어쓸 수 있습니다 (배포 없이 모델 비교) */
export const GEMINI_READING_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

/**
 * 배열(몇 장·어떤 자리)을 고르는 모델 — 해석과 다른 모델을 씁니다.
 *
 * ⚠️ 취향이 아니라 한도 때문입니다. 무료 등급의 하루 요청 한도는
 *    "프로젝트 × 모델" 단위입니다. 429 응답이 그렇게 적어 보냅니다:
 *
 *      quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
 *      quotaDimensions: { model: "gemini-2.5-flash" }, quotaValue: "20"
 *
 *    해석과 같은 모델로 배열까지 고르면 한 판에 같은 통에서 두 번 꺼냅니다.
 *    다른 모델로 옮기면 배열은 자기 통을 쓰고, 해석 통은 그만큼 남습니다.
 *    배열 고르기는 "이 질문에 몇 장이 맞나"를 정하는 가벼운 일이라
 *    작은 모델로 충분합니다.
 */
export const GEMINI_PLAN_MODEL = process.env.GEMINI_PLAN_MODEL || "gemini-2.5-flash-lite"

/**
 * 하루 한도에 닿았을 때(429) 한 번 더 시도할 모델.
 *
 * 위와 같은 이유로, 모델이 다르면 통도 다릅니다. 해석 통이 비었어도
 * 이 통이 남아 있으면 답을 받을 수 있습니다 — 사람에게는 "오늘은 여기까지"
 * 보다 "조금 다른 목소리"가 훨씬 낫습니다.
 *
 * ⚠️ 이건 응급처치입니다. 무료 등급의 하루 스무 번은 지인 스무 명을 감당
 *    하지 못합니다. 통을 하나 더 쓰는 것으로 두 배가 되는 것뿐입니다.
 *    제대로 된 해결은 결제를 붙여 유료 등급으로 올리는 것입니다.
 *    빈 문자열로 두면 이 재시도를 끕니다.
 */
export const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite"

/**
 * 로그인 전 맛보기 해석에 쓰는 모델.
 *
 * ┌─ 왜 일부러 낮은 등급을 쓰는가 ────────────────────────────────────
 * │ 값 때문만은 아닙니다. 맛보기와 제대로 된 해석은 눈에 띄게 달라야
 * │ 합니다 — 같은 것을 공짜로 주면 가입할 이유가 없습니다.
 * │
 * │ 생각을 끄면 카드 여러 장을 하나의 이야기로 엮는 힘이 떨어져서
 * │ 장마다 따로 노는 해설이 나옵니다(THINKING_BUDGET 주석 참고).
 * │ 회원 해석에서는 그게 흠이지만, 맛보기에서는 그 차이가 곧
 * │ "가입하면 이렇게 달라진다"가 됩니다. 흠을 일부러 쓰는 자리입니다.
 * │
 * │ 원가는 한 판에 몇 원 수준이라, 한도를 다 써도 하루 몇천 원입니다.
 * └──────────────────────────────────────────────────────────────────
 */
export const GEMINI_FREE_MODEL = process.env.GEMINI_FREE_MODEL || "gemini-2.5-flash-lite"

/**
 * 제미나이가 거절했을 때의 오류. 사람에게 보여줄 우리말과 원문을 함께 듭니다.
 *
 * ⚠️ 예전에는 구글이 준 영어 JSON 덩어리가 그대로 화면에 떴습니다.
 *    읽는 사람에게는 무슨 일이 났는지도, 무엇을 하면 되는지도 알 수 없는
 *    글자입니다. 원문은 우리(서버 로그)가 보고, 화면에는 우리말만 갑니다.
 */
export class GeminiError extends Error {
  constructor(
    /** 무엇 때문에 막혔는가 — 화면은 이걸로 말을 고릅니다 */
    readonly kind: ChatErrorKind,
    readonly status: number,
    /** 구글이 준 원문 — 로그에만 남깁니다 */
    readonly detail: string,
    /** 몇 초 뒤에 다시 되는지 (구글이 알려준 경우만) */
    readonly retryAfterSeconds?: number
  ) {
    // ⚠️ 문장을 여기서 새로 쓰지 않습니다. lib/chat-errors.ts 한 곳에서
    //    가져옵니다 — 두 벌이 되면 한쪽만 고쳐진 채로 남습니다.
    super(describeChatError({ kind, retryAfterSeconds }).message)
    this.name = "GeminiError"
  }
}

/**
 * 상태 코드와 원문을 보고 갈래를 정합니다.
 *
 * ⚠️ 429 를 한 갈래로 뭉치면 안 됩니다. 하루 몫을 다 쓴 것과 순간적으로
 *    몰린 것은 사람이 할 수 있는 일이 완전히 다릅니다 — 앞은 내일 오는
 *    것뿐이고, 뒤는 몇십 초 뒤에 다시 누르면 됩니다.
 *    구글은 그 구분을 quotaId 에 적어 보냅니다 (…PerDay… 가 들어갑니다).
 */
export function kindOfFailure(status: number, body: string): ChatErrorKind {
  if (status === 429) return body.includes("PerDay") ? "quotaDay" : "quotaSpeed"
  // 열쇠가 잘못됐거나 권한이 없는 것 — 사람 잘못이 아니고 우리가 고칠 일입니다.
  if (status === 401 || status === 403) return "server"
  if (status === 504) return "timeout"
  if (status >= 500) return "server"
  return "unknown"
}

/**
 * 구글이 "몇 초 뒤에 다시 하라"고 적어 보낸 값을 꺼냅니다.
 *
 * 이 둘은 순수 함수라 밖으로 내둡니다 — 실제 429 응답 본문을 넣어
 * 확인해볼 수 있어야 합니다 (하루 한도와 순간 몰림을 잘못 나누면
 * 사람에게 완전히 틀린 말을 하게 됩니다).
 */
export function retryDelayFrom(body: string): number | undefined {
  // "retryDelay": "41s" / "41.949504965s"
  const found = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/)
  if (!found) return undefined
  return Math.max(1, Math.ceil(Number(found[1])))
}

/**
 * 흘려보내는 중에 막혔을 때, 화면에 보낼 한 줄을 만듭니다.
 *
 * 해석(app/api/reading)과 면담(app/api/reading/chat)이 함께 씁니다 — 둘이
 * 따로 만들면 한쪽만 우리말이 되는 일이 생깁니다.
 *
 * 문장도 함께 담지만 화면이 실제로 보는 것은 kind 입니다
 * (lib/chat-errors.ts 가 그 갈래로 말과 다음 걸음을 고릅니다).
 */
export function streamErrorPayload(error: unknown, where: string) {
  if (error instanceof GeminiError) {
    // ⚠️ 화면에서 원문을 지웠으니, 로그가 유일한 단서입니다.
    //    (열쇠가 비어 있는 경우처럼 "우리가 고쳐야 하는 일"이 여기 적힙니다)
    console.error(`[${where}] ${error.kind} —`, error.detail.slice(0, 800))
    return {
      error: error.message,
      kind: error.kind,
      retryAfterSeconds: error.retryAfterSeconds,
    }
  }
  // 우리가 모르는 것 — 원문은 로그에만 남기고 화면에는 갈래만 보냅니다.
  console.error(`[${where}] 알 수 없는 실패:`, error)
  return { error: describeChatError({ kind: "unknown" }).message, kind: "unknown" as const }
}

/** 응답이 실패면 갈래를 담은 오류를 만듭니다 (원문은 로그로) */
async function failureFrom(response: Response, model: string) {
  const body = await response.text()
  // ⚠️ 원문은 반드시 로그에 남깁니다. 화면에서 지웠으니 여기가 유일한
  //    단서입니다 (Vercel → 프로젝트 → Logs 에서 봅니다).
  console.error(`[gemini] ${model} 호출 실패 (${response.status})`, body.slice(0, 800))
  return new GeminiError(
    kindOfFailure(response.status, body),
    response.status,
    body,
    retryDelayFrom(body)
  )
}

/**
 * 한 번에 받을 수 있는 토큰 한도.
 *
 * ⚠️ 생각(thinking)에 쓴 토큰도 여기서 같이 깎입니다. 그래서 생각을 켤
 *    때는 반드시 넉넉해야 합니다 — 좁으면 생각만 하다 한도에 닿아
 *    글자를 한 자도 안 내놓고 finishReason=MAX_TOKENS 로 끝납니다.
 *    화면에는 오류도 글도 없이 빈 칸만 남아서 원인을 찾기가 아주
 *    어렵습니다 (실제로 그렇게 한 번 막혔습니다).
 *    최소한 THINKING_BUDGET 의 몇 배는 되게 두세요.
 */
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 16000)

/**
 * 답하기 전에 얼마나 생각할지 — 해석용과 대화용을 따로 둡니다.
 *
 * 처음엔 0(생각 끄기)이었습니다. 위 경고대로 해석이 통째로 사라졌던 걸
 * 막으려는 응급처치였는데, 진짜 원인은 따로 있었고 한도만 넓히면
 * 됐습니다. 생각을 끈 채로 두니 카드 여러 장을 엮어 하나의 이야기로
 * 만드는 힘이 눈에 띄게 떨어졌습니다 — 장마다 따로 노는 해설이 나옵니다.
 *
 * ⚠️ 둘을 같은 값으로 두면 안 됩니다.
 *    해석은 카드 3~10장을 하나의 이야기로 엮는 일이라 생각이 값을 합니다.
 *    대화는 2~5문장짜리 답이라, 같이 올리면 품질은 그대로인데 기다림만
 *    길어집니다. 대화는 답이 빨리 오는 것 자체가 품질입니다.
 *
 * ⚠️ 생각하는 동안에는 글자가 한 자도 흘러나오지 않습니다. 그래서 예산을
 *    올리면 "첫 글자가 뜨기까지의 빈 화면"이 그만큼 길어집니다.
 *    무제한(-1)으로 두면 언제 올지 알 수 없어 쓰지 않습니다.
 *
 * 요청 횟수는 예산과 무관합니다 — 무료 등급의 하루 한도(요청 수)는
 * 이 값을 올려도 줄지 않습니다. 늘어나는 것은 토큰과 대기 시간입니다.
 *
 * 환경변수로 배포 없이 조절할 수 있습니다.
 */
const THINKING_BUDGET = Number(process.env.GEMINI_THINKING_BUDGET || 4096)
const CHAT_THINKING_BUDGET = Number(process.env.GEMINI_CHAT_THINKING_BUDGET || 1024)

// 생각이 한도를 다 먹어버리는 조합(빈 화면)을 아예 만들 수 없게 막습니다.
// 환경변수로 잘못 조여도 여기서 되돌려 놓습니다.
const SAFE_MAX_OUTPUT_TOKENS = Math.max(MAX_OUTPUT_TOKENS, THINKING_BUDGET * 4)

const THINKING = { thinkingBudget: THINKING_BUDGET }
const CHAT_THINKING = { thinkingBudget: CHAT_THINKING_BUDGET }
// 맛보기는 생각하지 않습니다 — 값도 값이지만, 첫 글자가 빨리 뜨는 것이
// 로그인 전 사람에게는 품질입니다.
const NO_THINKING = { thinkingBudget: 0 }

export async function runReadingWithGemini({
  topicKey,
  question,
  cards,
  surface = "inline",
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
  /** 사이트 안에서 읽어주므로 기본은 "inline" — 맺음말 링크가 붙지 않습니다. */
  surface?: "prompt" | "inline"
}): Promise<ReadingRunResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // 화면에는 "이 몸이 카드를 들 수 없는 상태"로 나갑니다. 어느 환경변수가
    // 비었는지는 사람이 할 수 있는 일이 아니고, 우리가 로그에서 봅니다.
    throw new GeminiError(
      "server",
      500,
      "GEMINI_API_KEY 가 없습니다. Vercel → Settings → Environment Variables 를 확인하세요."
    )
  }

  const { system, user } = buildReadingMessages({ topicKey, question, cards, surface })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_READING_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 캐릭터 + 주제. 매번 같아서 캐싱 대상입니다.
        systemInstruction: { parts: [{ text: system }] },
        // 이번에 뽑은 카드만.
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: SAFE_MAX_OUTPUT_TOKENS, thinkingConfig: THINKING },
      }),
    }
  )

  if (!response.ok) {
    throw await failureFrom(response, GEMINI_READING_MODEL)
  }

  const data = await response.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""

  if (!text.trim()) {
    const detail = `finishReason=${data?.candidates?.[0]?.finishReason ?? "없음"}`
    console.error("[gemini] 글자를 하나도 내놓지 않았습니다 —", detail)
    throw new GeminiError("empty", response.status, detail)
  }

  const usage = data?.usageMetadata ?? {}
  return {
    text,
    model: GEMINI_READING_MODEL,
    usage: {
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
      cachedInputTokens: usage.cachedContentTokenCount ?? 0,
    },
  }
}

/**
 * 위와 같지만 결과를 조각내어 흘려보냅니다.
 *
 * 해석 한 편에 20초 가까이 걸리므로, 다 만들어질 때까지 기다리면 화면이
 * 멈춘 것처럼 보입니다. 도착하는 대로 넘겨서 제목 → 요약 → 키워드 →
 * 섹션 순으로 채워지게 합니다.
 *
 * 돌려주는 것은 "지금까지 쌓인 JSON 문자열"입니다. 아직 완성되지 않은
 * 상태라 받는 쪽에서 parsePartialJson 으로 읽어냅니다.
 */
export function streamReadingWithGemini({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}): AsyncGenerator<string> {
  const { system, user } = buildReadingMessages({ topicKey, question, cards, surface: "inline" })
  return streamGeminiJson({ system, user, schema: READING_JSON_SCHEMA })
}

/**
 * 로그인 전 맛보기 해석.
 *
 * 회원 해석과 같은 프롬프트·같은 모양(JSON)을 씁니다 — 다른 것은 모델
 * 등급과 생각 예산뿐입니다. 프롬프트까지 따로 두면 두 벌이 되어 한쪽만
 * 고쳐진 채로 남습니다.
 *
 * 짧게 끊는 것은 maxOutputTokens 로 합니다. 생각을 끄므로 이 값이 그대로
 * 글 길이가 됩니다 (회원 해석은 이 값의 대부분을 생각에 씁니다).
 */
export function streamFreeReadingWithGemini({
  topicKey,
  question,
  cards,
}: {
  topicKey: ReadingTopicKey
  question: ReadingQuestion
  cards: { name: string; orientation: "정방향" | "역방향" }[]
}): AsyncGenerator<string> {
  const { system, user } = buildReadingMessages({ topicKey, question, cards, surface: "inline" })
  return streamGeminiJson({
    system,
    user,
    schema: READING_JSON_SCHEMA,
    purpose: "free",
    maxOutputTokens: Number(process.env.GEMINI_FREE_MAX_TOKENS || 2000),
  })
}

/**
 * 정해진 모양(JSON 스키마)으로 답을 받아 조각내어 흘려보냅니다.
 *
 * 해석·면담이 이 함수를 함께 씁니다. 돌려주는 것은 "지금까지 쌓인 JSON
 * 문자열"이라, 받는 쪽에서 parsePartialJson 으로 읽어냅니다.
 */
export async function* streamGeminiJson({
  system,
  user,
  schema,
  maxOutputTokens = SAFE_MAX_OUTPUT_TOKENS,
  /**
   * 무엇을 만드는 중인지 — 모델과 생각 예산이 갈립니다.
   *   "reading" 넉넉히 생각 · "chat" 짧게 생각
   *   "free"    생각 없이, 낮은 등급 모델로 (로그인 전 맛보기)
   * (위 THINKING_BUDGET · GEMINI_FREE_MODEL 주석 참고)
   */
  purpose = "reading",
}: {
  system: string
  user: string
  schema: unknown
  maxOutputTokens?: number
  purpose?: "reading" | "chat" | "free"
}): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError("server", 500, "GEMINI_API_KEY 가 없습니다. Vercel 환경변수를 확인하세요.")
  }

  const ask = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens,
            thinkingConfig:
              purpose === "free" ? NO_THINKING : purpose === "chat" ? CHAT_THINKING : THINKING,
            // 화면이 바로 쓸 수 있는 조각으로 받습니다.
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
      }
    )

  // 맛보기는 낮은 등급 모델로 갑니다. 통이 모델마다 따로라 회원 해석의
  // 하루 한도를 맛보기가 갉아먹지 않는다는 이점도 함께 있습니다.
  const primary = purpose === "free" ? GEMINI_FREE_MODEL : GEMINI_READING_MODEL
  let response = await ask(primary)

  // 한도에 닿았으면 다른 모델로 한 번 더 — 통이 모델마다 따로입니다
  // (위 GEMINI_FALLBACK_MODEL 주석 참고).
  if (response.status === 429 && GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== primary) {
    console.warn(`[gemini] ${primary} 한도에 닿아 ${GEMINI_FALLBACK_MODEL} 로 다시 시도합니다`)
    await response.text() // 몸통을 비워 연결을 놓아줍니다
    response = await ask(GEMINI_FALLBACK_MODEL)
  }

  if (!response.ok || !response.body) {
    throw await failureFrom(response, primary)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulated = ""
  // 글자 없이 끝났을 때 "왜"를 말해주기 위해 마지막 상태를 들고 있습니다.
  let finishReason = ""
  let blockReason = ""
  // 아무것도 못 읽었을 때 실제로 뭐가 왔는지 보여주려고 앞부분만 남깁니다.
  let rawHead = ""

  /**
   * "data: {...}" 한 줄을 읽습니다.
   *
   * ⚠️ 빈 줄(이벤트 구분자)로 끊지 않습니다. 예전엔 buffer.split("\n\n") 로
   *    끊었는데 두 가지가 망가졌습니다.
   *    · 서버가 CRLF 를 쓰면 구분자가 "\r\n\r\n" 이라 "\n\n" 이 아예
   *      없습니다 — 한 조각도 못 읽고 조용히 끝났습니다 (빈 화면의 원인)
   *    · 마지막 이벤트는 뒤에 빈 줄이 안 붙어 buffer 에 남은 채 버려졌습니다
   *    제미나이는 한 줄에 JSON 한 덩어리를 담아 보내므로 줄 단위로 읽습니다.
   */
  function readLine(line: string): string | null {
    const trimmed = line.trim()
    if (!trimmed.startsWith("data:")) return null
    const payload = trimmed.slice(5).trim()
    if (!payload || payload === "[DONE]") return null
    try {
      const data = JSON.parse(payload)
      finishReason = data?.candidates?.[0]?.finishReason ?? finishReason
      blockReason = data?.promptFeedback?.blockReason ?? blockReason
      const piece: string =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
      return piece || null
    } catch {
      // 아직 덜 온 줄 — 다음 조각과 합쳐질 때 다시 시도됩니다
      return null
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (rawHead.length < 400) rawHead += text.slice(0, 400 - rawHead.length)
    buffer += text

    // \r\n 과 \n 을 모두 받아냅니다. 마지막 조각은 아직 덜 왔을 수 있으니 남깁니다.
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const piece = readLine(line)
      if (piece) {
        accumulated += piece
        yield accumulated
      }
    }
  }

  // 마지막 줄은 뒤에 줄바꿈이 없어 buffer 에 남습니다 — 여기서 마저 읽습니다.
  const tail = readLine(buffer)
  if (tail) {
    accumulated += tail
    yield accumulated
  }

  // 한 글자도 못 받았는데 조용히 끝나면 화면엔 빈 칸만 남습니다.
  // 그럴 바엔 무엇이 왔는지 로그에 남기고 실패하는 편이 낫습니다.
  if (!accumulated.trim()) {
    const detail =
      `finishReason=${finishReason || "없음"}${blockReason ? `, blockReason=${blockReason}` : ""}, ` +
      `받은 것: ${rawHead ? JSON.stringify(rawHead.slice(0, 300)) : "아무것도 오지 않음"}`
    console.error("[gemini] 글자를 하나도 내놓지 않았습니다 —", detail)
    // 다시 물으면 되는 경우가 대부분이라 "empty" 로 둡니다.
    // 화면에는 "방금 건 이 몸의 실수다냥"으로 나가고 다시 물어보기가 붙습니다.
    throw new GeminiError("empty", 200, detail)
  }
}
