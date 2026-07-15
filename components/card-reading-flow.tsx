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

const FAN_COUNT = 24
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

  const traveledRef = useRef(0)
  const lastMouseX = useRef<number | null>(null)
  const shuffleStartRef = useRef<number | null>(null)
  const interactionCountRef = useRef(0)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartYRef = useRef<number | null>(null)

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

  // ── 아치형 부채 좌표 (좌우 대칭 무지개 아치) ──
  // 왼쪽 끝(-55도)에서 오른쪽 끝(+55도)까지 한 호흡으로 이어지며,
  // 정중앙(50%)을 기준으로 좌우가 똑같습니다.
  // 부채는 무대 위쪽 ~35% 안에만 머물러 스프레드 영역을 침범하지 않습니다.
  function getFanStyle(cardIndex: number) {
    const index = fanOrder.indexOf(cardIndex)
    const total = shuffledDeck.length
    const spread = 110 // 부채가 벌어지는 전체 각도 (좌우 각 55도)
    const angle = -spread / 2 + (index / Math.max(1, total - 1)) * spread
    const rad = (angle * Math.PI) / 180
    const x = 50 + Math.sin(rad) * 46 //   가로: 12% ~ 88% (중앙 대칭)
    const y = 5 + (1 - Math.cos(rad)) * 48 // 세로: 아치 정점 5%, 양 끝 ~26%
    return { left: `${x}%`, top: `${y}%`, rotate: angle, zIndex: 10 + index }
  }

  // 결과 화면에서 안 뽑힌 카드들이 왼쪽 위에 작게 쌓이는 자리
  function getLeftoverStackStyle(orderAmongLeftovers: number) {
    return {
      left: "9%",
      top: `${8 + orderAmongLeftovers * 0.25}%`,
      rotate: (orderAmongLeftovers % 2 === 0 ? 1 : -1) * 1.5,
      zIndex: orderAmongLeftovers,
    }
  }

  // ── 스프레드 슬롯 영역 매핑 ──
  // 좌표 원본(lib/spread-layouts.ts)은 0~100% 기준이므로,
  // 고르는 중에는 무대 아래쪽 영역으로, 결과 화면에서는 무대 전체로 펼칩니다.
  const spreadZone = phase === "revealing" ? { offset: 4, scale: 0.92 } : { offset: 44, scale: 0.5 }
  function mapSlotTop(slotTop: string) {
    return `${spreadZone.offset + parseFloat(slotTop) * spreadZone.scale}%`
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
      <div
        className="relative mx-auto w-full max-w-3xl transition-[height] duration-500"
        style={{
          height: phase === "revealing" ? "clamp(300px, 46dvh, 430px)" : "clamp(400px, 72dvh, 560px)",
        }}
      >
        {/* 스프레드 슬롯 — 어떤 배열로 나올지 항상 미리 보여줍니다 (시안 기준) */}
        {resultSlots.map((slot, i) => {
          const filled = selected.length > i
          return (
            <div
              key={i}
              className="absolute flex aspect-[1144/1919] w-20 items-center justify-center rounded-[8%] border border-border bg-muted/60 sm:w-24"
              style={{
                left: slot.left,
                top: mapSlotTop(slot.top),
                transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
              }}
            >
              {!filled && (
                <span className="font-serif text-xl text-muted-foreground/60">{i + 1}</span>
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

          let target: { left: string; top: string; rotate: number; zIndex: number; width: number }
          if (isPicked) {
            const s = resultSlots[pickedOrder]
            // 뽑힌 카드는 부채(최대 40)보다 위, 말풍선(60)보다는 항상 아래
            target = {
              left: s.left,
              top: mapSlotTop(s.top),
              rotate: s.rotate,
              zIndex: 41 + pickedOrder,
              width: 92,
            }
          } else if (isLeftover) {
            const s = getLeftoverStackStyle(leftoverOrder)
            target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 40 }
          } else {
            const s = getFanStyle(index)
            target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 76 }
          }

          const canClick = !isPicked && phase === "selecting"
          const isPeeked = peekedIndex === index

          return (
            <motion.div
              key={card.slug}
              className="absolute aspect-[1144/1919]"
              initial={false}
              animate={{
                top: target.top,
                left: target.left,
                rotate: target.rotate,
                width: target.width,
                x: "-50%",
                y: "-50%",
                zIndex: target.zIndex,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {/* 카드 한 장 — PC는 마우스 오버, 모바일은 꾹 눌렀다 떼면 선택 */}
              <motion.div
                onClick={!isTouchDevice && canClick ? () => handlePick(index) : undefined}
                onTouchStart={
                  isTouchDevice && canClick
                    ? (e) => {
                        touchStartYRef.current = e.touches[0].clientY
                        setPeekedIndex(index)
                      }
                    : undefined
                }
                onTouchMove={
                  isTouchDevice && canClick
                    ? (e) => {
                        // 스크롤하려는 움직임이면 선택을 취소 (빼꼼 해제)
                        if (
                          touchStartYRef.current !== null &&
                          Math.abs(e.touches[0].clientY - touchStartYRef.current) > 14
                        ) {
                          setPeekedIndex(null)
                        }
                      }
                    : undefined
                }
                onTouchEnd={
                  isTouchDevice && canClick
                    ? () => {
                        if (peekedIndex === index) handlePick(index)
                        setPeekedIndex(null)
                        touchStartYRef.current = null
                      }
                    : undefined
                }
                onTouchCancel={isTouchDevice ? () => setPeekedIndex(null) : undefined}
                whileHover={!isTouchDevice && canClick ? { y: -16 } : undefined}
                animate={isTouchDevice && canClick ? { y: isPeeked ? -16 : 0 } : undefined}
                transition={{ duration: 0.15 }}
                className={`h-full w-full ${canClick ? "cursor-pointer" : ""}`}
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
