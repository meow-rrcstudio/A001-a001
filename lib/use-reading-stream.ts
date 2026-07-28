// lib/use-reading-stream.ts
// 해석을 흘려받아 도착하는 대로 화면에 채웁니다.
//
// 한 편을 다 만드는 데 20초쯤 걸리므로, 다 기다렸다 한 번에 보여주면
// 멈춘 것처럼 느껴집니다. 제목 → 요약 → 키워드 → 섹션 순으로 차오릅니다.
"use client"

import { useCallback, useState } from "react"
import { parsePartialJson } from "@/lib/ai/reading-schema"
import type { ReadingResult } from "@/lib/mock-reading"
import type { PickedCard } from "@/components/reading-result-view"

/** 아직 만들어지는 중이라 조각이 비어 있을 수 있습니다 */
export type PartialReading = Partial<ReadingResult>

export interface ReadingStreamState {
  reading: PartialReading | null
  /** 아직 받는 중인지 — 커서 깜빡임 등에 씁니다 */
  streaming: boolean
  error: string | null
}

export function useReadingStream() {
  const [state, setState] = useState<ReadingStreamState>({
    reading: null,
    streaming: false,
    error: null,
  })

  const run = useCallback(
    async ({
      topicKey,
      questionSlug,
      questionLabel,
      plan,
      cards,
      readingId,
    }: {
      topicKey: string
      questionSlug: string
      /** 자유 질문일 때 사용자가 친 문구 */
      questionLabel?: string
      /** 샨티가 고른 배열 (자유 질문일 때) */
      plan?: { layoutKey: string; positions: { label: string; guide: string }[] } | null
      cards: PickedCard[]
      /** 어느 판인지. 서버가 "크레딧을 낸 판인지" 확인합니다 */
      readingId?: string
    }): Promise<ReadingResult | null> => {
      setState({ reading: null, streaming: true, error: null })

      try {
        const response = await fetch("/api/reading", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topicKey,
            questionSlug,
            questionLabel,
            plan,
            readingId,
            // ⚠️ 그림 주소까지 함께 보냅니다. 서버가 받은 그대로 보관하기
            //    때문에, 여기서 빼면 기록을 다시 열었을 때 카드가 회색
            //    네모로만 나옵니다 (실제로 그렇게 됐었습니다).
            //    AI 프롬프트는 name·orientation 만 읽으므로 나머지는
            //    프롬프트에 섞이지 않습니다.
            cards: cards.map((c) => ({
              name: c.name,
              orientation: c.reversed ? "역방향" : "정방향",
              reversed: c.reversed,
              imageUrl: c.imageUrl,
            })),
          }),
        })

        if (!response.ok || !response.body) {
          const raw = await response.text().catch(() => "")
          // 서버는 {error:"..."} 로 사유를 담아 보냅니다. 통짜 JSON 을 그대로
          // 보여주면 읽히지 않으니 사유만 꺼냅니다.
          let message = raw
          try {
            message = (JSON.parse(raw) as { error?: string }).error ?? raw
          } catch {
            // JSON 이 아니면 원문 그대로
          }
          throw new Error(message || `해석을 불러오지 못했습니다 (${response.status})`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let latest: PartialReading | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.trim()) continue
            const message = JSON.parse(line) as { partial?: string; error?: string }
            if (message.error) throw new Error(message.error)
            if (!message.partial) continue

            // 아직 끝나지 않은 JSON 이라 읽히는 만큼만 읽습니다.
            const parsed = parsePartialJson<PartialReading>(message.partial)
            if (parsed) {
              latest = parsed
              setState({ reading: parsed, streaming: true, error: null })
            }
          }
        }

        // 아무것도 못 읽었으면 빈 화면으로 두지 않습니다 — 무엇이 잘못됐는지
        // 보여야 고칠 수 있습니다.
        if (!latest) {
          throw new Error("해석이 한 글자도 오지 않았습니다. 잠시 뒤 다시 시도해 주세요.")
        }

        setState({ reading: latest, streaming: false, error: null })
        // 조각이 다 찼을 때만 완성본으로 넘깁니다 (보관·기록용)
        return latest && latest.title && latest.summary && latest.sections?.length
          ? (latest as ReadingResult)
          : null
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setState({ reading: null, streaming: false, error: message })
        return null
      }
    },
    []
  )

  return { ...state, run }
}
