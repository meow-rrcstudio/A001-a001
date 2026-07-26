// lib/recent-questions.ts
// 메뉴의 "최근 본 타로점" 목록.
//
// ⚠️ 로그인·저장 기능이 아직 없어서 브라우저(localStorage)에 임시로 둡니다.
//    연동할 때 getRecentQuestions() 를 서버 조회로 바꾸면 화면은 그대로 둡니다.
"use client"

const KEY = "soulseoul.recentQuestions.v1"
const MAX = 4

/** 최근 질문 목록 (최신순, 최대 4개) */
export function getRecentQuestions(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX) : []
  } catch {
    return []
  }
}

/** 질문을 하나 기록합니다. 같은 질문이 있으면 맨 앞으로 올립니다. */
export function rememberQuestion(question: string) {
  if (typeof window === "undefined") return
  const q = question.trim()
  if (!q) return
  try {
    const next = [q, ...getRecentQuestions().filter((v) => v !== q)].slice(0, MAX)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경 — 무시
  }
}
