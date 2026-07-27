// lib/use-reading-chat.ts
// 해석을 받은 뒤 이어지는 면담을 맡습니다.
//
// 예전에는 lib/mock-reading.ts 의 고정 문구가 돌아왔습니다. 무엇을 물어도
// 같은 말이라 뽑은 카드와 아무 상관이 없었습니다. 이제 /api/reading/chat 이
// 앞선 해석과 오간 말을 모두 들고 답합니다.
//
// 카드를 더 봐야 하면 두 갈래로 갈립니다.
//   · 샨티가 대신 뽑음 — 서버가 뽑아 보내주고, 곧바로 그 카드를 읽어줍니다
//   · 묻는 이가 직접 뽑음 — pendingDraw 가 채워지고, 화면이 카드 고르기로
//     넘겼다가 submitDrawnCards 로 돌아옵니다
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { parsePartialJson } from "@/lib/ai/reading-schema"
import { CHAT_DRAW_MAX, type ChatDrawRequest, type ChatReply } from "@/lib/ai/reading-chat"
import type { ReadingResult } from "@/lib/mock-reading"
import type { PickedCard } from "@/components/reading-result-view"

/** 면담 한 마디 */
export interface ChatTurn {
  role: "user" | "shanti"
  text: string
  /** 이 마디에서 새로 뽑힌 카드 (있으면 말 아래에 작게 깔립니다) */
  cards?: PickedCard[]
}

/** 서버에 보내는 카드 한 장 */
type CardForPrompt = { name: string; orientation: "정방향" | "역방향"; position?: string }

/** 온전히 다 온 뽑기 요청만 통과시킵니다. 아니면 없는 셈 칩니다. */
function validDraw(draw: ChatDrawRequest | null | undefined): ChatDrawRequest | null {
  if (!draw || (draw.mode !== "shanti" && draw.mode !== "user")) return null
  if (!Array.isArray(draw.positions) || draw.positions.length === 0) return null
  if (draw.positions.length > CHAT_DRAW_MAX) return null
  if (!draw.positions.every((p) => p?.label && p?.guide)) return null
  if (!draw.intro) return null
  return draw
}

function toPromptCards(cards: PickedCard[], positions?: string[]): CardForPrompt[] {
  return cards.map((c, i) => ({
    name: c.name,
    orientation: c.reversed ? "역방향" : "정방향",
    position: positions?.[i],
  }))
}

export function useReadingChat({
  question,
  cards,
  positions,
  reading,
  priorTurns = [],
  readingId,
  onTurn,
  onTurnsReplace,
}: {
  question: string
  /** 처음에 뽑은 카드 */
  cards: PickedCard[]
  /** 그 카드들의 자리 이름 (샨티가 고른 배열). 없으면 자리 없이 넘깁니다 */
  positions?: string[]
  /** 앞서 해준 해석 */
  reading?: Partial<ReadingResult>
  /**
   * 기록에서 다시 열었을 때 그때 나눈 대화.
   * 화면에 그대로 이어 그리고, 샨티에게도 함께 들려보냅니다 —
   * 이게 없으면 다시 연 대화에서 샨티가 앞 얘기를 하나도 기억 못 합니다.
   */
  priorTurns?: ChatTurn[]
  /** 어느 판에 이어 묻는지. 서버가 주인과 횟수를 확인합니다 */
  readingId?: string
  /** 한 마디가 오갈 때마다 (보관용) */
  onTurn?: (turn: ChatTurn) => void
  /** 새로고침으로 마지막 답을 걷어냈을 때 — 보관본도 그만큼 되돌립니다 */
  onTurnsReplace?: (turns: ChatTurn[]) => void
}) {
  const [turns, setTurns] = useState<ChatTurn[]>(priorTurns)
  /** 지금 흘러들어오는 중인 샨티의 말 */
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 묻는 이가 직접 뽑아야 할 때 채워집니다 */
  const [pendingDraw, setPendingDraw] = useState<ChatDrawRequest | null>(null)

  // 면담 도중 카드가 늘어납니다. 다음 물음에는 늘어난 채로 들려보내야
  // 샨티가 "아까 더 뽑은 그 카드"를 기억합니다.
  const cardsRef = useRef<CardForPrompt[]>(toPromptCards(cards, positions))
  // turns 는 요청 직전 값이 필요한데 setState 는 비동기라 ref 로도 들고 있습니다.
  const turnsRef = useRef<ChatTurn[]>(priorTurns)
  // 이번에 새로 오간 마디 수 — 기록에서 연 예전 대화와 구분합니다.
  const priorCountRef = useRef(priorTurns.length)

  // 카드·예전 대화는 화면이 뜬 뒤에 채워질 수 있습니다 (기록에서 다시 열 때).
  // 아직 한 마디도 새로 안 오갔으면 늦게 온 값으로 갈아끼웁니다.
  useEffect(() => {
    // 이번 화면에서 이미 말이 오갔으면 건드리지 않습니다
    if (turnsRef.current.length > priorCountRef.current) return
    cardsRef.current = toPromptCards(cards, positions)
    // 달라진 게 없으면 여기서 멈춥니다 — setTurns 를 매번 부르면
    // 부모가 넘기는 빈 배열이 매 렌더 새 값이라 무한히 다시 그립니다.
    if (priorTurns.length === priorCountRef.current) return
    turnsRef.current = priorTurns
    priorCountRef.current = priorTurns.length
    setTurns(priorTurns)
  }, [cards, positions, priorTurns])

  const pushTurn = useCallback(
    (turn: ChatTurn) => {
      turnsRef.current = [...turnsRef.current, turn]
      setTurns(turnsRef.current)
      onTurn?.(turn)
    },
    [onTurn]
  )

  /**
   * 한 번 물어보고 답을 흘려받습니다.
   * 샨티가 대신 뽑겠다고 하면, 뽑은 카드를 들고 한 번 더 이어서 물어봅니다.
   */
  const ask = useCallback(
    // depth — 샨티가 뽑고 이어서 읽는 한 번만 허용합니다. 없으면 "더 뽑자 →
    // 또 더 뽑자"로 끝없이 이어질 수 있습니다.
    async (message: string, depth = 0): Promise<void> => {
      setBusy(true)
      setError(null)
      setStreamingText("")

      try {
        const response = await fetch("/api/reading/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            cards: cardsRef.current,
            reading: reading?.title ? reading : undefined,
            turns: turnsRef.current.map((t) => ({ role: t.role, text: t.text })),
            message,
            readingId,
          }),
        })

        if (!response.ok || !response.body) {
          const raw = await response.text().catch(() => "")
          let detail = raw
          try {
            detail = (JSON.parse(raw) as { error?: string }).error ?? raw
          } catch {
            // JSON 이 아니면 원문 그대로
          }
          throw new Error(detail || `답을 불러오지 못했습니다 (${response.status})`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let latest: Partial<ChatReply> | null = null
        let drawnCards: PickedCard[] | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.trim()) continue
            const payload = JSON.parse(line) as {
              partial?: string
              error?: string
              drawnCards?: PickedCard[]
            }
            if (payload.error) throw new Error(payload.error)
            if (payload.drawnCards) drawnCards = payload.drawnCards
            if (!payload.partial) continue

            const parsed = parsePartialJson<Partial<ChatReply>>(payload.partial)
            if (parsed) {
              latest = parsed
              if (parsed.reply) setStreamingText(parsed.reply)
            }
          }
        }

        const replyText = latest?.reply?.trim()
        if (!replyText) {
          throw new Error("답이 한 글자도 오지 않았습니다. 잠시 뒤 다시 물어봐 주세요.")
        }

        setStreamingText(null)
        pushTurn({ role: "shanti", text: replyText, cards: drawnCards ?? undefined })

        // 흐름이 중간에 끊기면 draw 가 반쪽으로 남을 수 있습니다.
        // 온전한 것만 씁니다 (반쪽짜리로 카드를 뽑게 하면 자리가 비어버립니다).
        const draw = depth >= 1 ? null : validDraw(latest?.draw)
        if (draw && drawnCards?.length) {
          // 샨티가 직접 뽑았습니다 — 뽑은 카드를 사정에 더하고 바로 읽어줍니다.
          cardsRef.current = [
            ...cardsRef.current,
            ...toPromptCards(
              drawnCards,
              draw.positions.map((p) => p.label)
            ),
          ]
          await ask(
            `방금 이 몸이 뽑은 카드다: ${drawnCards
              .map((c, i) => `${draw.positions[i]?.label ?? `추가${i + 1}`}=${c.name}(${c.reversed ? "역방향" : "정방향"})`)
              .join(", ")}. 이 카드로 앞선 물음에 이어서 읽어달라.`,
            depth + 1
          )
          return
        }

        if (draw?.mode === "user") {
          // 묻는 이가 직접 뽑을 차례입니다. 화면이 카드 고르기로 넘깁니다.
          setPendingDraw(draw)
        }
      } catch (e) {
        setStreamingText(null)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [question, reading, pushTurn, readingId]
  )

  /** 사용자가 새 물음을 던집니다 */
  const send = useCallback(
    async (message: string) => {
      const text = message.trim()
      if (!text || busy) return
      pushTurn({ role: "user", text })
      await ask(text)
    },
    [ask, busy, pushTurn]
  )

  /**
   * 마지막 답이 마음에 안 들 때 다시 받습니다 (새로고침).
   *
   * 마지막 샨티 마디를 걷어내고 그 앞의 물음을 다시 던집니다. 걷어내지
   * 않으면 "아까 한 말을 되풀이하지 말라"는 규칙 때문에 답이 점점
   * 엉뚱해집니다.
   */
  const retryLast = useCallback(async () => {
    if (busy) return
    const lastUser = [...turnsRef.current].reverse().find((t) => t.role === "user")
    if (!lastUser) return

    // 마지막 물음 뒤에 붙은 답들만 걷어냅니다 (물음 자체는 남깁니다).
    const cut = turnsRef.current.lastIndexOf(lastUser)
    turnsRef.current = turnsRef.current.slice(0, cut + 1)
    setTurns(turnsRef.current)
    // 보관본도 같이 되돌립니다. 안 그러면 버린 답이 기록에 남아,
    // 다시 열었을 때 답이 두 번 나옵니다.
    onTurnsReplace?.(turnsRef.current)
    await ask(lastUser.text)
  }, [ask, busy, onTurnsReplace])

  /** 묻는 이가 직접 뽑고 돌아왔습니다 */
  const submitDrawnCards = useCallback(
    async (picked: PickedCard[]) => {
      const draw = pendingDraw
      setPendingDraw(null)
      if (!draw || picked.length === 0) return

      const labels = draw.positions.map((p) => p.label)
      cardsRef.current = [...cardsRef.current, ...toPromptCards(picked, labels)]
      pushTurn({
        role: "user",
        text: `카드를 뽑았어: ${picked.map((c) => `${c.name}${c.reversed ? "(역)" : ""}`).join(" · ")}`,
        cards: picked,
      })
      await ask(
        `내가 직접 뽑은 카드다: ${picked
          .map((c, i) => `${labels[i] ?? `추가${i + 1}`}=${c.name}(${c.reversed ? "역방향" : "정방향"})`)
          .join(", ")}. 이 카드로 앞선 물음에 이어서 읽어달라.`,
        1
      )
    },
    [ask, pendingDraw, pushTurn]
  )

  return { turns, streamingText, busy, error, pendingDraw, send, retryLast, submitDrawnCards }
}
