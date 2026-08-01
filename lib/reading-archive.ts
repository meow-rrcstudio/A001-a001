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
  /**
   * 이 판에 허락된 이어묻기 횟수 (서버가 정합니다).
   *
   * 브라우저 보관함에는 없습니다 — 서버에서 온 기록에만 실려 옵니다.
   * 없으면 화면이 산 판(FOLLOWUPS_PER_CREDIT)으로 봅니다.
   */
  followupsAllowed?: number
  /** 해석을 받은 뒤 이어서 나눈 대화 */
  turns: ReadingTurn[]
  /**
   * 어떤 방식으로 본 타로점인지.
   *
   *   "ai"     샨티가 사이트 안에서 읽어준 것 (크레딧 한 장)
   *   "prompt" 무료 흐름 — 카드만 뽑고 프롬프트를 복사해 밖에서 본 것
   *
   * 없으면 "ai" 로 봅니다 (이 칸이 생기기 전에 저장된 기록).
   */
  kind?: "ai" | "prompt"
  /** kind 가 "prompt" 일 때, 복사해 간 프롬프트 원문 */
  promptText?: string
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

/**
 * 몇 건만 골라 지웁니다.
 *
 * 로그인할 때 브라우저 기록을 서버로 옮기고(lib/claim-readings.ts) 나면,
 * 옮겨진 것만 여기서 지웁니다.
 *
 * ⚠️ clearAll 로 통째로 비우지 않습니다. 서버가 일부만 받아들였을 때
 *    (한도에 걸렸거나 한 건이 깨졌거나) 나머지까지 함께 사라집니다.
 *    옮겨졌다고 확인된 것만 지우면, 남은 것은 다음 기회에 다시 시도합니다.
 */
export function removeReadings(ids: string[]) {
  if (ids.length === 0) return
  const gone = new Set(ids)
  writeAll(readAll().filter((r) => !gone.has(r.id)))
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
 * 무료 흐름(프롬프트 복사)으로 본 타로점을 보관합니다.
 *
 * 해석은 우리가 만들지 않았으니 result 에 담을 게 없습니다. 그래도 기록에
 * 남겨야 합니다 — 무엇을 언제 뽑았는지 남아 있어야 나중에 "이어서 이야기
 * 하기"를 권할 수 있고, 남지 않으면 무료로 본 사람은 돌아올 이유가 없습니다.
 *
 * ⚠️ 같은 판을 두 번 저장하지 않도록 부르는 쪽에서 한 번만 부릅니다
 *    (components/card-reading-flow.tsx 의 savedRef).
 */
export function savePromptReading(input: {
  question: string
  topicLabel: string
  cards: PickedCard[]
  layoutKey?: string
  positions?: string[]
  promptText: string
  /**
   * 맛보기 해석 (있으면).
   *
   * ⚠️ 이걸 안 남기면 새로고침 한 번에 방금 읽은 글이 사라집니다. 로그인
   *    전이라 서버에 남길 자리가 없어서, 브라우저의 이 줄이 유일한 기록
   *    입니다. 로그인하러 갔다 돌아온 사람이 읽던 글을 못 찾으면, 우리가
   *    권해놓고 우리가 뺏는 꼴입니다.
   */
  result?: Partial<ReadingResult>
}): string {
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const { promptText, result, ...rest } = input
  const record: SavedReading = {
    id,
    at: new Date().toISOString(),
    turns: [],
    kind: "prompt",
    promptText,
    // 해석을 받았으면 그대로 남기고, 카드만 뽑았으면 목록에 쓸 한 줄만 지어둡니다.
    result: (result?.title
      ? result
      : {
          title: rest.question || rest.topicLabel,
          summary: `카드 ${rest.cards.length}장을 뽑았어요. 프롬프트를 복사해 밖에서 읽어본 타로점입니다.`,
        }) as ReadingResult,
    ...rest,
  }
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
