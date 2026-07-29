// lib/reading-entitlement.ts
// [단일 진실 소스] "이 사람이 사이트 안에서 바로 해석을 볼 수 있는가"를 판단합니다.
//
// 값은 크레딧 하나뿐입니다 — 건별 결제이기 때문입니다.
//   · 크레딧이 남은 회원 → 사이트 내 해석(대화형) 화면
//   · 그 외(비회원 포함) → 무료 화면(주제 고르기 → 프롬프트 복사)
//
// 크레딧 한 장 = 타로점 한 판입니다. 해석을 받은 뒤 이어서 묻는 것과
// 면담 중 카드를 더 뽑는 것은 같은 한 판이라 더 깎지 않습니다.
// (물을 때마다 돈이 나가면 아무도 이어서 묻지 않습니다)
//
// ⚠️ 잔액의 진짜 주인은 서버입니다 (credit_entries 원장 + spend_credit).
//    여기 있는 브라우저 보관함은 Supabase 가 연결되지 않은 환경(로컬 개발)
//    에서만 쓰이는 대체 경로입니다. 배포된 사이트는 언제나 서버를 봅니다.
"use client"

const STORAGE_KEY = "soulseoul.entitlement.v1"

// 크레딧 규칙의 숫자들은 lib/credit-rules.ts 에 있습니다.
// ⚠️ 이 파일은 "use client" 라서 서버가 여기서 숫자를 가져가면 스텁을
//    받습니다. 서버 코드는 lib/credit-rules.ts 를 직접 보세요.
export { WELCOME_CREDITS, FOLLOWUPS_PER_CREDIT, FOLLOWUP_WARN_AT } from "@/lib/credit-rules"

export interface Entitlement {
  isLoggedIn: boolean
  /** 남은 크레딧. 타로점 한 판에 한 장 */
  credits: number
}

/** 로그인은 했지만 크레딧이 없는 사람의 기본값 */
export const DEFAULT_ENTITLEMENT: Entitlement = {
  isLoggedIn: false,
  credits: 0,
}

/** 사이트 안에서 바로 해석·대화를 볼 수 있는가 */
export function canUseInsiteReading(e: Entitlement) {
  return e.isLoggedIn && e.credits > 0
}

/**
 * 브라우저에 남아 있는 권한.
 *
 * ⚠️ Supabase 가 연결된 환경에서는 아무도 이 함수를 부르지 않습니다
 *    (lib/use-account.ts 를 보세요). 로컬 개발용 대체 경로입니다.
 */
export function getEntitlement(): Entitlement {
  if (typeof window === "undefined") return DEFAULT_ENTITLEMENT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ENTITLEMENT
    const saved = JSON.parse(raw) as Partial<Entitlement> & {
      // 크레딧으로 바꾸기 전에 저장된 값 (플랜 + 체험 횟수)
      isPaid?: boolean
      trialsLeft?: number
    }
    // 예전 모양으로 저장된 브라우저도 로그아웃 없이 넘어오게 합니다.
    const credits =
      saved.credits ?? (saved.isPaid ? 10 : (saved.trialsLeft ?? 0))
    return { isLoggedIn: saved.isLoggedIn ?? false, credits }
  } catch {
    return DEFAULT_ENTITLEMENT
  }
}

/**
 * 로그아웃.
 *
 * Supabase 세션(쿠키)과 브라우저에 남은 값을 함께 지웁니다.
 * 둘 중 하나만 지우면 "로그아웃했는데 여전히 로그인돼 보이는" 상태가 됩니다.
 */
export async function signOut() {
  if (typeof window === "undefined") return
  try {
    const { getSupabaseBrowser } = await import("@/lib/supabase/client")
    await getSupabaseBrowser()?.auth.signOut()
  } catch {
    // 연결 전이면 넘어갑니다
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 무시
  }
  // 브라우저에 남은 타로점 기록도 함께 지웁니다 — 안 지우면 로그아웃 뒤에도
  // 앞 사람이 본 타로점이 "최근 본 타로점"과 기록 화면에 그대로 남습니다.
  const { clearAll } = await import("@/lib/reading-archive")
  clearAll()
}

function saveEntitlement(e: Entitlement) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(e))
  } catch {
    // 저장이 막힌 환경 — 무시
  }
}

/**
 * 크레딧 한 장 차감 — 타로점 한 판을 시작할 때 부릅니다.
 *
 * ⚠️ 이어서 묻는 것과 카드를 더 뽑는 것은 같은 한 판이라 여기서 다시
 *    부르지 않습니다. 부르는 곳은 질문을 던지는 한 곳뿐입니다.
 */
export async function consumeCredit(
  reason: "reading" | "extend" = "reading",
  key?: string
): Promise<boolean> {
  if (typeof window === "undefined") return false

  // 연결됐으면 서버가 깎습니다 (잔액의 진짜 주인은 서버입니다).
  const { isSupabaseConfigured } = await import("@/lib/supabase/env")
  if (isSupabaseConfigured) {
    try {
      const response = await fetch("/api/account/spend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, key }),
      })
      return response.ok
    } catch {
      return false
    }
  }

  // 연결 전 (로컬 개발) — 브라우저 보관함
  const e = getEntitlement()
  if (e.credits <= 0) return false
  saveEntitlement({ ...e, credits: e.credits - 1 })
  return true
}
