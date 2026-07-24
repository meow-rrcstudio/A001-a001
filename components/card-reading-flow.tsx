// components/card-reading-flow.tsx
// 카드 섞기 → 고르기 → 결과 공개까지의 리딩 플로우입니다.
//
// 고르기 화면 구조 (시안 Screen - Blush Rose 기준):
// ┌───────────────────────────────┐
// │ (헤더는 위에 떠 있음 — 자리 X)│
// │  부채: 큰 원의 아래쪽 둘레    │ ← FAN_ZONE_H (264px 고정)
// │  ─ 위쪽은 그라데이션으로 가림 │
// ├───────────────────────────────┤
// │  컨트롤러(손잡이) — 좌우 롤링 │ ← CTRL_H
// ├───────────────────────────────┤
// │  스프레드 슬롯 (번호 표시)    │ ← 200~400px 반응형
// ├───────────────────────────────┤
// │  샨티 말풍선 (화면 하단 고정) │
// └───────────────────────────────┘
//
// ┌─ 부채 기하 (중요) ────────────────────────────────────────────────
// │ 카드 78장을 "화면 위쪽 멀리 있는 큰 원"의 둘레에 일정 간격으로
// │ 늘어놓고, 그 원의 맨 아래 부분만 화면에 보이게 합니다.
// │ 원이 아주 크기 때문에(반지름 ≈ 화면폭 1.6배) 완만한 곡선이 되고,
// │ 카드는 아래로 갈수록 살짝 벌어집니다. (넓은 U자가 아님)
// │ 좌우 롤링은 "원 전체를 원 중심 기준으로 회전"시키는 것이라
// │ 카드를 하나씩 다시 계산하지 않습니다 → 깜박임/버벅임 없음.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { motion, type PanInfo } from "framer-motion"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardBack } from "@/components/card-back"
import { getReadingDeck, getScatteredLayout } from "@/lib/reading-session"
import { buildReadingPrompt, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { spreadLayouts } from "@/lib/spread-layouts"

type Phase = "shuffling" | "selecting" | "revealing"

const SHUFFLE_TARGET_DISTANCE = 2400
const SHUFFLE_STEPS = 4 // 최대 4번 섞으면 자동으로 다음 화면으로
const MIN_STEPS_FOR_QUICK_DRAW = 1 // 1번만 섞어도 "고르러 가기" 가능

// ── 부채 ──────────────────────────────────────────────────────────
const CARD_RATIO = 1919 / 1144 //  카드 세로/가로 비율
const FAN_ZONE_H = 264 //          부채 영역 높이 (시안 주석의 264)
const FAN_CARD_W = 108 //          부채 카드 가로폭
const FAN_CARD_H = Math.round(FAN_CARD_W * CARD_RATIO)
const FAN_STEP_PX = 13 //          카드 사이 간격(원 둘레 위 호 길이). 화면폭 390 → 약 30장 보임
const FAN_RADIUS_RATIO = 1.62 //   원 반지름 ÷ 화면폭 (클수록 더 평평한 곡선)
const FAN_BOTTOM_GAP = 6 //        부채 맨 아래 카드와 영역 바닥 사이 여백
const FAN_PEEK_LIFT = 22 //        빼꼼할 때 카드가 뜨는 거리

// ── 컨트롤러 · 스프레드 ───────────────────────────────────────────
const CTRL_H = 72 //               컨트롤러 터치 영역 높이 (넉넉하게)
const CTRL_TRACK_MAX = 240 //      트랙 최대 가로폭 (시안 213)
const BOARD_MIN = 200 //           스프레드 최소 높이 (시안 주석)
const BOARD_MAX = 400 //           스프레드 최대 높이 (시안 주석)
const BOARD_WIDTH = 356 //         스프레드 보드 가로폭
const BOARD_HEIGHT_REVEAL = 384 // 결과(해석) 화면 보드 높이

const genericShuffleMessages = [
  "숨을 한 번 크게 고르고, 계속 섞어보라냥",
  "지금 떠오르는 마음이 있다면 그대로 흘려보내며 섞어보라냥",
  "손끝에 마음을 실어서, 조금 더 섞어보라냥",
]

const shufflePersuasionMessages = [
  "더 좋은 리딩을 보려면, 마음을 담아 조금 더 섞어야 한다냥.",
  "성급하구먼... 타로엔 뽑는 이의 기운이 담겨야 하는 법이야. 한 번만 더 섞어보라냥.",
  "이 몸이 삼천 번의 계절을 지켜봤는데, 서두른 패는 늘 흐릿하더군. 조금만 더 섞어보라냥.",
]

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(true)
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    setIsTouch(mql.matches)
    const listener = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])
  return isTouch
}

// 섞기 단계마다 카드가 흩어질 자리 (섞을 때마다 다르게 흩어짐)
function getPileLayout(step: number, index: number, deckSize: number) {
  const seed = (step + 1) * 911 + index * 137.5
  return {
    top: `${4 + ((seed * 1.7) % 80)}%`,
    left: `${4 + ((seed * 2.3) % 76)}%`,
    rotate: ((seed * 4.7) % 140) - 70,
    z: Math.floor(seed) % deckSize,
  }
}

// 시드 기반 셔플 — 같은 시드면 같은 순서 (섞을 때마다 시드가 바뀌어 카드가 부채 위에서 재배열됨)
function seededOrder(length: number, seed: number) {
  const indices = Array.from({ length }, (_, i) => i)
  let state = seed * 9301 + 49297
  const random = () => {
    state = (state * 233280 + 49297) % 233280233
    return (state % 10000) / 10000
  }
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

function deriveShuffleStyle({ durationMs, interactionCount }: { durationMs: number; interactionCount: number }) {
  if (durationMs < 2500) return "빠르고 힘 있게, 단숨에 섞음"
  if (interactionCount >= 14) return "여러 번 끊어가며 신중하게 섞음"
  return "천천히 차분하게 오래 섞음"
}

export function CardReadingFlow({
  topicLabel,
  topicSlug,
  question,
  introMessage,
}: {
  topicLabel: string
  topicSlug: ReadingTopicKey
  question: ReadingQuestion
  introMessage: string
}) {
  const requiredPicks = question.positions.length
  const resultSlots = spreadLayouts[question.layoutKey]

  const [phase, setPhase] = useState<Phase>("shuffling")
  const [shuffleStep, setShuffleStep] = useState(0)
  const [entered, setEntered] = useState(false)
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null)
  const [shuffleStyle, setShuffleStyle] = useState<string | null>(null)
  const [bubbleHeight, setBubbleHeight] = useState(160)
  // 모바일에서 손가락을 대고 있는(빼꼼 중인) 카드
  const [peekedIndex, setPeekedIndex] = useState<number | null>(null)
  // 부채 롤링 오프셋 — "원 둘레를 따라 몇 px 굴렸는지". 음수면 왼쪽으로 굴림.
  const [fanShiftPx, setFanShiftPx] = useState(0)
  // 무대의 실제 픽셀 폭 — 부채 반지름과 보드 중앙 정렬 계산에 사용
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(360)
  // 화면 높이 — 스프레드 보드가 남는 공간에 맞춰 늘고 줄기 위해 필요
  const [viewportHeight, setViewportHeight] = useState(800)

  const traveledRef = useRef(0)
  const lastMouseX = useRef<number | null>(null)
  const shuffleStartRef = useRef<number | null>(null)
  const interactionCountRef = useRef(0)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTouchDevice = useIsTouchDevice()

  const [selected, setSelected] = useState<number[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])

  const shuffledDeck = useMemo(() => getReadingDeck(), [])
  const deckSize = shuffledDeck.length

  const cardOrientations = useMemo(() => {
    const total = shuffledDeck.length
    // 전체의 20%를 역방향으로
    const targetReverseCount = Math.round(total * 0.2)
    const orientations = Array(total).fill("정방향")
    const indices = Array.from({ length: total }, (_, i) => i)
    for (let i = 0; i < targetReverseCount; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length)
      const targetIdx = indices.splice(randomIndex, 1)[0]
      orientations[targetIdx] = "역방향"
    }
    return orientations as ("정방향" | "역방향")[]
  }, [shuffledDeck])

  // 부채 위 카드 순서 — 섞을 때마다(shuffleStep 변경) 재배열되어 섞이는 느낌을 줍니다.
  const fanOrder = useMemo(() => seededOrder(deckSize, shuffleStep + 1), [deckSize, shuffleStep])
  // fanOrder.indexOf()를 카드마다 부르면 O(n²) → 자리표를 미리 만들어 둡니다.
  const fanSlotOf = useMemo(() => {
    const slots = new Array<number>(deckSize)
    fanOrder.forEach((cardIndex, slot) => {
      slots[cardIndex] = slot
    })
    return slots
  }, [fanOrder, deckSize])

  const shuffleMessages = useMemo(() => [introMessage, ...genericShuffleMessages], [introMessage])

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [])

  // 진입 시 화면을 맨 위로 고정.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)
  }, [])

  // 무대 폭을 측정 (화면 회전·창 크기 변경에도 대응)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    setStageWidth(el.clientWidth)
    const observer = new ResizeObserver(() => setStageWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase])

  // 화면 높이 측정
  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // ═══ 부채 기하 ═══
  // 원 중심은 화면 위쪽 바깥. 반지름이 화면폭의 1.6배쯤이라 곡선이 완만합니다.
  const fanRadius = Math.max(420, Math.min(820, stageWidth * FAN_RADIUS_RATIO))
  // 맨 아래(정중앙) 카드의 아래 끝이 부채 영역 바닥에 닿도록 원 중심 y를 정함
  const fanCenterX = stageWidth / 2
  const fanCenterY = FAN_ZONE_H - FAN_BOTTOM_GAP - FAN_CARD_H / 2 - fanRadius
  // 78장이 차지하는 둘레 길이와, 화면에 보이는 만큼을 뺀 롤링 가능 범위
  const bandTotalPx = (deckSize - 1) * FAN_STEP_PX
  const bandHalfPx = bandTotalPx / 2
  const maxShiftPx = Math.max(0, (bandTotalPx - stageWidth) / 2)
  const fanShiftDeg = ((fanShiftPx / fanRadius) * 180) / Math.PI

  // 카드 한 장의 "원 위 제자리"(롤링 전). 롤링은 래퍼 하나를 회전시켜 처리합니다.
  function fanSlotStyle(cardIndex: number) {
    const slot = fanSlotOf[cardIndex] ?? 0
    const omega = (slot * FAN_STEP_PX - bandHalfPx) / fanRadius // 라디안. 0 = 맨 아래 중앙
    return {
      x: fanCenterX + Math.sin(omega) * fanRadius,
      y: fanCenterY + Math.cos(omega) * fanRadius,
      rotate: (-omega * 180) / Math.PI, // 카드 아래끝이 원 바깥(아래)을 향하도록
      slot,
    }
  }

  // 롤링까지 반영한 "화면상 실제 위치" — 카드를 뽑아 스프레드로 날릴 때 출발점으로 씁니다.
  function fanWorldStyle(cardIndex: number) {
    const slot = fanSlotOf[cardIndex] ?? 0
    const omega = (slot * FAN_STEP_PX - bandHalfPx + fanShiftPx) / fanRadius
    return {
      left: `${fanCenterX + Math.sin(omega) * fanRadius}px`,
      top: `${fanCenterY + Math.cos(omega) * fanRadius}px`,
      rotate: (-omega * 180) / Math.PI,
    }
  }

  function clampShift(px: number) {
    return Math.max(-maxShiftPx, Math.min(maxShiftPx, px))
  }

  // ═══ 무대 높이 ═══
  // 헤더가 떠 있으므로(자리 차지 X) 남는 높이를 부채 + 컨트롤러 + 스프레드가 나눠 씁니다.
  // 시안 주석: 스프레드는 최소 200 · 최대 400, 말풍선을 침범하면 스크롤.
  const boardHeightSelect = Math.max(
    BOARD_MIN,
    Math.min(BOARD_MAX, viewportHeight - FAN_ZONE_H - CTRL_H - bubbleHeight - 16)
  )
  const boardTop = phase === "revealing" ? 84 : FAN_ZONE_H + CTRL_H
  const boardHeightNow = phase === "revealing" ? BOARD_HEIGHT_REVEAL : boardHeightSelect
  const stageHeight = boardTop + boardHeightNow + 8

  // 카드 크기는 스프레드 장수에 따라(적으면 크게, 많으면 작게)
  const spreadCount = question.positions.length
  const revealSlot = spreadCount <= 2 ? 92 : spreadCount <= 4 ? 78 : spreadCount <= 6 ? 66 : 54
  const slotWidth = phase === "revealing" ? revealSlot : Math.round(revealSlot * 0.84)

  function finishShuffling() {
    if (shuffleStartRef.current !== null) {
      const durationMs = Date.now() - shuffleStartRef.current
      setShuffleStyle(deriveShuffleStyle({ durationMs, interactionCount: interactionCountRef.current }))
    }
    setPhase("selecting")
  }

  function bumpProgress(delta: number) {
    if (shuffleStartRef.current === null) shuffleStartRef.current = Date.now()
    interactionCountRef.current += 1
    traveledRef.current += delta
    const next = Math.min(100, Math.round((traveledRef.current / SHUFFLE_TARGET_DISTANCE) * 100))
    setShuffleStep(Math.min(SHUFFLE_STEPS, Math.ceil((next / 100) * SHUFFLE_STEPS)))
    if (next >= 100) {
      setTimeout(finishShuffling, 500)
    }
  }

  function handlePan(_: unknown, info: PanInfo) {
    bumpProgress(Math.abs(info.delta.x) + Math.abs(info.delta.y))
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (lastMouseX.current !== null) {
      bumpProgress(Math.abs(e.clientX - lastMouseX.current))
    }
    lastMouseX.current = e.clientX
  }

  function handleShuffleClick() {
    if (isTouchDevice) return
    bumpProgress(SHUFFLE_TARGET_DISTANCE / SHUFFLE_STEPS)
  }

  function handleGoToPick() {
    if (shuffleStep >= MIN_STEPS_FOR_QUICK_DRAW) {
      finishShuffling()
      return
    }
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    const message = shufflePersuasionMessages[Math.floor(Math.random() * shufflePersuasionMessages.length)]
    setNudgeMessage(message)
    nudgeTimerRef.current = setTimeout(() => setNudgeMessage(null), 2800)
  }

  function handlePick(index: number) {
    if (selected.includes(index) || selected.length >= requiredPicks) return
    setPeekedIndex(null)
    const next = [...selected, index]
    setSelected(next)
    if (next.length >= requiredPicks) {
      setTimeout(() => {
        setPhase("revealing")
        next.forEach((_, i) => {
          setTimeout(() => {
            setFlippedIndices((prev) => [...prev, next[i]])
          }, i * 700)
        })
      }, 500)
    }
  }

  // ── 부채 = 프레스로 빼꼼(드르륵) → 떼면 선택 (시안 96:1151) ──
  // 좌우 롤링은 아래 컨트롤러가 담당하므로 여기선 제스처 구분이 필요 없습니다.
  const fanPressRef = useRef<{ active: boolean; cardIndex: number | null; pointerId: number }>({
    active: false,
    cardIndex: null,
    pointerId: -1,
  })

  function cardIndexAt(clientX: number, clientY: number): number | null {
    const el = document.elementFromPoint(clientX, clientY)
    const cardEl = el?.closest("[data-fan-card]") as HTMLElement | null
    return cardEl && cardEl.dataset.fanCard !== undefined ? Number(cardEl.dataset.fanCard) : null
  }

  function onFanPointerDown(e: React.PointerEvent) {
    if (phase !== "selecting") return
    const idx = cardIndexAt(e.clientX, e.clientY)
    fanPressRef.current = { active: true, cardIndex: idx, pointerId: e.pointerId }
    setPeekedIndex(idx)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  function onFanPointerMove(e: React.PointerEvent) {
    const g = fanPressRef.current
    if (!g.active || e.pointerId !== g.pointerId) return
    // 누른 채 손가락을 옮기면 그 아래 카드로 빼꼼이 옮겨감(드르륵)
    const idx = cardIndexAt(e.clientX, e.clientY)
    g.cardIndex = idx
    setPeekedIndex(idx)
  }

  function onFanPointerUp(e: React.PointerEvent) {
    const g = fanPressRef.current
    if (!g.active || e.pointerId !== g.pointerId) return
    if (g.cardIndex !== null) handlePick(g.cardIndex)
    setPeekedIndex(null)
    g.active = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  function onFanPointerCancel() {
    fanPressRef.current.active = false
    setPeekedIndex(null)
  }

  // ── 컨트롤러(손잡이) 드래그 = 부채 좌우 롤링 (시안 96:1152) ──
  // 트랙은 완만한 곡선, 손잡이는 지금 위치를 나타내며 드래그를 따라 움직입니다.
  const trackW = Math.min(CTRL_TRACK_MAX, Math.max(160, stageWidth * 0.6))
  const thumbW = Math.max(
    44,
    Math.round(trackW * (bandTotalPx > 0 ? Math.min(1, stageWidth / bandTotalPx) : 1))
  )
  const thumbTravel = Math.max(1, trackW - thumbW)
  // 손잡이가 오른쪽 = 부채의 오른쪽(뒷부분) 카드를 보는 중 → fanShiftPx는 음수
  const thumbProgress = maxShiftPx > 0 ? (maxShiftPx - fanShiftPx) / (2 * maxShiftPx) : 0.5
  // 트랙 곡선: (0,4) → (trackW,4), 제어점 (trackW/2, 28) 인 2차 베지에.
  //   x(t) = t·trackW,  y(t) = 4 + 24·t·(1-t)
  const thumbT = (thumbW / 2 + thumbProgress * thumbTravel) / trackW
  const thumbX = thumbT * trackW
  const thumbY = 4 + 24 * thumbT * (1 - thumbT)
  const thumbAngle = (Math.atan2(24 - 48 * thumbT, trackW) * 180) / Math.PI

  const controllerRef = useRef<{ active: boolean; lastX: number; pointerId: number }>({
    active: false,
    lastX: 0,
    pointerId: -1,
  })
  function onCtrlPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    controllerRef.current = { active: true, lastX: e.clientX, pointerId: e.pointerId }
    setPeekedIndex(null)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }
  function onCtrlPointerMove(e: React.PointerEvent) {
    const c = controllerRef.current
    if (!c.active || e.pointerId !== c.pointerId) return
    e.stopPropagation()
    // 손잡이를 오른쪽으로 끌면 부채가 왼쪽으로 굴러감(스크롤바와 같은 방향감)
    const dx = e.clientX - c.lastX
    const ratio = (2 * maxShiftPx) / thumbTravel
    setFanShiftPx((s) => clampShift(s - dx * ratio))
    c.lastX = e.clientX
  }
  function onCtrlPointerUp(e: React.PointerEvent) {
    e.stopPropagation()
    controllerRef.current.active = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // 결과 화면에서 안 뽑힌 카드들이 왼쪽 위에 작게 쌓이는 자리
  function getLeftoverStackStyle(orderAmongLeftovers: number) {
    return {
      left: "44px",
      top: `${boardTop + orderAmongLeftovers * 0.8}px`,
      rotate: (orderAmongLeftovers % 2 === 0 ? 1 : -1) * 1.5,
      zIndex: orderAmongLeftovers,
    }
  }

  // ── 스프레드 슬롯: 고정 보드의 정중앙 정렬 ──
  function mapSlot(slot: { left: string; top: string }) {
    const left = stageWidth / 2 + ((parseFloat(slot.left) - 50) / 100) * BOARD_WIDTH
    const top = boardTop + (parseFloat(slot.top) / 100) * boardHeightNow
    return { left: `${left}px`, top: `${top}px` }
  }

  function buildPrompt() {
    const cards = selected.map((cardIndex) => {
      const card = shuffledDeck[cardIndex]
      const orientation = cardOrientations[cardIndex]
      return { name: card.nameKo, orientation }
    })
    const basePrompt = buildReadingPrompt({ topicKey: topicSlug, question, cards })
    return shuffleStyle ? `${basePrompt}\nshuffle_style=${shuffleStyle}` : basePrompt
  }

  const isShuffling = phase === "shuffling"
  let leftoverCounter = 0

  return (
    <div className="flex flex-1 flex-col overflow-x-clip" style={{ paddingBottom: bubbleHeight + 12 }}>
      {/* ── 섞기 단계: 화면 가득 흩어진 카드 더미 ── */}
      {isShuffling && (
        <div className="flex flex-1 flex-col pt-20">
          <p className="mb-2 text-center text-base font-bold text-foreground">카드를 섞어주세요</p>
          <motion.div
            onPan={handlePan}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              lastMouseX.current = null
            }}
            onClick={handleShuffleClick}
            className="relative mx-auto h-[52dvh] min-h-80 w-full max-w-md cursor-pointer touch-none"
          >
            {shuffledDeck.map((card, i) => {
              const startLayout = getScatteredLayout(i)
              const pileTarget = getPileLayout(shuffleStep, i, deckSize)
              return (
                <motion.div
                  key={card.slug}
                  className="absolute aspect-[1144/1919]"
                  initial={{
                    top: startLayout.top,
                    left: startLayout.left,
                    rotate: startLayout.rotate,
                    width: "38vw",
                    x: "-50%",
                    zIndex: 0,
                  }}
                  animate={{
                    top: entered ? pileTarget.top : startLayout.top,
                    left: entered ? pileTarget.left : startLayout.left,
                    rotate: entered ? pileTarget.rotate : startLayout.rotate,
                    width: "42vw",
                    x: "-50%",
                    zIndex: entered ? pileTarget.z : 0,
                  }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  style={{ maxWidth: 168 }}
                >
                  <CardBack flipped={!entered} faceImageUrl={card.imageUrl} faceAlt={card.nameKo} />
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* ── 고르기/결과 무대 ── */}
      {!isShuffling && (
        <div
          ref={stageRef}
          className="relative mx-auto w-full max-w-3xl overflow-x-clip"
          style={{ height: stageHeight }}
        >
          {/* ── 부채 영역: 큰 원의 아래쪽 둘레 ── */}
          {phase === "selecting" && (
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: FAN_ZONE_H, touchAction: "none" }}
              onPointerDown={onFanPointerDown}
              onPointerMove={onFanPointerMove}
              onPointerUp={onFanPointerUp}
              onPointerCancel={onFanPointerCancel}
            >
              {/* 롤링 = 이 래퍼 하나를 원 중심 기준으로 회전.
                  카드 78장은 제자리에 그대로 있으므로 다시 그리지 않습니다
                  → 좌우로 굴려도 깜박임이 없습니다. */}
              <div
                className="absolute inset-0"
                style={{
                  transformOrigin: `${fanCenterX}px ${fanCenterY}px`,
                  transform: `rotate(${fanShiftDeg}deg)`,
                }}
              >
                {shuffledDeck.map((card, index) => {
                  if (selected.includes(index)) return null
                  const s = fanSlotStyle(index)
                  const isPeeked = peekedIndex === index
                  return (
                    <div
                      key={card.slug}
                      data-fan-card={index}
                      className="absolute"
                      style={{
                        left: s.x,
                        top: s.y,
                        width: FAN_CARD_W,
                        height: FAN_CARD_H,
                        transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
                        zIndex: isPeeked ? 999 : s.slot,
                      }}
                    >
                      {/* 빼꼼: 눌린 카드만 자기 축을 따라 위로 뜸 */}
                      <div
                        className="h-full w-full transition-transform duration-150 ease-out"
                        style={{ transform: `translateY(${isPeeked ? -FAN_PEEK_LIFT : 0}px)` }}
                      >
                        <CardBack faceImageUrl={card.imageUrl} faceAlt={card.nameKo} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 카드 위쪽 끝을 가리는 그라데이션 레이어 (시안 주석) */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1000] bg-gradient-to-b from-background via-background/85 to-transparent"
                style={{ height: 130 }}
              />
            </div>
          )}

          {/* ── 컨트롤러(손잡이): 좌우로 끌면 위 부채가 굴러감 ── */}
          {phase === "selecting" && (
            <div
              className="absolute inset-x-0 flex items-center justify-center"
              style={{ top: FAN_ZONE_H, height: CTRL_H, touchAction: "none" }}
              onPointerDown={onCtrlPointerDown}
              onPointerMove={onCtrlPointerMove}
              onPointerUp={onCtrlPointerUp}
              onPointerCancel={onCtrlPointerUp}
              role="slider"
              aria-label="카드 배열 좌우로 돌리기"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(thumbProgress * 100)}
            >
              <div className="relative cursor-grab active:cursor-grabbing" style={{ width: trackW, height: 32 }}>
                <svg
                  width={trackW}
                  height={32}
                  viewBox={`0 0 ${trackW} 32`}
                  className="pointer-events-none absolute inset-0"
                >
                  <path
                    d={`M0 4 Q${trackW / 2} 28 ${trackW} 4`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="11"
                    strokeLinecap="round"
                    className="text-foreground/10"
                  />
                </svg>
                {/* 지금 위치를 나타내는 손잡이 — 드래그를 따라 트랙 위를 미끄러집니다 */}
                <div
                  className="pointer-events-none absolute rounded-full bg-foreground/80 shadow"
                  style={{
                    width: thumbW,
                    height: 11,
                    left: thumbX,
                    top: thumbY,
                    transform: `translate(-50%, -50%) rotate(${thumbAngle}deg)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 스프레드 슬롯 — 어떤 배열로 나올지 항상 미리 보여줍니다 */}
          {resultSlots.map((slot, i) => {
            const filled = selected.length > i
            return (
              <div
                key={i}
                className="absolute flex aspect-[1144/1919] items-center justify-center rounded-[8%] border border-border bg-muted/60"
                style={{
                  ...mapSlot(slot),
                  width: slotWidth,
                  transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
                }}
              >
                {!filled && <span className="font-serif text-lg text-muted-foreground/60">{i + 1}</span>}
              </div>
            )
          })}

          {/* 뽑힌 카드 · (결과 화면) 안 뽑힌 카드 — 부채에서 스프레드로 날아갑니다 */}
          {shuffledDeck.map((card, index) => {
            const pickedOrder = selected.indexOf(index)
            const isPicked = pickedOrder !== -1
            const isLeftover = phase === "revealing" && !isPicked
            if (!isPicked && !isLeftover) return null
            const leftoverOrder = isLeftover ? leftoverCounter++ : -1

            let target: { left: string; top: string; rotate: number; zIndex: number; width: number }
            if (isPicked) {
              const s = resultSlots[pickedOrder]
              const pos = mapSlot(s)
              target = {
                left: pos.left,
                top: pos.top,
                rotate: s.rotate,
                zIndex: 300 + pickedOrder,
                width: slotWidth + 2,
              }
            } else {
              const s = getLeftoverStackStyle(leftoverOrder)
              target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 40 }
            }

            // 부채에 있던 자리에서 출발하도록 (뽑는 순간 순간이동하지 않게)
            const from = fanWorldStyle(index)

            return (
              <motion.div
                key={card.slug}
                className="pointer-events-none absolute aspect-[1144/1919]"
                initial={{ ...from, width: FAN_CARD_W, x: "-50%", y: "-50%" }}
                animate={{
                  top: target.top,
                  left: target.left,
                  rotate: target.rotate,
                  width: target.width,
                  x: "-50%",
                  y: "-50%",
                  zIndex: target.zIndex,
                }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                <CardBack
                  selected={isPicked}
                  flipped={isPicked && flippedIndices.includes(index)}
                  reversed={cardOrientations[index] === "역방향"}
                  faceImageUrl={card.imageUrl}
                  faceAlt={card.nameKo}
                />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 고르러 가기 — 1번만 섞어도 이동 가능 */}
      {isShuffling && shuffleStep >= 1 && (
        <button
          type="button"
          onClick={handleGoToPick}
          className="fixed right-6 z-[70] rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:right-8"
          style={{ bottom: bubbleHeight + 44 }}
        >
          고르러 가기
        </button>
      )}

      <ReadingCharacterBubble
        message={
          isShuffling
            ? (nudgeMessage ?? shuffleMessages[Math.min(shuffleStep, shuffleMessages.length - 1)])
            : phase === "selecting"
              ? (question.positions[selected.length]?.guide ?? "끌리는 카드를 골라보라냥")
              : flippedIndices.length >= requiredPicks
                ? `${topicLabel}에 대한 카드 ${requiredPicks}장을 골랐어냥. 아래 내용을 복사해서 좋아하는 AI에게 물어봐!`
                : "카드를 하나씩 뒤집어보는 중이야냥..."
        }
        promptText={phase === "revealing" && flippedIndices.length >= requiredPicks ? buildPrompt() : undefined}
        onHeightChange={setBubbleHeight}
      />
    </div>
  )
}
