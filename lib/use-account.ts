// lib/use-account.ts
// "지금 누가 로그인해 있고 크레딧이 몇 장인가"를 화면에 알려줍니다.
//
// 답의 출처가 두 곳입니다.
//   · Supabase 가 연결돼 있으면 → /api/account (서버가 진짜 주인)
//   · 아직 연결 전이면          → 브라우저(localStorage). 검토용 테스트 계정
//
// 연결이 끝나고 테스트 계정을 지우면 아랫길은 통째로 사라집니다.
// 그때까지는 미리보기 검토가 멈추지 않도록 두 길을 다 둡니다.
"use client"

import { useCallback, useEffect, useState } from "react"
import type { AuthProvider } from "@/app/api/account/route"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { claimLocalReadings, resetClaim } from "@/lib/claim-readings"
import {
  DEFAULT_ENTITLEMENT,
  getEntitlement,
  type Entitlement,
} from "@/lib/reading-entitlement"

export interface Account extends Entitlement {
  email: string | null
  displayName: string | null
  /** 가입·로그인에 쓴 수단 (프로필 화면이 보여줍니다) */
  provider: AuthProvider
}

const LOGGED_OUT: Account = {
  ...DEFAULT_ENTITLEMENT,
  email: null,
  displayName: null,
  provider: "unknown",
}

export function useAccount() {
  const [account, setAccount] = useState<Account>(LOGGED_OUT)
  // 확인이 끝나기 전에는 화면을 그리지 않습니다. 로그아웃 상태로 잠깐
  // 그렸다가 바뀌면 화면이 튑니다.
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const e = getEntitlement()
      setAccount({ ...e, email: null, displayName: null, provider: "unknown" })
      setReady(true)
      return
    }

    try {
      const response = await fetch("/api/account", { cache: "no-store" })
      if (!response.ok) throw new Error(String(response.status))
      const next = (await response.json()) as Account
      setAccount(next)

      // 로그인한 것을 확인한 자리입니다. 로그인 전에 브라우저에만 있던
      // 타로점을 이 사람 앞으로 옮깁니다 — 안 옮기면 기록 화면(서버만
      // 봅니다)에서 방금 본 판이 통째로 사라집니다.
      //
      // ⚠️ 화면을 막지 않습니다. 옮기기가 느리거나 실패해도 로그인 자체는
      //    끝난 일이고, 못 옮긴 것은 브라우저에 남아 다음에 다시 갑니다.
      if (next.isLoggedIn) void claimLocalReadings()
      else resetClaim()
    } catch {
      // 잠깐 끊긴 것일 수 있습니다. 로그아웃으로 취급하되 화면은 계속 돕니다.
      setAccount(LOGGED_OUT)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { account, ready, refresh }
}
