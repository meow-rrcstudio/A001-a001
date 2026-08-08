// lib/content/profile.ts
// 이 사람의 성향을 한 곳에서 꺼냅니다.
//
// ┌─ 어디서 오는가 ───────────────────────────────────────────────────
// │ 샨티를 깨우는 화면(/onboarding)에서 고른 것입니다. 브라우저에 남아
// │ 있고(lib/onboarding-store.ts), 그것을 세 갈래로 옮긴 것이 여기서
// │ 나가는 값입니다(lib/onboarding.profileOf).
// │
// │ 아직 안 깨운 사람은 null 입니다. 그러면 고르는 자리들은 전부 그냥
// │ 랜덤으로 돕니다 — pickFor 가 겹치는 수 0 으로 저절로 그렇게 됩니다
// │ (lib/content/pick.ts). 갈래를 따로 만들 것이 없습니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useState } from "react"
import type { TraitProfile } from "@/lib/content/traits"
import { profileOf } from "@/lib/onboarding"
import { loadOnboarding } from "@/lib/onboarding-store"

/**
 * 지금 이 사람의 성향. 온보딩 전이거나 건너뛰었으면 null
 *
 * ⚠️ 처음 그릴 때는 반드시 null 입니다. 성향은 브라우저에만 있는데
 *    이 화면은 서버에서 한 번 그려져 오기 때문입니다 — 서버가 고른 질문과
 *    브라우저가 고른 질문이 다르면 하이드레이션이 어긋나 글자가 한 번
 *    튑니다. 붙은 뒤에 채웁니다.
 *
 *    그래서 부르는 쪽은 "처음엔 없다가 생기는 값"으로 다뤄야 합니다.
 *    이미 그렇게 되어 있습니다 — components/question-picker.tsx 가 같은
 *    까닭으로 목록을 붙은 뒤에 굴립니다.
 */
export function useTraitProfile(): TraitProfile | null {
  const [profile, setProfile] = useState<TraitProfile | null>(null)

  useEffect(() => {
    const stored = loadOnboarding()
    if (!stored.done) return
    setProfile(profileOf(stored.answers))
  }, [])

  return profile
}
