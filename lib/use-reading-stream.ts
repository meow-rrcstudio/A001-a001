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
import { describeChatError, type ChatErrorInfo } from "@/lib/chat-errors"

/**
 * 막힌 사정을 갈래째로 들고 올라가는 오류.
 *
 * ⚠️ 중간에서 문자열로 눌러버리면 화면이 다시 짐작해야 합니다. 그렇게
 *    해서 제미나이의 영어 JSON 이 해석 화면에 그대로 떴습니다.
 */
class ReadingFailure extends Error {
  constructor(readonly info: ChatErrorInfo) {
    super(info.message)
    this.name = "ReadingFailure"
  }
}

/** 아직 만들어지는 중이라 조각이 비어 있을 수 있습니다 */
export type PartialReading = Partial<ReadingResult>

export interface ReadingStreamState {
  reading: PartialReading | null
  /** 아직 받는 중인지 — 커서 깜빡임 등에 씁니다 */
  streaming: boolean
  /**
   * 막혔을 때의 사정 — 말과 다음 걸음까지 담깁니다.
   * 문장은 lib/chat-errors.ts 한 곳에서 옵니다 (대화 쪽과 같은 파일).
   */
  error: ChatErrorInfo | null
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
          // 몸통이 JSON 이 아닐 수도 있습니다 (시간 초과는 HTML 이 옵니다).
          const raw = await response.text().catch(() => "")
          let kind: unknown
          let retryAfterSeconds: number | undefined
          try {
            const parsed = JSON.parse(raw) as { kind?: unknown; retryAfterSeconds?: number }
            kind = parsed.kind
            retryAfterSeconds = parsed.retryAfterSeconds
          } catch {
            // JSON 이 아니면 상태 코드로만 판단합니다
          }
          const header = Number(response.headers.get("retry-after"))
          if (!retryAfterSeconds && header > 0) retryAfterSeconds = header

          console.warn(`[reading] 서버가 거절했습니다 (${response.status})`, raw.slice(0, 300))
          throw new ReadingFailure(
            describeChatError({ status: response.status, kind, retryAfterSeconds })
          )
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
            let message: {
              partial?: string
              error?: string
              kind?: unknown
              retryAfterSeconds?: number
            }
            try {
              message = JSON.parse(line)
            } catch {
              console.warn("[reading] 읽을 수 없는 줄을 건너뜁니다:", line.slice(0, 120))
              continue
            }
            if (message.error || message.kind) {
              throw new ReadingFailure(
                describeChatError({
                  kind: message.kind,
                  retryAfterSeconds: message.retryAfterSeconds,
                  detail: message.error,
                })
              )
            }
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
          throw new ReadingFailure(describeChatError({ kind: "empty" }))
        }

        setState({ reading: latest, streaming: false, error: null })
        // 조각이 다 찼을 때만 완성본으로 넘깁니다 (보관·기록용)
        return latest && latest.title && latest.summary && latest.sections?.length
          ? (latest as ReadingResult)
          : null
      } catch (error) {
        // 갈래를 들고 온 것이면 그대로. 아니면 대개 연결이 끊긴 것입니다
        // (fetch 자체가 실패하면 TypeError 가 옵니다).
        if (error instanceof ReadingFailure) {
          setState({ reading: null, streaming: false, error: error.info })
        } else {
          console.error("[reading] 예상 못한 실패:", error)
          setState({
            reading: null,
            streaming: false,
            error: describeChatError({ offline: typeof navigator !== "undefined" && !navigator.onLine }),
          })
        }
        return null
      }
    },
    []
  )

  return { ...state, run }
}
