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

  // ── 그 밖에 ──────────────────────────────────────────────────────
  [/rate limit|too many|for security purposes/i, "잠시 뒤에 다시 시도해 주세요."],
  [/network|fetch failed|failed to fetch/i, "연결이 불안정해요. 잠시 뒤 다시 시도해 주세요."],
]

/** 못 알아본 사유를 감쌀 우리말 (원문은 콘솔에만) */
const FALLBACK = "잠시 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요."

export function translateAuthError(raw: string): string {
  if (!raw) return FALLBACK

  // "after 57 seconds" 처럼 기다릴 시간을 알려줄 때가 있습니다.
  // "잠시 뒤"보다 "57초 뒤"가 훨씬 낫습니다 — 얼마나 기다릴지 알 수 있으니까요.
  const wait = raw.match(/after (\d+) seconds?/i)
  if (wait) return `${wait[1]}초 뒤에 다시 시도해 주세요.`

  for (const [pattern, korean] of MAP) if (pattern.test(raw)) return korean

  // 원문은 버리지 않습니다 — 어떤 사유가 안 옮겨졌는지 알아야 고칠 수 있습니다.
  if (typeof console !== "undefined") console.warn("[auth] 옮기지 못한 사유:", raw)
  return FALLBACK
}
