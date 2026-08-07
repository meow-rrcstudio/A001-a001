// components/card-reading-flow.tsx
// 카드 섞기 → 고르기 → 결과 공개까지의 리딩 플로우입니다.
//
// 섞기 단계는 화면 가득 흩어진 카드 더미(셔플 시안), 고르기 화면은 아래와 같습니다:
// ┌───────────────────────────────┐
// │  샨티 말풍선                  │ ← 헤더 바로 아래
// │  스프레드 슬롯 (번호 표시)    │ ← 반응형. 최대 300px, 위아래 여백 20px
// │  부채꼴 카드 78장             │ ← 크기 고정. 아랫부분은 화면 밖으로 나갑니다
// │  굴리는 손잡이                │ ← 화면 하단 고정
// └───────────────────────────────┘
// 보드만 화면 크기에 맞춰 줄어들기 때문에 스크롤은 생기지 않습니다.
"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { motion, type PanInfo } from "framer-motion"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardBack } from "@/components/card-back"
import { getReadingDeck, getScatteredLayout } from "@/lib/reading-session"
import type { ReadingQuestion } from "@/lib/reading-prompt-templates"
import { spreadLayouts } from "@/lib/spread-layouts"
import type { DrawTracker } from "@/lib/draw-signals"

type Phase = "shuffling" | "selecting" | "revealing"

const FAN_COUNT = 78 // 덱 크기와 동일 (섞기 더미의 z순서 계산용)

// ── 섞기 화면의 카드 크기 ────────────────────────────────────────────
// 화면 폭에 비례해 커지되 상한을 둡니다. 세 값을 함께 조절하세요.
const SHUFFLE_CARD_WIDTH_START = "23vw" //  흩어져 들어올 때
const SHUFFLE_CARD_WIDTH = "25vw" //        더미에 모였을 때
const SHUFFLE_CARD_MAX_WIDTH = 101 //       큰 화면에서의 상한 (px)
const SHUFFLE_TARGET_DISTANCE = 2400
const SHUFFLE_STEPS = 4 // 최대 4번 섞으면 자동으로 다음 화면으로
const MIN_STEPS_FOR_QUICK_DRAW = 1 // 1번만 섞어도 "고르러 가기" 가능

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
function getPileLayout(step: number, index: number) {
  const seed = (step + 1) * 911 + index * 137.5
  return {
    top: `${4 + ((seed * 1.7) % 80)}%`,
    left: `${4 + ((seed * 2.3) % 76)}%`,
    rotate: ((seed * 4.7) % 140) - 70,
    z: Math.floor(seed) % FAN_COUNT,
  }
}

// 시드 기반 셔플 — 같은 시드면 같은 순서 (섞을 때마다 시드가 바뀌어 카드가 아치 위에서 재배열됨)
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

export function CardReadingFlow({
  question,
  introMessage,
  excludeNames,
  skipShuffle = false,
  signals,
  onComplete,
}: {
  question: ReadingQuestion
  introMessage: string
  /**
   * 부채에서 빼놓을 카드 이름(nameKo).
   *
   * 면담 중에 다시 뽑을 때 씁니다 — 이미 이 판에서 나온 카드가 부채에
   * 그대로 섞여 있으면 같은 카드를 또 뽑을 수 있고, 그러면 "아까 그
   * 카드가 또?" 하고 읽는 이가 걸립니다. 사용자가 말한 "남은 카드들 중"
   * 이 바로 이 뜻입니다.
   */
  excludeNames?: string[]
  /**
   * 섞기를 건너뛰고 펼쳐진 부채부터 시작할지.
   *
   * 면담 중에 카드를 더 뽑을 때 씁니다. 이 판은 처음에 이미 섞어서 펼친
   * 부채입니다 — 한 장 더 뽑겠다고 그걸 도로 걷어 다시 섞게 하면, 앞에
   * 뽑은 카드와 다른 판에서 온 카드처럼 느껴집니다. 펼쳐둔 그대로
   * 이어서 뽑는 것이 같은 판입니다.
   *
   * ⚠️ 부채의 순서는 일부러 다시 흔들지 않습니다(seed 가 그대로입니다).
   *    "섞지 않는다"는 말 그대로여야 하니까요. 이미 나온 카드만
   *    excludeNames 로 빠집니다.
   */
  skipShuffle?: boolean
  /**
   * 이 판을 어떻게 뽑았는지 재는 자 (lib/draw-signals.ts).
   *
   * ⚠️ 면담 중에 카드를 더 뽑는 화면에는 넘기지 않습니다. 그건 같은 판을
   *    이어가는 것이라, "이 판을 어떻게 시작했는가"와 섞이면 안 됩니다.
   *    안 넘기면 아무것도 재지 않습니다.
   */
  signals?: DrawTracker
  /** 카드를 다 뒤집었을 때. 뽑은 카드 이름과 정/역방향을 넘깁니다. */
  onComplete?: (picked: { name: string; reversed: boolean; imageUrl: string }[]) => void
}) {
  const requiredPicks = question.positions.length
  const resultSlots = spreadLayouts[question.layoutKey]

  const [phase, setPhase] = useState<Phase>(skipShuffle ? "selecting" : "shuffling")
  const [shuffleStep, setShuffleStep] = useState(0)
  // ⚠️ finishShuffling 은 setTimeout 으로 늦게 불려서 위 상태가 낡아 있습니다.
  //    (steps 3 인데 endedEarly false 처럼 앞뒤가 안 맞는 값이 나왔습니다)
  const shuffleStepRef = useRef(0)
  const [entered, setEntered] = useState(false)
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null)
  // 말풍선이 지금까지 차지한 가장 큰 높이. 글이 짧아져도 자리를 도로
  // 내주지 않아서, 말이 바뀔 때마다 무대가 들썩이는 일이 없습니다.
  const [bubbleReservedHeight, setBubbleReservedHeight] = useState(96)
  // 모바일에서 손가락을 대고 있는(빼꼼 중인) 카드
  const [peekedIndex, setPeekedIndex] = useState<number | null>(null)
  // 하단 슬라이더 — 부채를 호를 따라 좌우로 "굴립니다". 카드를 고르는 게 아니라
  // 78장 중 어느 구간이 화면에 보이는지를 옮기는 손잡이입니다. (0 ~ 1)
  const [fanRoll, setFanRoll] = useState(0.5)
  // 무대의 실제 픽셀 폭 — 부채 반지름과 보드 중앙 정렬 계산에 사용
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(360)
  // 무대가 flex 로 받아간 실제 높이 — 보드와 부채를 여기에 맞춰 나눕니다
  const [stageBoxHeight, setStageBoxHeight] = useState(560)

  const traveledRef = useRef(0)
  const lastMouseX = useRef<number | null>(null)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTouchDevice = useIsTouchDevice()

  // 이 화면에 들어온 시각을 재둡니다 — "화면을 보며 망설인 시간"의 기준입니다.
  // ⚠️ 예전에는 첫 터치부터 쟀습니다. 그러면 정작 망설인 시간이 통째로 빠집니다.
  useEffect(() => {
    // ⚠️ isTouchDevice(상태)를 쓰지 않습니다. 그 값은 첫 그림 뒤에야
    //    자리잡아서, 여기서 읽으면 언제나 초기값(touch)이 나옵니다 —
    //    실제로 마우스로 뽑아도 "touch" 로 남았습니다.
    const coarse =
      typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
    signals?.drawStarted(coarse ? "touch" : "mouse")
    // 화면이 뜨는 것은 판마다 한 번뿐이라 그 신호만 봅니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selected, setSelected] = useState<number[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])

  // 이 판에서 이미 나온 카드는 부채에서 빼둡니다.
  // ⚠️ 다 빼면 뽑을 카드가 없어지니, 남는 게 뽑을 장수보다 적으면
  //    빼지 않고 한 벌을 그대로 씁니다 (뽑을 수 없는 화면이 더 나쁩니다).
  const excludeKey = (excludeNames ?? []).join("|")
  const shuffledDeck = useMemo(() => {
    const deck = getReadingDeck()
    const used = new Set(excludeKey ? excludeKey.split("|") : [])
    if (used.size === 0) return deck
    const left = deck.filter((c) => !used.has(c.nameKo))
    return left.length >= requiredPicks ? left : deck
    // excludeKey 는 배열을 문자열로 굳힌 값입니다 — 배열을 그대로 두면
    // 리렌더마다 새 배열이라 덱이 매번 다시 섞입니다.
  }, [excludeKey, requiredPicks])

  // 정방향 · 역방향 (다섯 장에 한 장쯤 역방향).
  //
  // ⚠️ Math.random() 을 쓰면 안 됩니다. 이 계산은 화면을 그리는 도중에
  //    돌아가는데, useMemo 는 리액트가 지켜주겠다는 약속이 아니라 힌트일
  //    뿐이라 언제든 버리고 다시 계산할 수 있습니다. 다시 계산되면 난수가
  //    새로 뽑혀 카드의 방향이 바뀝니다.
  //
  //    타로에서 역방향은 뜻이 뒤집히는 값입니다. 이 배열은 두 곳에서 읽는데
  //    — 사람이 보는 카드와, 샨티에게 넘기는 값 — 도중에 바뀌면 본 것과
  //    해석이 어긋납니다. 그래서 덱에서 씨앗을 뽑아 늘 같은 결과가 나오게
  //    합니다 (부채 순서가 이미 같은 방식입니다 — seededOrder).
  const cardOrientations = useMemo(() => {
    const total = shuffledDeck.length
    const targetReverseCount = Math.round(total * 0.2)
    // 덱이 다르면 씨앗도 달라야 합니다. 카드 이름의 글자값을 자리와 함께
    // 섞어 한 숫자로 만듭니다 — 같은 덱이면 언제나 같은 숫자가 나옵니다.
    const seed = shuffledDeck.reduce(
      (acc, card, i) =>
        acc + [...card.nameKo].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) * (i + 1),
      7
    )
    const order = seededOrder(total, seed)
    const orientations = Array(total).fill("정방향")
    for (let i = 0; i < targetReverseCount; i++) orientations[order[i]] = "역방향"
    return orientations as ("정방향" | "역방향")[]
  }, [shuffledDeck])

  // 아치 위 카드 순서 — 섞을 때마다(shuffleStep 변경) 재배열되어 섞이는 느낌을 줍니다.
  const fanOrder = useMemo(
    () => seededOrder(shuffledDeck.length, shuffleStep + 1),
    [shuffledDeck.length, shuffleStep]
  )

  const shuffleMessages = useMemo(() => [introMessage, ...genericShuffleMessages], [introMessage])

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!onComplete) return
    if (flippedIndices.length < requiredPicks) return
    const timer = setTimeout(() => {
      onComplete(
        selected.map((cardIndex) => ({
          name: shuffledDeck[cardIndex]?.nameKo ?? "",
          reversed: cardOrientations[cardIndex] === "역방향",
          imageUrl: shuffledDeck[cardIndex]?.imageUrl ?? "",
        }))
      )
    }, 1400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIndices.length, requiredPicks])

  useEffect(() => {
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      setStageWidth(el.clientWidth)
      setStageBoxHeight(el.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase])

  function finishShuffling(endedEarly = false) {
    signals?.shuffleDone({ steps: shuffleStepRef.current, endedEarly })
    setPhase("selecting")
  }

  function bumpProgress(delta: number) {
    signals?.shuffleInput(delta)
    traveledRef.current += delta
    const next = Math.min(100, Math.round((traveledRef.current / SHUFFLE_TARGET_DISTANCE) * 100))
    const step = Math.min(SHUFFLE_STEPS, Math.ceil((next / 100) * SHUFFLE_STEPS))
    shuffleStepRef.current = step
    setShuffleStep(step)
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
      // 끝까지 안 채우고 넘긴 것 — 다 채워 저절로 넘어간 것과 구분합니다
      finishShuffling(shuffleStepRef.current < SHUFFLE_STEPS)
      return
    }
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    const message = shufflePersuasionMessages[Math.floor(Math.random() * shufflePersuasionMessages.length)]
    setNudgeMessage(message)
    nudgeTimerRef.current = setTimeout(() => setNudgeMessage(null), 2800)
  }

  function handlePick(index: number) {
    if (selected.includes(index) || selected.length >= requiredPicks) return
    signals?.picked(index)
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

  const CARD_RATIO = 1.678
  const FAN_CARD_HEIGHT_MAX = 240
  const FAN_CARD_HEIGHT_MIN = 168
  const BOARD_GAP = 20
  const BOARD_HEIGHT_MAX = 300
  const BOARD_HEIGHT_MIN = 140
  const FAN_VISIBLE_MIN = 150
  const BOARD_WIDTH = 356
  const BOARD_HEIGHT_REVEAL = 348

  const SLIDER_H = 76

  const stageHeight = phase === "revealing" ? BOARD_HEIGHT_REVEAL + 40 : stageBoxHeight

  const FAN_CARD_HEIGHT = Math.round(
    Math.max(FAN_CARD_HEIGHT_MIN, Math.min(FAN_CARD_HEIGHT_MAX, stageHeight * 0.42))
  )
  const FAN_CARD_WIDTH = Math.round(FAN_CARD_HEIGHT / CARD_RATIO)

  const boardHeightSelect = Math.max(
    BOARD_HEIGHT_MIN,
    Math.min(BOARD_HEIGHT_MAX, stageHeight - SLIDER_H - BOARD_GAP * 2 - FAN_VISIBLE_MIN)
  )

  const boardHeightNow = phase === "revealing" ? BOARD_HEIGHT_REVEAL : boardHeightSelect
  const slotWidth =
    phase === "revealing" ? 64 : Math.round(Math.max(52, Math.min(64, (64 * boardHeightSelect) / 240)))

  const fanRadius = Math.max(220, Math.min(stageWidth * 0.85, 340))
  const FAN_BLEED = 60
  
  // ── 요구사항 반영: 카드를 기존보다 10px 더 올림 (40 -> 50) ──
  const FAN_LIFT = 50 

  const fanApexY =
    Math.max(
      boardHeightSelect + BOARD_GAP * 2 + FAN_CARD_HEIGHT / 2,
      stageHeight + FAN_BLEED - FAN_CARD_HEIGHT / 2
    ) - FAN_LIFT
  const fanCenterY = fanApexY + fanRadius
  const fanCardTop = fanApexY - FAN_CARD_HEIGHT / 2
  const boardTopSelect = Math.max(
    BOARD_GAP,
    Math.round((fanCardTop - BOARD_GAP - boardHeightSelect) / 2)
  )

  const ANGLE_STEP = 3.4
  const VISIBLE_HALF = 90

  const FAN_Z = 10
  const PICKED_Z = 300

  function getFanStyle(cardIndex: number) {
    const index = fanOrder.indexOf(cardIndex)
    const total = shuffledDeck.length
    const centerIndex = fanRoll * Math.max(0, total - 1)
    const angle = (index - centerIndex) * ANGLE_STEP
    const rad = (angle * Math.PI) / 180
    const x = stageWidth / 2 + Math.sin(rad) * fanRadius
    const y = fanCenterY - Math.cos(rad) * fanRadius
    return {
      left: `${x}px`,
      top: `${y}px`,
      rotate: angle,
      zIndex: FAN_Z + index,
      hidden: Math.abs(angle) > VISIBLE_HALF,
    }
  }

  function getLeftoverStackStyle(orderAmongLeftovers: number) {
    return {
      left: "44px",
      top: `${34 + orderAmongLeftovers * 0.8}px`,
      rotate: (orderAmongLeftovers % 2 === 0 ? 1 : -1) * 1.5,
      zIndex: orderAmongLeftovers,
    }
  }

  function mapSlot(slot: { left: string; top: string }) {
    const boardTop = phase === "revealing" ? 20 : boardTopSelect
    const left = stageWidth / 2 + ((parseFloat(slot.left) - 50) / 100) * BOARD_WIDTH
    const top = boardTop + (parseFloat(slot.top) / 100) * boardHeightNow
    return { left: `${left}px`, top: `${top}px` }
  }

  const isShuffling = phase === "shuffling"
  let leftoverCounter = 0

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${
        phase === "revealing" ? "overflow-y-auto" : ""
      }`}
      style={{ paddingBottom: phase === "revealing" ? 88 : 0 }}
    >
      <div className="shrink-0" style={{ minHeight: bubbleReservedHeight }}>
        <ReadingCharacterBubble
          placement="top"
          message={
            isShuffling
              ? (nudgeMessage ?? shuffleMessages[Math.min(shuffleStep, shuffleMessages.length - 1)])
              : phase === "selecting"
                ? (question.positions[selected.length]?.guide ?? "끌리는 카드를 골라보라냥")
                : flippedIndices.length >= requiredPicks
                  ? "흠! 카드는 다 뽑혔구먼. 이 몸이 고심해서 들여다보는 중이니 잠깐만 기다려보라냥..."
                  : "카드를 하나씩 뒤집어보는 중이야냥..."
          }
          onHeightChange={(h) => setBubbleReservedHeight((prev) => (h > prev ? h : prev))}
        />

      </div>

      {isShuffling && (
        <div className="flex min-h-0 flex-1 flex-col">
          <motion.div
            onPan={handlePan}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              lastMouseX.current = null
            }}
            onClick={handleShuffleClick}
            className="relative mx-auto min-h-0 w-full max-w-md flex-1 cursor-pointer touch-none"
          >
            {shuffledDeck.map((card, i) => {
              const startLayout = getScatteredLayout(i)
              const pileTarget = getPileLayout(shuffleStep, i)
              return (
                <motion.div
                  key={card.slug}
                  className="absolute aspect-[1144/1919]"
                  initial={{
                    top: startLayout.top,
                    left: startLayout.left,
                    rotate: startLayout.rotate,
                    width: SHUFFLE_CARD_WIDTH_START,
                    x: "-50%",
                    zIndex: 0,
                  }}
                  animate={{
                    top: entered ? pileTarget.top : startLayout.top,
                    left: entered ? pileTarget.left : startLayout.left,
                    rotate: entered ? pileTarget.rotate : startLayout.rotate,
                    width: SHUFFLE_CARD_WIDTH,
                    x: "-50%",
                    zIndex: entered ? pileTarget.z : 0,
                  }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  style={{ maxWidth: SHUFFLE_CARD_MAX_WIDTH }}
                >
                  <CardBack flipped={!entered} faceImageUrl={card.imageUrl} faceAlt={card.nameKo} />
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {!isShuffling && (
        <div
          ref={stageRef}
          className={`relative isolate -mx-6 overflow-hidden sm:-mx-8 ${
            phase === "revealing" ? "transition-[height] duration-500" : "min-h-0 flex-1"
          }`}
          style={phase === "revealing" ? { height: stageHeight } : undefined}
        >
          {resultSlots.map((slot, i) => {
            const filled = selected.length > i
            return (
              <div
                key={i}
                className={`absolute flex aspect-[1144/1919] items-center justify-center rounded-[8%] border ${
                  !filled && i === selected.length
                    ? "border-foreground/25 bg-muted"
                    : "border-border bg-muted/60"
                }`}
                style={{
                  ...mapSlot(slot),
                  width: slotWidth,
                  transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
                }}
              >
                {!filled && (
                  <span className="font-serif text-lg text-muted-foreground/60">{i + 1}</span>
                )}
              </div>
            )
          })}

          {shuffledDeck.map((card, index) => {
            const pickedOrder = selected.indexOf(index)
            const isPicked = pickedOrder !== -1
            const isLeftover = phase === "revealing" && !isPicked
            const leftoverOrder = isLeftover ? leftoverCounter++ : -1

            let target: {
              left: string
              top: string
              rotate: number
              zIndex: number
              width: number
              opacity?: number
            }
            if (isPicked) {
              const s = resultSlots[pickedOrder]
              const pos = mapSlot(s)
              target = {
                left: pos.left,
                top: pos.top,
                rotate: s.rotate,
                zIndex: PICKED_Z + pickedOrder,
                width: slotWidth + 2,
              }
            } else if (isLeftover) {
              const s = getLeftoverStackStyle(leftoverOrder)
              target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 40 }
            } else {
              const s = getFanStyle(index)
              target = {
                left: s.left,
                top: s.top,
                rotate: s.rotate,
                zIndex: s.zIndex,
                width: FAN_CARD_WIDTH,
                opacity: s.hidden ? 0 : 1,
              }
            }

            const isOnFan = !isPicked && !isLeftover
            const canClick = !isPicked && phase === "selecting"
            const isPeeked = peekedIndex === index

            return (
              <motion.div
                key={card.slug}
                data-fan-card={canClick ? index : undefined}
                className="absolute aspect-[1144/1919]"
                initial={false}
                animate={{
                  top: target.top,
                  left: target.left,
                  rotate: target.rotate,
                  width: target.width,
                  opacity: target.opacity ?? 1,
                  x: "-50%",
                  y: "-50%",
                  zIndex: target.zIndex,
                }}
                transition={isOnFan ? { duration: 0 } : { duration: 0.6, ease: "easeInOut" }}
                style={{ pointerEvents: target.opacity === 0 ? "none" : undefined }}
              >
                <motion.div
                  onClick={!isTouchDevice && canClick ? () => handlePick(index) : undefined}
                  onTouchStart={
                    isTouchDevice && canClick
                      ? () => {
                          signals?.peeked(index)
                          setPeekedIndex(index)
                        }
                      : undefined
                  }
                  onTouchMove={
                    isTouchDevice && canClick
                      ? (e) => {
                          const touch = e.touches[0]
                          const el = document.elementFromPoint(touch.clientX, touch.clientY)
                          const cardEl = el?.closest("[data-fan-card]") as HTMLElement | null
                          if (cardEl) {
                            signals?.peeked(Number(cardEl.dataset.fanCard))
                            setPeekedIndex(Number(cardEl.dataset.fanCard))
                          } else {
                            setPeekedIndex(null)
                          }
                        }
                      : undefined
                  }
                  onTouchEnd={
                    isTouchDevice && canClick
                      ? () => {
                          if (peekedIndex !== null) handlePick(peekedIndex)
                          setPeekedIndex(null)
                        }
                      : undefined
                  }
                  onTouchCancel={isTouchDevice ? () => setPeekedIndex(null) : undefined}
                  whileHover={!isTouchDevice && canClick ? { y: -16 } : undefined}
                  animate={isTouchDevice && canClick ? { y: isPeeked ? -16 : 0 } : undefined}
                  transition={{ duration: 0.15 }}
                  className={`h-full w-full ${canClick ? "cursor-pointer touch-none" : ""}`}
                >
                  <CardBack
                    highlighted={!isPicked && phase === "selecting" && isPeeked}
                    selected={isPicked}
                    flipped={isPicked && flippedIndices.includes(index)}
                    reversed={cardOrientations[index] === "역방향"}
                    faceImageUrl={card.imageUrl}
                    faceAlt={card.nameKo}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── 굴리는 손잡이 ────────────────────────────────────────────────
          ┌─ 시안 실측 (2026-08) ─────────────────────────────────────────
          │ 바      높이 70 · 흰 바탕 **96%** · 윗변에 1px 선
          │ 선      1px, 좌우 20 씩 띄움
          │ 동그라미 23 · #000 · drop-shadow(0 4px 8px rgba(0,0,0,0.20))
          └───────────────────────────────────────────────────────────────

          ⚠️ 동그라미는 23 입니다. 시안 SVG 가 r=11.5 라 지름 23 이고,
             filter 의 dy=4 · stdDeviation=4 가 곧 0 4px 8px 입니다.
             20 으로 두었더니 카드 부채에 비해 작아 손잡이로 안 읽혔습니다.

          ⚠️ 그림자는 box-shadow 가 아니라 **drop-shadow** 입니다.
             range 의 손잡이는 만들어진 모양이라 box-shadow 를 주면
             네모 그림자가 딸려 나옵니다. drop-shadow 는 실제 그려진
             동그라미 모양을 따라갑니다.

          ⚠️ 웹킷과 파이어폭스가 손잡이를 부르는 이름이 다릅니다. 한쪽만
             적으면 다른 쪽에서 기본 손잡이(회색 네모)가 그대로 나옵니다. */}
      {phase === "selecting" && (
        // ⚠️ 바탕이 96% 입니다. 100% 로 두면 카드 부채가 바 윗변에서 뚝
        //    끊겨 화면이 거기서 끝난 것처럼 보입니다. 4% 만 비쳐도 "부채가
        //    이 아래로 이어진다"가 읽힙니다 — 흐림(backdrop-blur)이 함께
        //    걸려 있어서 비쳐도 글자를 방해하지 않습니다.
        <div
          className="fixed inset-x-0 bottom-0 z-[70] flex h-[70px] items-center border-t border-border px-5 backdrop-blur-[var(--glass-blur)]"
          style={{ background: "rgba(255, 255, 255, 0.96)" }}
        >
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={fanRoll}
            onChange={(e) => {
              const next = Number(e.target.value)
              signals?.fanMoved(next)
              setFanRoll(next)
            }}
            aria-label="카드 굴리기"
            className="mx-auto block h-px w-full max-w-site cursor-pointer appearance-none rounded-full bg-foreground/20
              [&::-webkit-slider-thumb]:h-[23px] [&::-webkit-slider-thumb]:w-[23px] [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black
              [&::-webkit-slider-thumb]:[filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.20))]
              [&::-moz-range-thumb]:h-[23px] [&::-moz-range-thumb]:w-[23px] [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-black
              [&::-moz-range-thumb]:[filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.20))]"
          />
        </div>
      )}

      {isShuffling && shuffleStep >= 1 && (
        // ⚠️ 화면 오른쪽 끝(right-6)에 붙이지 않습니다. 이 사이트는 넓은
        //    화면에서 내용이 max-w-site 로 가운데 모이는데, 단추만 화면
        //    끝에 붙어 있으면 레이아웃 밖으로 혼자 빠져나갑니다.
        //    헤더의 더보기(⋯)와 **같은 통·같은 오른쪽 여백**을 써서 세로로
        //    맞춥니다 (components/page-header.tsx 의 max-w-site + pr-4).
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] mx-auto flex w-full max-w-site justify-end pr-4">
          <button
            type="button"
            onClick={handleGoToPick}
            className="pointer-events-auto rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            고르러 가기
          </button>
        </div>
      )}
    </div>
  )
}