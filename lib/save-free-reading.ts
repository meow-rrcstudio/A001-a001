// lib/save-free-reading.ts
// 무료 흐름(프롬프트 복사)으로 본 타로점을 한 번만 보관합니다.
//
// 남기는 곳이 두 군데입니다 — 부르는 쪽은 신경 쓰지 않아도 되게 여기서 갈립니다.
//   로그인했으면 → 서버 (/api/readings/prompt). 폰을 바꿔도 남습니다
//   로그인 전이면 → 브라우저. 그 기기에서만, 지우면 사라지는 한 번짜리 기록
//
// 로그인 전 기록을 남기는 이유: 방금 뽑은 카드가 화면을 벗어나면 흔적도
// 없이 사라집니다. 한 번짜리라도 남겨두면 "기록으로 남기려면 가입하세요"를
// 권할 수 있고, 권하는 말에 근거가 생깁니다.
"use client"

import { savePromptReading } from "@/lib/reading-archive"
import type { PickedCard } from "@/components/reading-result-view"

export interface FreeReadingInput {
  question: string
  topicLabel: string
  cards: PickedCard[]
  layoutKey?: string
  positions?: string[]
  promptText: string
  /**
   * 맛보기 해석 (샨티가 읽어준 글).
   *
   * ⚠️ 이걸 함께 보내야 기록에 글까지 남습니다. 안 보내면 카드와 프롬프트만
   *    남아서, 다시 열었을 때 방금 읽은 해석이 없습니다.
   */
  result?: { title?: string; summary?: string; sections?: { heading: string; body: string }[] }
}

export interface SavedFreeReading {
  id: string
  /** 서버에 남았으면 true — 기기를 바꿔도 남습니다 */
  onServer: boolean
}

export async function saveFreeReading(input: FreeReadingInput): Promise<SavedFreeReading | null> {
  // ⚠️ 로그인한 사람에게는 서버 저장이 필수입니다. MY 기록 화면은 로그인
  //    상태면 서버만 보고 브라우저 보관함을 아예 안 봅니다(로그아웃 뒤에도
  //    앞사람 기록이 보이던 것을 막느라 그렇게 해두었습니다).
  //    그래서 여기서 서버로 안 보내면, 맛보기로 본 판이 기록에서 통째로
  //    사라집니다 — 실제로 그렇게 됐었습니다.
  // 브라우저에는 언제나 남깁니다. 서버 저장이 실패해도 방금 본 것은
  // 볼 수 있어야 하고, 로그인 전이면 이것이 유일한 기록입니다.
  const localId = savePromptReading(input)

  try {
    const response = await fetch("/api/readings/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
    // 401(로그인 전)이면 서버에는 남지 않습니다 — 브라우저 기록으로 갑니다.
    if (response.ok) {
      const data = (await response.json()) as { id: string | null }
      if (data.id) return { id: data.id, onServer: true }
    }
  } catch {
    // 연결이 끊겼어도 브라우저 기록은 남았습니다
  }

  return { id: localId, onServer: false }
}
