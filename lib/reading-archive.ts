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
  result: ReadingResult
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
  result: ReadingResult
}): string {
  const id = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const record: SavedReading = { id, at: new Date().toISOString(), turns: [], ...input }
  writeAll([record, ...readAll()])
  return id
}

/** 이어서 나눈 대화를 그 타로점에 붙입니다 (다시 열면 그대로 남아 있도록) */
export function appendTurn(id: string, turn: ReadingTurn) {
  const list = readAll()
  const found = list.find((r) => r.id === id)
  if (!found) return
  found.turns = [...found.turns, turn]
  writeAll(list)
}
