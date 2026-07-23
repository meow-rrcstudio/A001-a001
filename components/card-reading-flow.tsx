// components/card-reading-flow.tsx
// 카드 섞기 → 고르기 → 결과 공개까지의 리딩 플로우입니다.
//
// 섞기 단계는 화면 가득 흩어진 카드 더미(셔플 시안), 고르기/결과 무대 구조는 아래와 같습니다:
// ┌───────────────────────────────┐
// │  부채꼴 카드 (좌우 대칭 아치) │ ← 무대 위쪽 ~35%
// │                               │
// │  스프레드 슬롯 (번호 표시)    │ ← 무대 아래쪽. 최소 160px~최대 280px
// ├───────────────────────────────┤
// │  샨티 말풍선 (화면 하단 고정) │
// └───────────────────────────────┘
// 화면이 아주 작으면 무대가 최소 높이를 지키고 페이지가 스크롤됩니다.
"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { motion, type PanInfo } from "framer-motion"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { CardBack } from "@/components/card-back"
import { getReadingDeck, getScatteredLayout } from "@/lib/reading-session"
import { buildReadingPrompt, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { spreadLayouts } from "@/lib/spread-layouts"

type Phase = "shuffling" | "selecting" | "revealing"

const FAN_COUNT = 48 // 덱 크기와 동일 (섞기 더미의 z순서 계산용)
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
  // 부채 좌우 롤링 오프셋(°) — 손가락으로 좌우로 쓸면 카드들이 원호를 따라 굴러감
  const [fanShift, setFanShift] = useState(0)
  // 지금 롤링(드래그) 중인지 — 롤링 중엔 카드 선택(빼꼼→픽)을 막음
  const isRollingRef = useRef(false)
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

  // 수정 전 (기존)
  /*
  const cardOrientations = useMemo(
  () => shuffledDeck.map(() => (Math.random() > 0.8 ? "정방향" : "역방향") as "정방향" | "역방향"),
  [shuffledDeck],
  )
  */

  // 수정 후 (권장)
  const cardOrientations = useMemo(() => {
  const total = shuffledDeck.length;
  // 전체의 20%를 역방향으로 설정 (최소 1장은 역방향이 나오게 하려면 Math.max(1, ...) 사용)
  const targetReverseCount = Math.round(total * 0.2);

  // 처음에는 모두 정방향으로 채움
  const orientations = Array(total).fill("정방향");

  // 역방향으로 바꿀 인덱스를 무작위로 뽑음
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = 0; i < targetReverseCount; i++) {
    const randomIndex = Math.floor(Math.random() * indices.length);
    const targetIdx = indices.splice(randomIndex, 1)[0];
    orientations[targetIdx] = "역방향";
  }

  return orientations as ("정방향" | "역방향")[];
}, [shuffledDeck]);

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
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [])

  // 진입 시 화면을 맨 위로 고정.
  // 무대 높이가 나중에 계산되며 바뀌는 동안 브라우저가 이전 스크롤 위치를
  // 복원하려다 중간 지점에서 시작되는 문제 방지.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)
  }, [])

  // 카드를 고르는 동안엔 페이지 자체를 고정(스크롤 잠금) → 부채를 드래그해도
  // 화면이 움직이지 않고 카드만 롤링됨. 해석(revealing) 단계에선 다시 스크롤 허용.
  useEffect(() => {
    if (phase !== "selecting") return
    const prevOverflow = document.body.style.overflow
    const prevOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "none"
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.overscrollBehavior = prevOverscroll
    }
  }, [phase])

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

  // "고르러 가기" — 1번이라도 섞었으면 즉시 다음 단계로, 아니면 마음을 담아 섞으라고 넛지
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

  // ═══ 무대 좌표 — 전부 픽셀(px) 기준 ═══
  // 예전엔 %(화면 비율) 기준이라 기기마다 부채/스프레드 모양이 달라졌습니다.
  // 이제 진짜 원호와 고정 크기 보드를 픽셀로 계산해 어느 기기에서든 같은 모양입니다.
  // ── 부채(롤링형) ──────────────────────────────────────────────────
  // 카드를 원호 위에 "한 장당 고정 각도(FAN_STEP)"로 놓고, 보이는 범위
  // (±FAN_VISIBLE_HALF)만 화면에 노출합니다. 나머지는 숨어 있다가 좌우로
  // 롤링(fanShift)하면 원호를 따라 굴러 들어옵니다. → 카드를 크게 보면서도
  // 48장 전체를 훑을 수 있음 (진짜 덱을 아치로 펼쳐 손으로 굴리는 느낌).
  // B(한 방향): 카드를 "왼쪽에서 오른쪽으로" 원호를 따라 한 방향으로 펼칩니다.
  // 가장 왼쪽 카드가 각도 0°(가장 낮고 세워짐)에서 시작해 오른쪽으로 갈수록
  // 각도가 커지며(오른쪽 위로 쓸려 올라가며) 기울어짐. 대칭 아님.
  // 좌우로 드래그하면 이 원호가 통째로 회전(LP판)해 48장 전체를 훑음.
  const FAN_STEP = 4.2 //          카드 한 장당 각도(°)
  const FAN_SPAN = 60 //           화면에 보이는 각도 범위(왼쪽 0° → 오른쪽 60°)
  const FAN_CARD_WIDTH = 78 //     부채 카드 폭
  const BOARD_WIDTH = 356 //       스프레드 보드 폭
  const BOARD_HEIGHT_REVEAL = 384 // 결과(해석) 화면 보드 높이

  const fanRadius = Math.min((stageWidth * 0.74) / Math.sin((FAN_SPAN * Math.PI) / 180), 300)
  const fanCardHalfHeight = (FAN_CARD_WIDTH * 1.678) / 2
  const fanLeftX = stageWidth * 0.13 // 가장 왼쪽 카드의 x 기준점
  const fanBottomY = Math.round(fanCardHalfHeight + 14) // 왼쪽(0°) 카드 중심 y(가장 낮음)
  const fanZoneHeight = Math.round(fanBottomY + fanCardHalfHeight + 6)
  // 롤링 한계: fanShift 0이면 처음(왼쪽) 카드들, 음수로 갈수록 뒤쪽 카드까지
  const minFanShift = FAN_SPAN - (shuffledDeck.length - 1) * FAN_STEP
  const maxFanShift = 0

  // ── 중단 스프레드 보드 ────────────────────────────────────────────
  // 고를 땐 자리 카드가 "뒷면"이라 모양만 보이면 됨 → 볼륨을 작게(콤팩트).
  // 해석 화면에서만 크게. (사용자 시안: 중단 볼륨 축소)
  const PAGE_CHROME = 116 // 상단 뒤로가기 줄 + 여백의 대략적인 높이
  const boardHeightSelect = Math.max(
    120,
    Math.min(208, viewportHeight - PAGE_CHROME - fanZoneHeight - bubbleHeight)
  )
  const stageHeight =
    phase === "revealing" ? BOARD_HEIGHT_REVEAL + 40 : fanZoneHeight + boardHeightSelect + 6

  const boardHeightNow = phase === "revealing" ? BOARD_HEIGHT_REVEAL : boardHeightSelect
  // 카드 크기는 스프레드 장수에 따라(적으면 크게, 많으면 작게) — 시안처럼.
  // 고를 땐 뒷면이라 살짝 작게, 해석 땐 크게.
  const spreadCount = question.positions.length
  const revealSlot = spreadCount <= 2 ? 92 : spreadCount <= 4 ? 78 : spreadCount <= 6 ? 66 : 54
  const slotWidth = phase === "revealing" ? revealSlot : Math.round(revealSlot * 0.84)

  // ── 부채(롤링형): 카드 한 장당 FAN_STEP°, 롤링(fanShift)으로 원호를 따라 굴림 ──
  // 보이는 범위(±FAN_VISIBLE_HALF) 밖 카드는 visible=false로 숨깁니다.
  function getFanStyle(cardIndex: number) {
    const index = fanOrder.indexOf(cardIndex)
    // 한 방향: index가 커질수록 각도가 커짐(왼→오른쪽). fanShift로 롤링.
    const angle = index * FAN_STEP + fanShift
    const rad = (angle * Math.PI) / 180
    const x = fanLeftX + Math.sin(rad) * fanRadius
    // 각도 0(왼쪽)이 가장 낮고, 오른쪽으로 갈수록 위로 쓸려 올라감
    const y = fanBottomY - (1 - Math.cos(rad)) * fanRadius
    // 왼쪽(먼저 나온) 카드가 위에 오도록(자연스러운 겹침)
    const visible = angle >= -FAN_STEP && angle <= FAN_SPAN + FAN_STEP
    return { left: `${x}px`, top: `${y}px`, rotate: angle, zIndex: 200 - Math.round(angle), visible }
  }

  // 결과 화면에서 안 뽑힌 카드들이 왼쪽 위에 작게 쌓이는 자리
  function getLeftoverStackStyle(orderAmongLeftovers: number) {
    return {
      left: "44px",
      top: `${34 + orderAmongLeftovers * 0.8}px`,
      rotate: (orderAmongLeftovers % 2 === 0 ? 1 : -1) * 1.5,
      zIndex: orderAmongLeftovers,
    }
  }

  // ── 스프레드 슬롯: 340px 고정 보드의 정중앙 정렬 ──
  // 카드 사이 간격이 픽셀로 고정되어 기기 폭이 달라져도 시안과 같은 간격입니다.
  function mapSlot(slot: { left: string; top: string }) {
    const boardTop = phase === "revealing" ? 20 : fanZoneHeight + 3
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
    <div className="flex flex-1 flex-col" style={{ paddingBottom: bubbleHeight }}>
      {/* ── 섞기 단계: 화면 가득 흩어진 카드 더미 (셔플 시안) ── */}
      {isShuffling && (
        <div className="flex flex-1 flex-col">
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
              const pileTarget = getPileLayout(shuffleStep, i)
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

      {/* ── 고르기/결과 무대: 부채(위) + 스프레드 슬롯(아래), 겹치지 않게 ── */}
      {!isShuffling && (
      <motion.div
        ref={stageRef}
        className="relative mx-auto w-full max-w-3xl transition-[height] duration-500"
        style={{
          height: stageHeight,
          // 고르는 중엔 이 영역 터치로 페이지가 스크롤되지 않게 잠금 → 드래그는 오직 부채 롤링에만
          touchAction: phase === "selecting" ? "none" : "auto",
        }}
        // 좌우로 쓸면 부채가 원호를 따라 굴러갑니다(롤링). 세로 스크롤은 유지.
        onPan={
          phase === "selecting"
            ? (_, info: PanInfo) => {
                if (Math.abs(info.offset.x) > 6 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
                  isRollingRef.current = true
                }
                if (isRollingRef.current) {
                  setPeekedIndex(null)
                  setFanShift((s) => Math.max(minFanShift, Math.min(maxFanShift, s + info.delta.x * 0.35)))
                }
              }
            : undefined
        }
        onPanEnd={() => {
          // 살짝 늦게 풀어, 롤링 직후 손 뗌이 카드 선택으로 오인되지 않게 함
          window.setTimeout(() => {
            isRollingRef.current = false
          }, 60)
        }}
      >
        {/* 스프레드 슬롯 — 어떤 배열로 나올지 항상 미리 보여줍니다 (시안 기준) */}
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
              {!filled && (
                <span className="font-serif text-lg text-muted-foreground/60">{i + 1}</span>
              )}
            </div>
          )
        })}

        {/* 카드들 */}
        {shuffledDeck.map((card, index) => {
          const pickedOrder = selected.indexOf(index)
          const isPicked = pickedOrder !== -1
          const isLeftover = phase === "revealing" && !isPicked
          const leftoverOrder = isLeftover ? leftoverCounter++ : -1

          let target: { left: string; top: string; rotate: number; zIndex: number; width: number; opacity: number }
          let fanVisible = true
          if (isPicked) {
            const s = resultSlots[pickedOrder]
            const pos = mapSlot(s)
            // 뽑힌 카드는 부채(최대 40)보다 위, 말풍선(60)보다는 항상 아래
            target = {
              left: pos.left,
              top: pos.top,
              rotate: s.rotate,
              zIndex: 41 + pickedOrder,
              width: slotWidth + 2,
              opacity: 1,
            }
          } else if (isLeftover) {
            const s = getLeftoverStackStyle(leftoverOrder)
            target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 40, opacity: 1 }
          } else {
            const s = getFanStyle(index)
            fanVisible = s.visible
            // 보이는 범위 밖 카드는 투명 처리(롤링하면 들어옴)
            target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: FAN_CARD_WIDTH, opacity: s.visible ? 1 : 0 }
          }

          const canClick = !isPicked && phase === "selecting" && fanVisible
          const isPeeked = peekedIndex === index

          return (
            <motion.div
              key={card.slug}
              data-fan-card={canClick ? index : undefined}
              className="absolute aspect-[1144/1919]"
              initial={false}
              style={{ pointerEvents: canClick ? "auto" : "none" }}
              animate={{
                top: target.top,
                left: target.left,
                rotate: target.rotate,
                width: target.width,
                opacity: target.opacity,
                x: "-50%",
                y: "-50%",
                zIndex: target.zIndex,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* 카드 한 장 — PC는 마우스 오버로 빼꼼 후 클릭,
                  모바일은 누르면 빼꼼 → 누른 채 움직이면 손가락 아래 카드로 빼꼼이 옮겨감 → 떼면 그 카드 선택 */}
              <motion.div
                onClick={!isTouchDevice && canClick ? () => { if (!isRollingRef.current) handlePick(index) } : undefined}
                onTouchStart={
                  isTouchDevice && canClick
                    ? () => {
                        setPeekedIndex(index)
                      }
                    : undefined
                }
                onTouchMove={
                  isTouchDevice && canClick
                    ? (e) => {
                        // 롤링(좌우 드래그) 중이면 빼꼼 이동을 멈춤 — 롤링과 충돌 방지
                        if (isRollingRef.current) return
                        // 손가락 아래에 있는 카드를 찾아 빼꼼을 옮깁니다 (PC 호버와 같은 감각)
                        const touch = e.touches[0]
                        const el = document.elementFromPoint(touch.clientX, touch.clientY)
                        const cardEl = el?.closest("[data-fan-card]") as HTMLElement | null
                        if (cardEl) {
                          setPeekedIndex(Number(cardEl.dataset.fanCard))
                        }
                      }
                    : undefined
                }
                onTouchEnd={
                  isTouchDevice && canClick
                    ? () => {
                        // 롤링(좌우 드래그) 중 손을 뗀 경우엔 선택하지 않음
                        if (!isRollingRef.current && peekedIndex !== null) handlePick(peekedIndex)
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
      </motion.div>
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
