// lib/password-policy.ts
// 비밀번호가 갖춰야 할 조건 — 화면과 서버가 같은 말을 하게 하는 곳.
//
// ┌─ ⚠️ 두 곳에서 정하는 값입니다 ────────────────────────────────────
// │ 진짜로 막는 것은 Supabase 입니다:
// │   Authentication → Providers → Email → Password Requirements
// │     · Minimum length            = MIN_LENGTH (아래 값)
// │     · Lowercase, uppercase, digits, symbols  ← 켜기
// │
// │ ✅ 2026-08-07 아리님이 대시보드를 확인해 주셨습니다. 아래 값과 같습니다:
// │      Minimum password length = 8
// │      Password requirements   = Lowercase, uppercase letters,
// │                               digits and symbols
// │    **다시 묻지 마세요.** 이 파일을 고칠 때만 대시보드를 함께 보면
// │    됩니다. (그동안 같은 것을 여러 번 여쭤봤습니다 — 어디에도 적어두지
// │    않아서 물어본 사실 자체가 남지 않았기 때문입니다)
// │
// │ 여기 있는 것은 "누르기 전에 미리 알려주는" 몫입니다. 대시보드를
// │ 바꾸고 여기를 안 바꾸면, 화면은 통과시켰는데 서버가 막습니다 —
// │ 사용자에게는 영문 오류가 뜹니다. 반대면 멀쩡한 비밀번호를
// │ 화면이 막습니다.
// │
// │ 둘 중 하나를 고쳐야 할 일이 생기면 반드시 함께 고치세요.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 왜 화면에서도 보는가 — 서버에 물어보면 될 것 같지만, 그러면
//    "가입 시도 → 실패 → 영어 오류" 를 한 번 지나야 알 수 있습니다.
//    비밀번호를 정하는 자리에서는 조건을 미리 보여주는 편이 맞습니다.

/** 최소 글자 수 (Supabase 의 Minimum length 와 같아야 합니다) */
export const MIN_LENGTH = 8

/** 화면에 그대로 띄우는 안내. 조건을 바꾸면 이 문장도 함께 바꿉니다. */
export const PASSWORD_RULE_TEXT = `비밀번호는 영문 소문자·대문자·특수문자·숫자를 모두 넣어 ${MIN_LENGTH}자 이상이어야 해요.`

/**
 * 조건에 맞는가.
 *
 * ⚠️ 로그인할 때는 부르지 않습니다. 예전에 만든 계정은 지금 조건을
 *    지나지 않았을 수 있는데, 로그인 자리에서 막으면 자기 계정에
 *    못 들어갑니다. 가입(=처음 정하는 자리)에서만 봅니다.
 */
export function passwordMeetsPolicy(password: string): boolean {
  return (
    password.length >= MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    // 영문·숫자·공백이 아닌 것은 전부 특수문자로 봅니다. 목록을 못박으면
    // 목록에 없는 기호를 쓴 사람이 까닭 없이 막힙니다.
    /[^A-Za-z0-9\s]/.test(password)
  )
}
