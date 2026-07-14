// components/card-reading-flow.tsx
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

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

function getPileLayout(step: number, index: number) {
  const seed = (step + 1) * 911 + index * 137.5
  return {
    top: `${4 + ((seed * 1.7) % 80)}%`,
    left: `${4 + ((seed * 2.3) % 76)}%`,
    rotate: ((seed * 4.7) % 140) - 70,
    z: Math.floor(seed) % FAN_COUNT,
  }
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
  const [progress, setProgress] = useState(0)
  const [shuffleStep, setShuffleStep] = useState(0)
  const [entered, setEntered] = useState(false)
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null)
  const [shuffleStyle, setShuffleStyle] = useState<string | null>(null)
  const [bubbleHeight, setBubbleHeight] = useState(160)

  const traveledRef = useRef(0)
  const lastMouseX = useRef<number | null>(null)
  const shuffleStartRef = useRef<number | null>(null)
  const interactionCountRef = useRef(0)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMobile = useIsMobile()
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

  const fanOrder = useMemo(() => {
    const indices = shuffledDeck.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }, [shuffledDeck.length])

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
    setProgress(next)
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

  const rows = isMobile ? 2 : 1
  const arcSpan = 150

  // 부채꼴 카드의 zIndex는 최대 40까지만 — 말풍선(z-60)보다 항상 아래에 있도록
  function getFanStyle(cardIndex: number, total: number) {
    const index = fanOrder.indexOf(cardIndex)
    const spread = 46
    const angle = -spread / 2 + (index / (total - 1)) * spread
    const radius = 340
    const rad = (angle * Math.PI) / 180
    const x = 50 + Math.sin(rad) * (radius / 4)
    const y = 6 + (1 - Math.cos(rad)) * (radius / 3)
    return { left: `${x}%`, top: `${y}%`, rotate: angle, zIndex: 40 - Math.abs(Math.round(angle)) }
  }

  function getLeftoverStackStyle(orderAmongLeftovers: number) {
    return {
      left: "6%",
      top: `${4 + orderAmongLeftovers * 0.25}%`,
      rotate: (orderAmongLeftovers % 2 === 0 ? 1 : -1) * 1.5,
      zIndex: orderAmongLeftovers,
    }
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

  let leftoverCounter = 0

  return (
    <div className="flex flex-1 flex-col">
      {phase === "shuffling" && (
        <div className="flex flex-1 flex-col">
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

            {/* 고르러 가기 — 1번만 섞어도 이동 가능, 피그마 스타일 알약 버튼 */}
          </motion.div>

          <div className="mt-4 px-6">
          </div>
        </div>
      )}

      {phase === "shuffling" && (
        <>
          {shuffleStep >= 1 && (
            <button
              type="button"
              onClick={handleGoToPick}
              className="fixed right-6 z-[70] rounded-full bg-neutral-800/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 sm:right-8"
              style={{ bottom: bubbleHeight + 44 }}
            >
              고르러 가기
            </button>
          )}
          <ReadingCharacterBubble
            message={nudgeMessage ?? shuffleMessages[Math.min(shuffleStep, shuffleMessages.length - 1)]}
            onHeightChange={setBubbleHeight}
          />
        </>
      )}

      {(phase === "selecting" || phase === "revealing") && (
        <div className="flex flex-1 flex-col" style={{ paddingBottom: bubbleHeight }}>
          <div
            className="relative mx-auto w-full max-w-3xl transition-[height] duration-500"
            style={{ height: phase === "revealing" ? "40dvh" : "68dvh" }}
          >
            {resultSlots.map((slot, i) => (
              <div
                key={i}
                className="absolute aspect-[1144/1919] w-24 -translate-x-1/2 -translate-y-1/2 rounded-[6%] border border-dashed border-white/25 sm:w-28"
                style={{ left: slot.left, top: slot.top }}
              />
            ))}

            {shuffledDeck.map((card, index) => {
              const pickedOrder = selected.indexOf(index)
              const isPicked = pickedOrder !== -1
              const isLeftover = phase === "revealing" && !isPicked
              const leftoverOrder = isLeftover ? leftoverCounter++ : -1

              let target: { left: string; top: string; rotate: number; zIndex: number; width: number }
              if (isPicked) {
                const s = resultSlots[pickedOrder]
                // 뽑힌 카드는 부채꼴(최대 40)보다 살짝 위, 말풍선(60)보다는 항상 아래
                target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: 41 + pickedOrder, width: 100 }
              } else if (isLeftover) {
                const s = getLeftoverStackStyle(leftoverOrder)
                target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 44 }
              } else {
                const s = getFanStyle(index, shuffledDeck.length)
                target = { left: s.left, top: s.top, rotate: s.rotate, zIndex: s.zIndex, width: 72 }
              }

              const canClick = !isPicked && phase === "selecting"

              return (
                <motion.div
                  key={card.slug}
                  className="absolute aspect-[1144/1919] origin-bottom"
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
                  <motion.div
                    onClick={canClick ? () => handlePick(index) : undefined}
                    whileHover={canClick ? { y: -16 } : undefined}
                    whileTap={canClick ? { y: -16 } : undefined}
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
        </div>
      )}

      {(phase === "selecting" || phase === "revealing") && (
        <ReadingCharacterBubble
          message={
            phase === "selecting"
              ? (question.positions[selected.length]?.guide ?? "끌리는 카드를 골라보라냥")
              : flippedIndices.length >= requiredPicks
                ? `${topicLabel}에 대한 카드 ${requiredPicks}장을 골랐어냥. 아래 내용을 복사해서 좋아하는 AI에게 물어봐!`
                : "카드를 하나씩 뒤집어보는 중이야냥..."
          }
          promptText={phase === "revealing" && flippedIndices.length >= requiredPicks ? buildPrompt() : undefined}
          onHeightChange={setBubbleHeight}
        />
      )}
    </div>
  )
}