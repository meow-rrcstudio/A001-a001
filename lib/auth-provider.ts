// lib/auth-provider.ts
// [단일 진실 소스] 로그인 수단을 사람 말로 부르는 법.
//
// 프로필 화면이 "카카오로 가입하셨어요"를 보여주는 데 씁니다.
// 서버가 주는 값(kakao·google·email)은 기계 말이라, 화면에 그대로
// 쓰면 "kakao" 가 뜹니다.
//
// ⚠️ 로그인 화면(components/login-form.tsx)에 수단을 추가하면 여기에도
//    한 줄 넣으세요. 빠뜨리면 그 사람 프로필에 "알 수 없음"이 뜹니다.
import type { AuthProvider } from "@/app/api/account/route"

export interface ProviderLabel {
  /** 화면에 쓰는 이름 */
  label: string
  /** 이름 옆 점 색 — 그 브랜드의 색입니다 */
  dot: string
  /** 이름 아래 한 줄. "다음에 어느 버튼을 눌러야 하는가"를 알려줍니다 */
  hint: string
}

export const PROVIDER_LABEL: Record<AuthProvider, ProviderLabel> = {
  kakao: {
    label: "카카오",
    dot: "#FEE500",
    hint: "다음에 로그인할 때도 카카오 버튼을 눌러 주세요.",
  },
  google: {
    label: "구글",
    dot: "#4285F4",
    hint: "다음에 로그인할 때도 구글 버튼을 눌러 주세요.",
  },
  email: {
    label: "이메일",
    dot: "#39cc00",
    hint: "다음에 로그인할 때도 이메일과 비밀번호로 들어와 주세요.",
  },
  // 로그인 수단을 알아내지 못한 경우입니다. 틀린 안내를 하느니
  // 아무 말도 안 하는 편이 낫습니다 — 엉뚱한 버튼을 누르면 같은
  // 이메일로 다른 계정이 생깁니다.
  unknown: {
    label: "알 수 없음",
    dot: "#9ca3af",
    hint: "로그인 방법을 확인하지 못했어요. 기록이 안 보이면 가입할 때 쓴 방법으로 다시 들어와 보세요.",
  },
}
