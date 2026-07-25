// lib/reading-entitlement.ts
// [단일 진실 소스] "이 사람이 사이트 안에서 바로 해석을 볼 수 있는가"를 판단합니다.
//
// 규칙
//   · 유료 회원          → 사이트 내 해석(대화형) 화면
//   · 체험 횟수가 남은 회원 → 사이트 내 해석(대화형) 화면
//   · 그 외(비회원 포함)  → 무료 화면(주제 고르기 → 프롬프트 복사)
//
// ⚠️ 아직 로그인 기능이 없어서 상태를 브라우저(localStorage)에 임시로 둡니다.
//    인증을 붙일 때 getEntitlement() 안만 실제 세션·서버 조회로 바꾸면 되고,
//    화면 코드는 그대로 둡니다.
//
// 미리보기: 주소에 ?as=paid / ?as=trial / ?as=free 를 붙이면 그 상태로 보입니다.
//          (검토용이며, 인증 연결 시 readOverride 를 지우면 됩니다)
"use client"

const STORAGE_KEY = "soulseoul.entitlement.v1"

export interface Entitlement {
  isLoggedIn: boolean
  isPaid: boolean
  /** 남은 체험 리딩 횟수 */
  trialsLeft: number
}

/** 로그인은 했지만 아직 아무것도 안 산 사람의 기본값 */
export const DEFAULT_ENTITLEMENT: Entitlement = {
  isLoggedIn: false,
  isPaid: false,
  trialsLeft: 0,
}

/** 사이트 안에서 바로 해석·대화를 볼 수 있는가 */
export function canUseInsiteReading(e: Entitlement) {
  return e.isLoggedIn && (e.isPaid || e.trialsLeft > 0)
}

function readOverride(): Entitlement | null {
  if (typeof window === "undefined") return null
  const as = new URLSearchParams(window.location.search).get("as")
  if (as === "paid") return { isLoggedIn: true, isPaid: true, trialsLeft: 0 }
  if (as === "trial") return { isLoggedIn: true, isPaid: false, trialsLeft: 3 }
  if (as === "free") return { isLoggedIn: false, isPaid: false, trialsLeft: 0 }
  return null
}

/** 현재 사용자의 권한. 인증을 붙이면 이 함수 안만 바꾸면 됩니다. */
export function getEntitlement(): Entitlement {
  const override = readOverride()
  if (override) return override
  if (typeof window === "undefined") return DEFAULT_ENTITLEMENT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ENTITLEMENT
    return { ...DEFAULT_ENTITLEMENT, ...(JSON.parse(raw) as Partial<Entitlement>) }
  } catch {
    return DEFAULT_ENTITLEMENT
  }
}

/** 체험 1회 차감. 유료 회원은 차감하지 않습니다. */
export function consumeTrial() {
  if (typeof window === "undefined") return
  const e = getEntitlement()
  if (e.isPaid || e.trialsLeft <= 0) return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...e, trialsLeft: e.trialsLeft - 1 })
    )
  } catch {
    // 저장이 막힌 환경 — 무시
  }
}
