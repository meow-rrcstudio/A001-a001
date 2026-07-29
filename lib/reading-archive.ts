// lib/reading-archive.ts
// 본 타로점을 한 건씩 보관하는 곳입니다.
//
// 메뉴의 "최근 본 타로점"과 MY 의 기록은 모두 여기를 봅니다.
// 목록을 누르면 그때 나눈 대화 그대로 다시 열립니다 (/my/[id]).
//
// ⚠️ 로그인·서버 저장이 아직 없어서 브라우저(localStorage)에 둡니다.
//    연동할 때 아래 다섯 함수의 속만 서버 호출로 바꾸면 화면은 그대로 둡니다.
//      listRecent · listAll · getReading · saveReading · appendTurn
"use client"

import type { ReadingResult } from "@/lib/mock-reading"
import type { PickedCard } from "@/components/reading-result-view"

const KEY = "soulseoul.readings.v1"
const RECENT_MAX = 4

/** 이어서 나눈 대화 한 마디 */
export interface ReadingTurn {
  role: "user" | "shanti"
  text: string
  /** 이 답에 매긴 좋아요(1)·싫어요(-1) */
  rating?: number | null
  /** 면담 도중 더 뽑은 카드 — 다시 열었을 때도 그대로 보이도록 함께 담습니다 */
  cards?: PickedCard[]
}

/** 보관된 타로점 한 건 */
export interface SavedReading {
  id: string
  /** 내가 던진 질문 */
  question: string
  /** 주제 이름 (MY 기록에서 제목으로 씁니다) */
  topicLabel: string
  /** 언제 봤는지 (ISO 문자열 — JSON 으로 오갈 수 있도록) */
  at: string
  cards: PickedCard[]
  /** 샨티가 고른 배열 이름 — 다시 열었을 때도 그때 모양으로 놓이도록 */
  layoutKey?: string
  /** 그 배열의 자리 이름 — 다시 열어 이어 물을 때 함께 들려보냅니다 */
  positions?: string[]
  result: ReadingResult
  /** 해석에 매긴 좋아요(1)·싫어요(-1) */
  rating?: number | null
  /** 해석을 받은 뒤 이어서 나눈 대화 */
  turns: ReadingTurn[]
}

function readAll(): SavedReading[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedReading[]) : []
  } catch {
    return []
  }
}

function writeAll(list: SavedReading[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // 저장이 막힌 환경 — 무시합니다
  }
}

/**
 * 브라우저 보관함을 통째로 비웁니다 — 로그아웃할 때 부릅니다.
 *
 * ⚠️ 이걸 안 하면 로그아웃한 뒤에도 "최근 본 타로점"과 기록 화면에 앞
 *    사람이 본 타로점이 그대로 남습니다. 한 기기를 여럿이 쓰면 남의
 *    질문이 보이는 셈이라, 로그아웃은 반드시 여기까지 지워야 합니다.
 */
export function clearAll() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}

/** 최신순 전체 목록 */
export function listAll(): SavedReading[] {
  return readAll().sort((a, b) => b.at.localeCompare(a.at))
}

/** 메뉴에 띄울 최근 목록 (최신순, 기본 4건) */
export function listRecent(limit: number = RECENT_MAX): SavedReading[] {
  return listAll().slice(0, limit)
}

/** 한 건 열기. 없으면 null */
export function getReading(id: string): SavedReading | null {
  return readAll().find((r) => r.id === id) ?? null
}

/** 새 타로점을 보관하고 그 id 를 돌려줍니다 */
export function saveReading(input: {
  question: string
  topicLabel: string
  cards: PickedCard[]
  layoutKey?: string
  positions?: string[]
  result: ReadingResult
}): string {
  const id = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const record: SavedReading = { id, at: new Date().toISOString(), turns: [], ...input }
  writeAll([record, ...readAll()])
  return id
}

/**
 * 대화를 통째로 갈아끼웁니다.
 *
 * 새로고침으로 마지막 답을 물렀을 때 씁니다 — 붙이기만 하면 버린 답이
 * 기록에 남아, 다시 열었을 때 같은 물음에 답이 두 번 나옵니다.
 */
export function replaceTurns(id: string, turns: ReadingTurn[]) {
  const list = readAll()
  const found = list.find((r) => r.id === id)
  if (!found) return
  found.turns = turns
  writeAll(list)
}

/** 이어서 나눈 대화를 그 타로점에 붙입니다 (다시 열면 그대로 남아 있도록) */
export function appendTurn(id: string, turn: ReadingTurn) {
  const list = readAll()
  const found = list.find((r) => r.id === id)
  if (!found) return
  found.turns = [...found.turns, turn]
  writeAll(list)
}
