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
import {
  CHAT_DRAW_MAX,
  CHAT_SUGGESTION_MAX,
  type ChatDrawRequest,
  type ChatReply,
} from "@/lib/ai/reading-chat"
import type { ReadingResult } from "@/lib/mock-reading"
import type { PickedCard } from "@/components/reading-result-view"
import { describeChatError, type ChatErrorInfo } from "@/lib/chat-errors"

/**
 * 흐름이 막힌 사정을 담아 던지는 오류.
 *
 * 서버가 알려준 갈래(kind)를 그대로 들고 위로 올라갑니다 — 중간에서
 * 문자열로 납작하게 눌리면 화면이 다시 짐작해야 합니다.
 */
class ChatFailure extends Error {
  constructor(readonly info: ChatErrorInfo) {
    super(info.message)
    this.name = "ChatFailure"
  }
}

/** 면담 한 마디 */
export interface ChatTurn {
  role: "user" | "shanti"
  text: string
  /** 이 마디에서 새로 뽑힌 카드 (있으면 말 아래에 작게 깔립니다) */
  cards?: PickedCard[]
  /** 이미 매긴 평가 (1 좋아요 · -1 싫어요). 다시 열었을 때 켜둡니다 */
  rating?: number | null
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
  /**
   * 막혔을 때의 사정.
   *
   * ⚠️ 문자열이 아니라 갈래까지 담은 값입니다. 예전에는 서버가 준 문장을
   *    그대로 들고 화면에 찍었고, 그래서 제미나이의 영어 JSON 이 고스란히
   *    떴습니다. 말과 다음 걸음은 lib/chat-errors.ts 가 정합니다.
   */
  const [error, setError] = useState<ChatErrorInfo | null>(null)
  /** 묻는 이가 직접 뽑아야 할 때 채워집니다 */
  const [pendingDraw, setPendingDraw] = useState<ChatDrawRequest | null>(null)
  /**
   * 이어서 물을 만한 것 — 샨티의 답과 같은 요청에서 함께 옵니다.
   *
   * 따로 부르면 요청 한 번을 더 쓰는데, 하루 한도가 곧 요청 수입니다.
   * 같은 한 번에서 더 받아오는 쪽이 언제나 낫습니다.
   */
  const [suggestions, setSuggestions] = useState<string[]>([])

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
      // 앞 답에 딸려온 제안은 여기서 걷습니다 — 새 물음을 던지는 중에
      // 지난 제안이 남아 있으면 그걸 누를 수 있게 되고, 그러면 방금 던진
      // 물음과 순서가 뒤엉킵니다.
      setSuggestions([])

      try {
        let response: Response
        try {
          response = await fetch("/api/reading/chat", {
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
        } catch (networkError) {
          // fetch 자체가 실패하는 건 대개 연결이 끊긴 것입니다 (기내·지하철·터널).
          // 여기서 잡지 않으면 "TypeError: Failed to fetch" 가 화면에 뜹니다.
          console.warn("[chat] 요청이 나가지 못했습니다:", networkError)
          throw new ChatFailure(
            describeChatError({ offline: true })
          )
        }

        if (!response.ok || !response.body) {
          // 몸통이 JSON 이 아닐 수 있습니다 (Vercel 의 시간 초과는 HTML 을 줍니다).
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
          // 헤더에 적혀 오는 경우도 받아냅니다 (표준은 이쪽입니다)
          const header = Number(response.headers.get("retry-after"))
          if (!retryAfterSeconds && header > 0) retryAfterSeconds = header

          console.warn(`[chat] 서버가 거절했습니다 (${response.status})`, raw.slice(0, 300))
          throw new ChatFailure(
            describeChatError({ status: response.status, kind, retryAfterSeconds })
          )
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let latest: Partial<ChatReply> | null = null
        let drawnCards: PickedCard[] | null = null

        while (true) {
          // 이어졌던 연결이 도중에 끊길 수 있습니다 (와이파이가 바뀌는 순간 등).
          let chunk: ReadableStreamReadResult<Uint8Array>
          try {
            chunk = await reader.read()
          } catch (readError) {
            console.warn("[chat] 답을 받다 연결이 끊겼습니다:", readError)
            throw new ChatFailure(describeChatError({ offline: true }))
          }
          if (chunk.done) break
          buffer += decoder.decode(chunk.value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.trim()) continue
            // 한 줄이 깨져 있어도 대화를 통째로 잃지 않습니다.
            let payload: {
              partial?: string
              error?: string
              kind?: unknown
              retryAfterSeconds?: number
              drawnCards?: PickedCard[]
            }
            try {
              payload = JSON.parse(line)
            } catch {
              console.warn("[chat] 읽을 수 없는 줄을 건너뜁니다:", line.slice(0, 120))
              continue
            }
            if (payload.error || payload.kind) {
              throw new ChatFailure(
                describeChatError({
                  kind: payload.kind,
                  retryAfterSeconds: payload.retryAfterSeconds,
                  detail: payload.error,
                })
              )
            }
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
          // 연결은 됐는데 글자가 없는 경우 — 다시 물으면 대개 됩니다.
          throw new ChatFailure(describeChatError({ kind: "empty" }))
        }

        setStreamingText(null)
        pushTurn({ role: "shanti", text: replyText, cards: drawnCards ?? undefined })

        // 흐름이 중간에 끊기면 draw 가 반쪽으로 남을 수 있습니다.
        // 온전한 것만 씁니다 (반쪽짜리로 카드를 뽑게 하면 자리가 비어버립니다).
        const draw = depth >= 1 ? null : validDraw(latest?.draw)

        if (draw && drawnCards?.length) {
          // 샨티가 대신 뽑았습니다. 서버가 미리 뽑아 함께 들려보낸 예비 카드라
          // 방금 받은 답이 이미 그 카드를 읽고 있습니다.
          //
          // ⚠️ 예전에는 여기서 "이 카드를 읽어달라"고 한 번 더 물었습니다.
          //    한 물음에 제미나이 호출이 두 번 나갔고, 사람은 두 번 기다렸습니다.
          //    하루 한도가 요청 수라 이 한 번이 비쌌습니다
          //    (app/api/reading/chat/route.ts 의 예비 카드 주석 참고).
          //
          // 늘어난 카드는 다음 물음에도 실어보내야 샨티가 기억합니다.
          cardsRef.current = [
            ...cardsRef.current,
            ...toPromptCards(
              drawnCards,
              draw.positions.map((p) => p.label)
            ),
          ]
        } else if (draw?.mode === "user") {
          // 묻는 이가 직접 뽑을 차례입니다. 화면이 카드 고르기로 넘깁니다.
          setPendingDraw(draw)
        }

        // 이어서 물을 만한 것 — 같은 요청 안에서 함께 왔습니다 (공짜입니다).
        // 카드를 직접 뽑아야 하는 차례에는 내밀지 않습니다. 뽑으라고 해놓고
        // 다른 걸 누르라고 같이 권하면 무엇을 해야 하는지 흐려집니다.
        setSuggestions(
          draw?.mode === "user"
            ? []
            : (latest?.suggestions ?? [])
                .filter((s) => typeof s === "string" && s.trim())
                .slice(0, CHAT_SUGGESTION_MAX)
                .map((s) => s.trim())
        )
      } catch (e) {
        setStreamingText(null)
        // 갈래를 들고 온 것이면 그대로, 아니면 "알 수 없음"으로 담습니다.
        // ⚠️ 어떤 경우에도 날오류 문장을 화면으로 보내지 않습니다.
        if (e instanceof ChatFailure) {
          setError(e.info)
        } else {
          console.error("[chat] 예상 못한 실패:", e)
          setError(describeChatError({ kind: "unknown" }))
        }
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

  /**
   * 묻는 이가 스스로 "직접 뽑겠다"고 한 경우.
   *
   * ⚠️ 샨티가 draw 를 내줄 때까지 기다리면 안 됩니다. 모델이 "네가 뽑아보는
   *    것도 좋겠구나" 라고 말만 하고 draw 를 안 붙이는 일이 실제로
   *    있었습니다. 그러면 묻는 이는 뽑겠다고 했는데 뽑을 데가 없습니다.
   *    그래서 화면에서도 직접 시작할 수 있게 열어둡니다.
   */
  const requestOwnDraw = useCallback((count = 1) => {
    if (busy) return
    const n = Math.max(1, Math.min(count, CHAT_DRAW_MAX))
    setPendingDraw({
      mode: "user",
      // ⚠️ intro 는 카드 고르기 화면의 말풍선 문구입니다. 비우면 그 자리에
      //    아무 말도 없는 빈 말풍선이 뜹니다 (샨티가 청해서 뽑는 경우에는
      //    샨티가 직접 써 보냅니다).
      intro: "그래, 네가 직접 뽑아보라냥. 마음을 담아 섞고 끌리는 카드를 골라보게.",
      positions: Array.from({ length: n }, (_, i) => ({
        label: n === 1 ? "지금 마음에 걸리는 것" : `${i + 1}번째로 궁금한 것`,
        guide: "끌리는 카드를 골라보라냥",
      })),
    })
  }, [busy])

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

  return {
    turns,
    streamingText,
    busy,
    error,
    pendingDraw,
    suggestions,
    send,
    retryLast,
    submitDrawnCards,
    requestOwnDraw,
  }
}
