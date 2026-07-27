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
// ⚠️ 아직 로그인 기능이 없어서 상태를 브라우저(localStorage)에 임시로 둡니다.
//    지금 구조로는 브라우저 데이터만 지우면 크레딧이 되살아납니다.
//    인증을 붙일 때 getEntitlement()·consumeCredit() 안만 서버 조회로
//    바꾸면 되고, 화면 코드는 그대로 둡니다.
//
// 미리보기: 주소에 ?as=paid / ?as=trial / ?as=free 를 붙이면 그 상태로 보입니다.
//          (검토용이며, 인증 연결 시 readOverride 를 지우면 됩니다)
"use client"

const STORAGE_KEY = "soulseoul.entitlement.v1"

/** 가입하면 얹어주는 첫 크레딧 */
export const WELCOME_CREDITS = 3

/**
 * 크레딧 한 장에 딸려오는 "이어서 묻기" 횟수.
 *
 * 원가 때문에 두는 값이 아닙니다 — 한 판에 스무 번을 물어도 원가는
 * 백 원이 안 됩니다. 스크립트로 한 장에 수천 번 때리는 걸 막는
 * 방어선입니다. 보통은 서너 번 묻고 끝나서 이 숫자를 볼 일이 없습니다.
 *
 * 그래서 미터기처럼 보이면 안 됩니다. 남은 횟수는 끝이 가까울 때만
 * (FOLLOWUP_WARN_AT) 슬쩍 보여주고, 다 쓰면 막지 말고 "한 장 더 쓰고
 * 이어가기"를 권합니다. 물어보려던 걸 못 묻게 하는 게 제일 나쁩니다.
 */
export const FOLLOWUPS_PER_CREDIT = 20

/** 남은 횟수가 이보다 적어질 때부터 화면에 보여줍니다 */
export const FOLLOWUP_WARN_AT = 5

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

function readOverride(): Entitlement | null {
  if (typeof window === "undefined") return null
  const as = new URLSearchParams(window.location.search).get("as")
  if (as === "paid") return { isLoggedIn: true, credits: 10 }
  if (as === "trial") return { isLoggedIn: true, credits: WELCOME_CREDITS }
  if (as === "free") return { isLoggedIn: false, credits: 0 }
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

// ═══════════════════════════════════════════════════════════════════
// ⚠️ 테스트 계정 — 오픈 전에 반드시 지울 코드입니다.
//
// 실제 인증이 아닙니다. 브라우저에 상태를 저장할 뿐이라, 아이디·비밀번호가
// 코드에 그대로 보이고 누구나 열어볼 수 있습니다.
// 지금은 "유료 화면이 어떻게 보이는지" 확인하기 위한 검토용입니다.
//
// 인증을 붙일 때: 이 블록(TEST_ACCOUNTS · signInWithTestAccount)을 삭제하고
// 로그인 화면에서 실제 공급자 호출로 교체하세요.
// ═══════════════════════════════════════════════════════════════════

export interface TestAccount {
  id: string
  password: string
  label: string
  entitlement: Entitlement
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: "paid@soulseoul.xyz",
    password: "soulseoul",
    label: "크레딧 10장",
    entitlement: { isLoggedIn: true, credits: 10 },
  },
  {
    id: "trial@soulseoul.xyz",
    password: "soulseoul",
    label: "가입 크레딧이 남은 회원",
    entitlement: { isLoggedIn: true, credits: WELCOME_CREDITS },
  },
  {
    id: "free@soulseoul.xyz",
    password: "soulseoul",
    label: "크레딧을 다 쓴 회원",
    entitlement: { isLoggedIn: true, credits: 0 },
  },
]

/** 테스트 계정으로 로그인. 맞으면 true, 틀리면 false */
export function signInWithTestAccount(id: string, password: string): boolean {
  const found = TEST_ACCOUNTS.find(
    (a) => a.id.toLowerCase() === id.trim().toLowerCase() && a.password === password
  )
  if (!found) return false
  saveEntitlement(found.entitlement)
  return true
}

/**
 * 로그아웃.
 *
 * Supabase 세션(쿠키)과 브라우저에 남은 검토용 상태를 함께 지웁니다.
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

  // 연결 전 — 검토용 테스트 계정 경로
  const e = getEntitlement()
  if (e.credits <= 0) return false
  saveEntitlement({ ...e, credits: e.credits - 1 })
  return true
}
