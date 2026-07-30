// lib/chat-errors.ts
// [단일 진실 소스] 대화가 막혔을 때 사람에게 무엇을 말하고, 무엇을 할 수
// 있게 해줄지 한 곳에서 정합니다.
//
// ┌─ 왜 한 곳에 모으는가 ─────────────────────────────────────────────
// │ 예전에는 서버가 준 문장을 그대로 화면에 찍었습니다. 그래서 제미나이가
// │ 준 영어 JSON 덩어리가 고스란히 떴습니다 —
// │
// │   제미나이 호출 실패 (429) { "error": { "code": 429, "message":
// │   "You exceeded your current quota, ..." } }
// │
// │ 읽는 사람에게는 무슨 일이 났는지도, 무엇을 하면 되는지도 알 수 없는
// │ 글자입니다. 게다가 우리 쪽 사정(어느 모델을 쓰는지, 한도가 얼마인지)이
// │ 그대로 드러납니다.
// │
// │ 원문은 우리가 봅니다(서버 로그 · 브라우저 콘솔). 화면에는 우리말과
// │ "그래서 지금 무엇을 하면 되는지"만 갑니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 화면에서 문장을 새로 쓰지 마세요. 여기서 가져다 쓰세요. 두 벌이 되면
//    한쪽만 고쳐진 채로 남습니다.
//
// ⚠️ 서버는 status 만 주지 않고 kind 도 함께 줍니다. 문장을 눈으로 맞춰
//    분류하면(문장에 "quota" 가 들었나 보는 식) 문장을 다듬는 순간
//    분류가 조용히 깨집니다.

/** 무엇 때문에 막혔는가 */
export type ChatErrorKind =
  /** 인터넷이 끊겼거나 요청이 아예 나가지 못했다 */
  | "offline"
  /** 로그인이 풀렸다 (401) */
  | "signedOut"
  /** 이 판을 찾을 수 없다 (400 · 404) */
  | "notFound"
  /** 이 판의 이어묻기를 다 썼다 (402) */
  | "needCredits"
  /** 우리 쪽 과속방지턱 — 너무 빠르게 여러 번 (429) */
  | "tooFast"
  /** 제미나이의 하루 몫을 다 썼다 */
  | "quotaDay"
  /** 제미나이가 순간적으로 몰렸다 */
  | "quotaSpeed"
  /** 답이 오다 시간이 다 됐다 (504) */
  | "timeout"
  /** 이어졌는데 글자가 한 자도 오지 않았다 */
  | "empty"
  /** 서버·설정 문제 (5xx · 503) */
  | "server"
  /** 그 외 */
  | "unknown"

export interface ChatErrorInfo {
  kind: ChatErrorKind
  /** 샨티 목소리로 사람에게 보여줄 말 */
  message: string
  /** 지금 무엇을 하면 되는지 (필요할 때만) */
  hint?: string
  /** "다시 물어보기"를 내줄지 — 다시 해서 될 일일 때만 참입니다 */
  canRetry: boolean
  /** 다시 하는 것 말고 갈 곳이 있을 때 */
  action?: { label: string; href: string }
  /** 몇 초 뒤에 다시 되는지 (아는 경우만) */
  retryAfterSeconds?: number
}

/** kind 를 서버가 준 문자열에서 안전하게 받아냅니다 */
const KINDS: ChatErrorKind[] = [
  "offline",
  "signedOut",
  "notFound",
  "needCredits",
  "tooFast",
  "quotaDay",
  "quotaSpeed",
  "timeout",
  "empty",
  "server",
  "unknown",
]

export function asChatErrorKind(raw: unknown): ChatErrorKind | null {
  return typeof raw === "string" && (KINDS as string[]).includes(raw)
    ? (raw as ChatErrorKind)
    : null
}

/**
 * 상태 코드만 있을 때의 짐작. kind 가 오면 그쪽이 우선입니다.
 *
 * ⚠️ 402 를 "크레딧"으로만 읽지 않습니다. 대화에서 402 가 뜨는 건 잔액이
 *    아니라 "이 판의 이어묻기를 다 썼다"는 뜻이 대부분입니다. 두 경우의
 *    다음 걸음이 같아서(한 장 더 쓰기) 한 갈래로 둡니다.
 */
function kindFromStatus(status: number | undefined): ChatErrorKind {
  if (status === 401) return "signedOut"
  if (status === 400 || status === 404) return "notFound"
  if (status === 402) return "needCredits"
  if (status === 429) return "tooFast"
  if (status === 504) return "timeout"
  if (status === 503) return "server"
  if (status && status >= 500) return "server"
  return "unknown"
}

/** 초를 사람이 읽는 말로 — "89초 뒤"보다 "1분 반쯤 뒤"가 낫습니다 */
function humanWait(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.round(seconds / 60)
  return `${minutes}분`
}

/**
 * 막힌 사정을 사람에게 보여줄 모양으로 바꿉니다.
 *
 * 부르는 쪽은 아는 것만 넘기면 됩니다 — 없는 값은 알아서 짐작합니다.
 */
export function describeChatError(input: {
  /** HTTP 상태 (있으면) */
  status?: number
  /** 서버가 알려준 갈래 (있으면 status 보다 우선) */
  kind?: unknown
  /** 서버가 준 원문 — 화면에 쓰지 않습니다. 콘솔에만 남깁니다 */
  detail?: string
  /** 몇 초 뒤에 다시 되는지 */
  retryAfterSeconds?: number
  /** 브라우저가 인터넷이 끊겼다고 말하는가 */
  offline?: boolean
}): ChatErrorInfo {
  const kind: ChatErrorKind =
    (input.offline ? "offline" : null) ?? asChatErrorKind(input.kind) ?? kindFromStatus(input.status)

  const wait = input.retryAfterSeconds

  switch (kind) {
    case "offline":
      return {
        kind,
        message: "이 몸의 목소리가 닿지 않는구먼. 연결이 끊긴 듯하다냥.",
        hint: "인터넷을 확인하고 다시 물어보게.",
        canRetry: true,
      }

    case "signedOut":
      return {
        kind,
        message: "흠, 누구인지 다시 확인해야겠구먼.",
        hint: "오래 열어두면 이렇게 된다네. 다시 들어오면 이 대화는 그대로 있어.",
        canRetry: false,
        action: { label: "다시 로그인하기", href: "/login" },
      }

    case "notFound":
      return {
        kind,
        message: "이 판을 찾을 수가 없구먼.",
        hint: "다른 기기에서 본 타로점이거나, 기록이 지워진 것일 수 있다네.",
        canRetry: false,
        action: { label: "기록으로 가기", href: "/my" },
      }

    case "needCredits":
      return {
        kind,
        // 여기서 "왜 막혔는지"를 굳이 셈으로 설명하지 않습니다. 다음 걸음만
        // 분명하면 됩니다 — 미터기를 들이대는 인상을 주지 않으려는 뜻입니다.
        message: "흐음, 이 한 판으로는 여기까지구먼.",
        hint: "한 장 더 쓰면 이 대화를 그대로 이어갈 수 있다네.",
        canRetry: false,
        action: { label: "이어서 묻기", href: "/my/credits" },
      }

    case "tooFast":
      return {
        kind,
        message: "잠깐, 조금 빠르구먼.",
        hint: wait ? `${humanWait(wait)}쯤 쉬었다가 다시 청해보라냥.` : "조금 쉬었다가 다시 청해보라냥.",
        canRetry: true,
        retryAfterSeconds: wait,
      }

    case "quotaDay":
      return {
        kind,
        // ⚠️ "한도"·"quota"·모델 이름을 쓰지 않습니다. 우리 쪽 사정이고,
        //    듣는 사람이 할 수 있는 일도 아닙니다. 언제 다시 되는지만
        //    분명히 말합니다.
        message: "오늘은 이 몸이 카드를 너무 많이 들여다봤구먼... 눈이 흐려졌다냥.",
        hint: "내일 다시 오면 또 읽어줄게. 지금까지 나눈 이야기는 그대로 남아 있어.",
        canRetry: false,
        action: { label: "기록 보기", href: "/my" },
      }

    case "quotaSpeed":
      return {
        kind,
        message: "지금 이 몸을 찾는 이가 많구먼. 잠시 숨을 고르겠네.",
        hint: wait ? `${humanWait(wait)}쯤 뒤에 다시 물어보라냥.` : "잠시 뒤에 다시 물어보라냥.",
        canRetry: true,
        retryAfterSeconds: wait,
      }

    case "timeout":
      return {
        kind,
        message: "흠... 생각이 너무 길어졌구먼.",
        hint: "짧게 나눠 물어보면 이 몸이 더 잘 읽는다네.",
        canRetry: true,
      }

    case "empty":
      return {
        kind,
        message: "말문이 막혔구먼. 방금 건 이 몸의 실수다냥.",
        hint: "같은 것을 한 번만 더 물어봐주게.",
        canRetry: true,
      }

    case "server":
      return {
        kind,
        message: "이 몸이 잠시 카드를 들 수 없는 상태구먼.",
        hint: "조금 뒤에 다시 물어보게. 계속 이러면 알려주면 고맙겠네.",
        canRetry: true,
      }

    default:
      return {
        kind: "unknown",
        message: "흐음... 말이 막혔구먼.",
        hint: "다시 한 번 물어봐주게.",
        canRetry: true,
      }
  }
}
