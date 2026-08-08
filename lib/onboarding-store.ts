// lib/onboarding-store.ts
// 샨티를 깨우며 고른 것을 브라우저에 둡니다.
//
// ┌─ 왜 서버가 아니라 브라우저인가 ───────────────────────────────────
// │ 이 화면은 로그인보다 먼저 옵니다. 처음 들어온 사람에게 "먼저
// │ 로그인하세요"라고 하면 거기서 절반이 나갑니다.
// │
// │ 그래서 브라우저에 담아두고, 로그인하는 순간 서버로 옮깁니다.
// │ 타로점 기록이 이미 그렇게 움직입니다 (lib/claim-readings.ts) —
// │ 같은 자리(lib/use-account.ts)에서 같은 방식으로 옮깁니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ user_memories 는 브라우저가 직접 못 씁니다 (supabase/schema.sql 의
//    RLS — 넣는 것은 서비스 키만). 브라우저가 넣을 수 있으면 프롬프트에
//    아무 문장이나 심을 수 있기 때문입니다. 그래서 옮기기는 반드시
//    /api/onboarding/claim 을 거칩니다. 서버는 넘어온 **이름표**만 보고
//    문장은 lib/onboarding.ts 의 표에서 직접 꺼냅니다.
"use client"

import { EMPTY_ANSWERS, type OnboardingAnswers } from "@/lib/onboarding"

const KEY = "soulseoul.onboarding.v1"

/**
 * 브라우저에 남는 모양.
 *
 * step 까지 남기는 것은 "이어하기" 때문입니다. 세 물음 중 둘째에서
 * 나갔다 온 사람을 첫 화면부터 다시 시키면 그 사람은 두 번 나갑니다.
 */
interface Stored {
  answers: OnboardingAnswers
  /** 0 시작화면 · 1 끌림 · 2 두려움 · 3 카드 · 4 결과 */
  step: number
  /** 결과까지 본 적이 있는지. 홈에서 이 화면을 다시 권할지 판단합니다 */
  done: boolean
  /** 로그인한 계정으로 옮겼는지. 옮긴 뒤에는 다시 보내지 않습니다 */
  claimed: boolean
}

const EMPTY: Stored = { answers: EMPTY_ANSWERS, step: 0, done: false, claimed: false }

function read(): Stored {
  if (typeof window === "undefined") return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Stored>
    const answers = parsed.answers
    // 모양이 어긋난 것은 없는 셈 칩니다. 예전 판이 남아 있을 수 있고,
    // 그걸 그대로 믿으면 화면이 빈 배열에 .length 를 부르다 터집니다.
    if (!answers || !Array.isArray(answers.drawn) || !Array.isArray(answers.fears)) return EMPTY
    return {
      answers: {
        drawn: answers.drawn.filter((x): x is string => typeof x === "string"),
        fears: answers.fears.filter((x): x is string => typeof x === "string"),
        cardSlug: typeof answers.cardSlug === "string" ? answers.cardSlug : null,
      },
      step: typeof parsed.step === "number" ? parsed.step : 0,
      done: parsed.done === true,
      claimed: parsed.claimed === true,
    }
  } catch {
    return EMPTY
  }
}

function write(next: Stored) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 사파리 사생활 보호 모드처럼 저장이 막힌 곳이 있습니다. 저장이
    // 안 돼도 이번 판은 끝까지 굴러갑니다 — 이어하기만 안 될 뿐입니다.
  }
}

/** 하던 데까지 꺼냅니다 */
export function loadOnboarding(): Stored {
  return read()
}

/** 고르는 도중마다 남깁니다 */
export function saveOnboarding(answers: OnboardingAnswers, step: number) {
  const prev = read()
  write({ ...prev, answers, step })
}

/** 결과까지 봤습니다 */
export function finishOnboarding(answers: OnboardingAnswers) {
  const prev = read()
  write({ ...prev, answers, step: 4, done: true })
}

/** 이 브라우저에서 샨티를 이미 깨웠는지 */
export function hasAwakened(): boolean {
  return read().done
}

/**
 * 로그인한 계정으로 옮깁니다.
 *
 * 화면을 막지 않습니다. 옮기기가 실패해도 로그인 자체는 끝난 일이고,
 * 못 옮긴 것은 브라우저에 남아 다음 로그인 확인 때 다시 갑니다.
 */
export async function claimOnboarding(): Promise<void> {
  const stored = read()
  if (!stored.done || stored.claimed) return

  try {
    const response = await fetch("/api/onboarding/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(stored.answers),
    })
    if (!response.ok) return
    write({ ...stored, claimed: true })
  } catch {
    // 끊겼을 뿐입니다. claimed 를 안 찍었으니 다음에 다시 갑니다.
  }
}

/** 로그아웃했습니다 — 다음 로그인 때 다시 옮기도록 표시를 지웁니다 */
export function resetOnboardingClaim() {
  const stored = read()
  if (!stored.claimed) return
  write({ ...stored, claimed: false })
}
