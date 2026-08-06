// lib/auth-messages.ts
// Supabase 가 영어로 주는 사유를 사람 말로 옮깁니다.
//
// ⚠️ 마지막에 원문을 그대로 보여주지 않습니다. 예전에는 못 알아본 사유를
//    영어 그대로 화면에 띄웠는데, 읽는 사람에게는 "Invalid login credentials"
//    나 "New password should be different from the old password" 나 똑같이
//    알 수 없는 글자입니다. 무엇을 해야 할지도 알 수 없습니다.
//    그래서 아는 것은 옮기고, 모르는 것은 우리말 한 줄로 감싸고, 원문은
//    콘솔에만 남겨 개발자가 찾을 수 있게 합니다.
//
// 로그인·가입·비밀번호 재설정이 이 한 곳을 함께 씁니다.

/**
 * 에러 코드로 먼저 맞춥니다.
 *
 * ┌─ 왜 코드를 먼저 보는가 ───────────────────────────────────────────
 * │ 아래 MAP 은 영어 "문구"를 정규식으로 훑습니다. 그런데 문구는
 * │ Supabase 가 판을 올릴 때마다 조용히 바뀝니다. 한 글자만 달라져도
 * │ 정규식이 빗나가고, 그러면 정확한 사유가 있는데도 FALLBACK
 * │ ("잠시 문제가 생겼어요")으로 뭉개집니다 — 비밀번호가 틀렸다는 걸
 * │ 알려줄 수 있는데 "잠시 뒤 다시"라고 말하게 됩니다.
 * │
 * │ code 는 supabase-js 의 AuthApiError 가 들고 오는 값이고 문구와 달리
 * │ 잘 바뀌지 않습니다. 그래서 이걸 먼저 봅니다.
 * │
 * │ ⚠️ code 가 없는 오류(네트워크 등)도 있어서 MAP 은 그대로 둡니다.
 * │    코드 → 문구 → FALLBACK 순으로 내려갑니다.
 * └──────────────────────────────────────────────────────────────────
 */
const CODE_MAP: Record<string, string> = {
  invalid_credentials: "이메일이나 비밀번호가 맞지 않아요.",
  email_not_confirmed: "메일함에서 인증 링크를 먼저 눌러주세요.",
  user_already_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
  email_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
  user_banned: "이용이 제한된 계정이에요.",
  weak_password: "비밀번호가 너무 단순해요. 조금 더 복잡하게 정해주세요.",
  same_password: "예전 비밀번호와 다른 것으로 정해주세요.",
  signup_disabled: "지금은 가입을 받고 있지 않아요.",
  email_provider_disabled: "이메일 로그인이 꺼져 있어요.",
  provider_disabled: "이 로그인 방식이 아직 켜져 있지 않아요.",
  validation_failed: "입력한 내용을 다시 확인해 주세요.",
  over_request_rate_limit: "잠시 뒤에 다시 시도해 주세요.",
  over_email_send_rate_limit: "메일을 너무 자주 보냈어요. 잠시 뒤에 다시 시도해 주세요.",
  otp_expired: "링크가 만료됐어요. 다시 받아주세요.",
  session_not_found: "로그인이 풀렸어요. 다시 로그인해 주세요.",
  flow_state_not_found: "로그인이 중간에 끊겼어요. 다시 시도해 주세요.",
  flow_state_expired: "로그인이 중간에 끊겼어요. 다시 시도해 주세요.",
  bad_oauth_state: "로그인이 중간에 끊겼어요. 다시 시도해 주세요.",
  // 가입 순간 profiles 트리거가 실패하면 이 코드로 옵니다
  // (supabase/schema.sql 의 handle_new_user 를 확인하세요)
  unexpected_failure: "계정을 만들다 막혔어요. 잠시 뒤 다시 시도해 주세요.",
}

const MAP: [RegExp, string][] = [
  // ── 로그인 · 가입 ────────────────────────────────────────────────
  [/invalid login credentials/i, "이메일이나 비밀번호가 맞지 않아요."],
  [/user already registered|already been registered/i, "이미 가입된 이메일이에요. 로그인해 주세요."],
  [/email not confirmed/i, "메일함에서 인증 링크를 먼저 눌러주세요."],
  [/invalid email/i, "이메일 형식이 올바르지 않아요."],
  [/signups not allowed|signup is disabled/i, "지금은 가입을 받고 있지 않아요."],
  // 가입 순간 profiles 트리거가 실패하면 이 말이 옵니다.
  // (supabase/schema.sql 의 handle_new_user 를 확인하세요)
  [/database error/i, "계정을 만들다 막혔어요. 잠시 뒤 다시 시도해 주세요."],

  // ── 비밀번호 ─────────────────────────────────────────────────────
  [/password should be at least|password is too short/i, "비밀번호는 6자 이상이어야 해요."],
  [/should be different from the old|same as the old/i, "예전 비밀번호와 다른 것으로 정해주세요."],
  [/weak password|password is too weak/i, "비밀번호가 너무 단순해요. 조금 더 복잡하게 정해주세요."],

  // ── 링크·세션 ────────────────────────────────────────────────────
  [/token has expired|expired.*(token|link)|otp_expired/i, "링크가 만료됐어요. 다시 받아주세요."],
  [/invalid.*token|token.*invalid|already been used/i, "링크가 이미 사용됐거나 올바르지 않아요. 다시 받아주세요."],
  [/session.*(missing|not found)|auth session missing/i, "로그인이 풀렸어요. 다시 로그인해 주세요."],

  // ── 공급자(카카오·구글) ──────────────────────────────────────────
  [/provider is not enabled|unsupported provider/i, "이 로그인 방식이 아직 켜져 있지 않아요."],
  [/missing oauth secret/i, "이 로그인 방식의 설정이 아직 끝나지 않았어요."],
  [/invalid_client|oauth client was not found/i, "이 로그인 방식의 설정이 잘못됐어요. 다른 방법으로 로그인해 주세요."],

  // ── 돌아오는 길에 실패한 경우 (app/auth/callback → /login?error=) ─
  // 카카오·구글이 붙여 보내는 표준 사유들입니다. 사람이 취소한 것과
  // 설정이 틀린 것은 완전히 다른 일이라, 같은 말로 뭉뚱그리지 않습니다.
  [/access_denied|user_cancelled|consent_required/i, "로그인을 취소하셨어요. 다시 시도해 주세요."],
  [
    /redirect_uri_mismatch|redirect_uri/i,
    "돌아오는 주소 설정이 맞지 않아요. 다른 방법으로 로그인해 주세요.",
  ],
  // Supabase 가 OAuth 왕복에 쓰는 임시 상태값이 만료·유실된 경우입니다.
  // 창을 오래 열어두었거나 뒤로가기로 돌아왔을 때 납니다 — 다시 누르면 됩니다.
  [/bad_oauth_state|flow_state|state.*(not found|expired)/i, "로그인이 중간에 끊겼어요. 다시 시도해 주세요."],
  [/unable to exchange external code|code.*exchange/i, "로그인을 마치지 못했어요. 다시 시도해 주세요."],
  [/server_error|temporarily_unavailable/i, "로그인 서버가 잠시 불안정해요. 잠시 뒤 다시 시도해 주세요."],

  // ── 메일이 안 나감 (커스텀 SMTP 설정 문제) ───────────────────────
  // 위쪽 이른 검사에서 대부분 걸리지만, 문구가 바뀌었을 때를 위해 둡니다.
  [/sending.*(email|mail)|mail.*(server|delivery).*(fail|error)/i, "메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요."],

  // ── 그 밖에 ──────────────────────────────────────────────────────
  [/rate limit|too many|for security purposes/i, "잠시 뒤에 다시 시도해 주세요."],
  [/network|fetch failed|failed to fetch/i, "연결이 불안정해요. 잠시 뒤 다시 시도해 주세요."],
]

/** 메일 발송 자체가 실패했을 때 (커스텀 SMTP 설정 문제) */
const MAIL_SEND_FAILED = "메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요."

function isMailSendFailure(raw: string): boolean {
  return /error sending|failed to send|smtp|mailer/i.test(raw)
}

/** 못 알아본 사유를 감쌀 우리말 (원문은 콘솔에만) */
const FALLBACK = "잠시 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요."

/**
 * 못 옮긴 사유의 원문.
 *
 * FALLBACK 이 뜬 화면에서 "그래서 진짜 이유가 뭐였는지"를 꺼내 볼 수 있게
 * 마지막 것 하나를 들고 있습니다. /login?debug=1 이 이걸 읽어 화면에
 * 덧붙입니다 — 콘솔을 열 수 없는 손전화에서 확인하려고 둔 것입니다.
 */
let lastUntranslated: string | null = null

/**
 * 원문을 남깁니다 — 화면에는 안 나오고 /login?debug=1 과 콘솔에만.
 *
 * ⚠️ 사유가 통째로 비어 오는 일이 실제로 있습니다("{}" 하나만 찍혔습니다).
 *    그때 상태 코드마저 없으면 500 인지 400 인지도 몰라 처음부터 다시
 *    뒤지게 됩니다. 그래서 code 와 status 를 함께 적어둡니다.
 */
function note(raw: string, code?: string | null, status?: number): void {
  const marks = [code && `code=${code}`, status && `status=${status}`].filter(Boolean)
  lastUntranslated = marks.length ? `${raw || "(사유 없음)"} (${marks.join(" ")})` : raw
  if (typeof console !== "undefined") console.warn("[auth] 옮기지 못한 사유:", lastUntranslated)
}

/** 마지막으로 옮기지 못한 사유 (없으면 null) */
export function lastAuthErrorRaw(): string | null {
  return lastUntranslated
}

/**
 * 사유를 우리말로.
 *
 * @param raw  공급자·Supabase 가 준 영어 문구
 * @param code supabase-js AuthApiError 의 code. 있으면 이걸 먼저 봅니다 —
 *             문구는 판이 바뀌면 달라지지만 code 는 잘 안 바뀝니다.
 * @param status HTTP 상태. 500 대는 우리 잘못이 아니라 서버가 답을 못
 *               하는 것이라, 사유가 비어 있어도 그렇게 말해줄 수 있습니다.
 */
export function translateAuthError(raw: string, code?: string | null, status?: number): string {
  // ⚠️ 사유가 비어 있는 오류가 실제로 옵니다.
  //
  // 커스텀 SMTP 를 붙인 직후 비밀번호 재설정이 실패했는데, 화면의
  // 디버그 창에 찍힌 것이 "{}" 하나였습니다. Supabase 가 500 을 주면서
  // 본문을 비워 보낸 것입니다 — 오류 객체를 펴면 안이 비어 있습니다.
  //
  // 이때 "잠시 문제가 생겼어요"로 뭉개면 쓰는 사람도 우리도 아무것도
  // 모릅니다. 적어도 "우리 잘못이 아니라 서버가 답을 못 하는 중"이라는
  // 것은 말해줄 수 있습니다. 진짜 사유는 Supabase 의 Auth 로그에만
  // 남습니다.
  //
  // ⚠️ 사유를 알아봤더라도 원문은 남깁니다. 이 갈래는 화면만 보고는
  //    무엇이 막혔는지 알 수 없어서, /login?debug=1 이 제일 빠른 창입니다.
  if (status && status >= 500) {
    note(raw, code, status)
    // 발송이 원인이라고 적혀 있으면 그쪽이 더 정확합니다.
    if (isMailSendFailure(raw)) return MAIL_SEND_FAILED
    return "지금 서버가 답을 못 하고 있어요. 잠시 뒤 다시 시도해 주세요."
  }

  // ⚠️ 이것만 코드보다 먼저 봅니다 — 메일 발송 실패.
  //
  // 커스텀 SMTP 가 잘못 붙어 있으면 Supabase 는 "Error sending confirmation
  // email" 같은 문구에 code=unexpected_failure 를 얹어 보냅니다. 코드를
  // 먼저 보면 "계정을 만들다 막혔어요"가 되는데, 계정은 멀쩡히 만들어졌고
  // 막힌 것은 메일입니다. 엉뚱한 데를 고치게 됩니다.
  //
  // 이 갈래는 우리가 손쓸 수 없는 자리라(설정 문제) 사람에게는 담담히
  // 알리고, 진짜 원인은 Supabase 의 Auth 로그와 발송 서비스 로그에
  // 남습니다 (supabase/email-templates/README.md 참고).
  if (isMailSendFailure(raw)) return MAIL_SEND_FAILED

  // 코드가 먼저입니다. 문구가 어떻게 바뀌든 여기서 걸리면 정확합니다.
  if (code && CODE_MAP[code]) return CODE_MAP[code]

  if (!raw) {
    if (code || status) note(raw, code, status)
    return FALLBACK
  }

  // ⚠️ 이미 우리말인 것은 건드리지 않고 그대로 돌려줍니다.
  //    app/auth/callback 은 "코드가 없습니다"처럼 우리가 지은 사유를
  //    붙여 보내기도 합니다. 그걸 아래 표에 물리면 하나도 안 맞아서
  //    FALLBACK("잠시 문제가 생겼어요")으로 뭉개집니다 — 이미 정확히
  //    적어 둔 말을 뭉뚱그리는 셈입니다.
  if (/[가-힣]/.test(raw)) return raw

  // "after 57 seconds" 처럼 기다릴 시간을 알려줄 때가 있습니다.
  // "잠시 뒤"보다 "57초 뒤"가 훨씬 낫습니다 — 얼마나 기다릴지 알 수 있으니까요.
  const wait = raw.match(/after (\d+) seconds?/i)
  if (wait) return `${wait[1]}초 뒤에 다시 시도해 주세요.`

  for (const [pattern, korean] of MAP) if (pattern.test(raw)) return korean

  // 원문은 버리지 않습니다 — 어떤 사유가 안 옮겨졌는지 알아야 고칠 수 있습니다.
  note(raw, code, status)
  return FALLBACK
}
