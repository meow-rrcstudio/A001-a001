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
import { buildReadingPrompt, type ReadingQuestion, type ReadingTopicKey } from "@/lib/reading-prompt-templates"
import { spreadLayouts } from "@/lib/spread-layouts"

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
  mode = "prompt",
  onComplete,
}: {
  topicLabel: string
  topicSlug: ReadingTopicKey
  question: ReadingQuestion
  introMessage: string
  /**
   * 카드를 다 뒤집은 뒤에 무엇을 보여줄지.
   * · "prompt" (기본) — 외부 AI 에 붙여넣을 프롬프트를 말풍선에 띄웁니다 (비회원 흐름)
   * · "inline"        — "해석 보기" 버튼을 띄우고 onComplete 로 넘깁니다 (사이트 내 해석)
   */
  mode?: "prompt" | "inline"
  /** mode="inline" 에서 해석 보기를 눌렀을 때. 뽑은 카드 이름과 정/역방향을 넘깁니다. */
  onComplete?: (picked: { name: string; reversed: boolean; imageUrl: string }[]) => void
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

  // 카드를 다 뒤집으면 버튼 없이 스스로 해석으로 넘어갑니다.
  // (시안: "버튼 클릭 없이 자동으로 해석 내용이 나옴")
  useEffect(() => {
    if (mode !== "inline" || !onComplete) return
    if (flippedIndices.length < requiredPicks) return
    const timer = setTimeout(() => {
      onComplete(
        selected.map((cardIndex) => ({
          name: shuffledDeck[cardIndex]?.nameKo ?? "",
          reversed: cardOrientations[cardIndex] === "역방향",
          imageUrl: shuffledDeck[cardIndex]?.imageUrl ?? "",
        }))
      )
    }, 1400) // 마지막 카드를 눈으로 확인할 틈
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIndices.length, requiredPicks, mode])

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

  // 무대의 실제 크기를 잽니다 (화면 회전·창 크기 변경에도 대응).
  //
  // ⚠️ 높이를 window.innerHeight 로 계산하지 않습니다.
  //    모바일 사파리는 주소창이 접히고 펴지면서 innerHeight 가 달라지고,
  //    그 값으로 미리 계산해 두면 부채가 화면 아래로 잠기지 않고 떠버립니다.
  //    무대는 남는 자리를 flex 로 받아가고, 우리는 받은 만큼만 잽니다.
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
  // 이제 픽셀로 계산해 어느 기기에서든 같은 모양입니다.
  //
  // ┌─ 시안 규칙 ───────────────────────────────────────────────────
  // │ · 부채 카드 — 크기 고정. 화면이 작아져도 줄어들지 않습니다.
  // │ · 스프레드 보드 — 반응형. 최대 300px, 위아래 여백 20px 고정.
  // │ · 부채는 한 벌(78장)을 통째로 큰 원에 걸어 왼쪽에서 오른쪽으로
  // │   펼칩니다. 화면 밖으로 나가는 부분은 잘립니다.
  // └───────────────────────────────────────────────────────────────
  const CARD_RATIO = 1.678 //      카드 세로/가로 비율
  const FAN_CARD_HEIGHT = 240 //   부채 카드 높이 (고정) — 크기는 이 한 줄로 조절합니다
  const FAN_CARD_WIDTH = Math.round(FAN_CARD_HEIGHT / CARD_RATIO) // 143
  const BOARD_GAP = 20 //          보드 위아래 여백 (고정)
  const BOARD_HEIGHT_MAX = 300 //  보드 최대 높이
  const BOARD_HEIGHT_MIN = 140 //  이보다 좁아지지는 않습니다
  const FAN_VISIBLE_MIN = 150 //   부채가 화면에 드러나야 하는 최소 높이
  const BOARD_WIDTH = 356 //       스프레드 보드 폭
  const BOARD_HEIGHT_REVEAL = 348 // 결과 화면 보드 높이

  const SLIDER_H = 76 //   하단 손잡이 줄 (무대 위에 떠 있습니다)

  // 무대는 말풍선 아래부터 화면 맨 아래까지를 flex 로 받아갑니다.
  // 손잡이는 그 위에 떠 있으므로 무대 높이에 포함됩니다.
  const stageHeight = phase === "revealing" ? BOARD_HEIGHT_REVEAL + 40 : stageBoxHeight

  // 보드만 반응형으로 줄어듭니다. 부채 카드는 고정이라 여기서 빼지 않습니다.
  const boardHeightSelect = Math.max(
    BOARD_HEIGHT_MIN,
    Math.min(BOARD_HEIGHT_MAX, stageHeight - SLIDER_H - BOARD_GAP * 2 - FAN_VISIBLE_MIN)
  )

  // 보드가 좁아지면 슬롯·카드도 함께 살짝 작아져 겹침을 피합니다 (44~56px)
  const boardHeightNow = phase === "revealing" ? BOARD_HEIGHT_REVEAL : boardHeightSelect
  // 카드 최소 크기를 키움(44→52, 상한 56→64). 배포본 "카드 작다" 개선.
  const slotWidth =
    phase === "revealing" ? 64 : Math.round(Math.max(52, Math.min(64, (64 * boardHeightSelect) / 240)))

  // ── 부채꼴: 78장을 하나의 큰 원에 걸고, 슬라이더로 그 원을 돌립니다 ──
  //
  // 카드가 각자 움직이는 게 아니라 원판(LP)이 통째로 도는 것입니다.
  // 모든 카드의 각도가 같은 값만큼 함께 바뀌므로 서로의 간격은 변하지 않고,
  // 왼쪽 끝 카드부터 오른쪽 끝 카드까지 차례로 화면을 지나갑니다.
  //
  // ⚠️ 부채 카드는 위치를 애니메이션하지 않습니다. 손잡이를 따라 그 자리에
  //    바로 놓여야 원판이 도는 느낌이 납니다. 0.6초 전환을 걸면 손을
  //    따라오지 못하고 끌리며 떨려 보입니다.
  const fanRadius = Math.max(220, Math.min(stageWidth * 0.85, 340))
  // 부채 꼭대기(맨 위 카드의 한가운데). 두 조건 중 아래쪽을 따릅니다.
  //  · 보드 아래로 최소 20px 떨어질 것
  //  · 카드 아랫변이 화면 밖으로 충분히 잠길 것
  //
  // 카드의 아랫끝이 화면 안에서 보이면 부채가 잘린 게 아니라 "짧은 카드"로
  // 보입니다. FAN_BLEED 만큼 화면 아래로 더 내려서 끝을 감춥니다.
  const FAN_BLEED = 60
  const fanApexY = Math.max(
    boardHeightSelect + BOARD_GAP * 2 + FAN_CARD_HEIGHT / 2,
    stageHeight + FAN_BLEED - FAN_CARD_HEIGHT / 2
  )
  const fanCenterY = fanApexY + fanRadius
  // 부채 맨 위 카드의 윗변 — 보드가 쓸 수 있는 아래 한계선입니다
  const fanCardTop = fanApexY - FAN_CARD_HEIGHT / 2
  // 보드는 말풍선과 부채 사이 한가운데에 놓입니다.
  // (부채를 화면 맨 아래에 붙이고 나면 위쪽에 남는 자리가 생기는데,
  //  보드를 위로 붙여두면 그 자리가 한쪽에 빈 공간으로 남습니다)
  const boardTopSelect = Math.max(
    BOARD_GAP,
    Math.round((fanCardTop - BOARD_GAP - boardHeightSelect) / 2)
  )

  // 카드 한 장이 차지하는 각도 — 카드가 서로 살짝 겹치도록
  const ANGLE_STEP = 3.4
  // 원의 뒤쪽으로 넘어간 카드는 화면에 있을 수 없습니다 (그리기만 생략)
  const VISIBLE_HALF = 90

  // ── 겹침 순서(z) 층 ──────────────────────────────────────────────
  // ⚠️ 빼꼼 나온 카드는 층을 바꾸지 않습니다. 부채에 꽂힌 그 깊이 그대로
  //    위로만 밀려 올라오고, 오른쪽 이웃 카드에는 여전히 가립니다.
  //    맨 앞으로 끌어올리면 한 장만 통째로 떠 보여서 부채에서 빠져나온
  //    것처럼 됩니다 (운영 화면과 다릅니다).
  const FAN_Z = 10 //      부채 위 카드 — 왼쪽부터 한 장씩 위로 (10 ~ 10+77)
  const PICKED_Z = 300 //  뽑혀서 자리로 날아간 카드

  function getFanStyle(cardIndex: number) {
    const index = fanOrder.indexOf(cardIndex)
    const total = shuffledDeck.length
    // 슬라이더 0 = 맨 왼쪽 카드가 가운데, 1 = 맨 오른쪽 카드가 가운데
    const centerIndex = fanRoll * Math.max(0, total - 1)
    const angle = (index - centerIndex) * ANGLE_STEP
    const rad = (angle * Math.PI) / 180
    const x = stageWidth / 2 + Math.sin(rad) * fanRadius
    const y = fanCenterY - Math.cos(rad) * fanRadius
    return {
      left: `${x}px`,
      top: `${y}px`,
      rotate: angle,
      // 겹치는 순서 — 왼쪽부터 오른쪽으로 한 장씩 얹습니다.
      // 뒷장이 앞장 위로 올라가므로 맨 오른쪽 카드가 제일 위입니다.
      // (가운데를 제일 위로 두면 가운데에서 좌우로 펼쳐진 것처럼 보입니다)
      zIndex: FAN_Z + index,
      // 뒤로 넘어간 카드는 자리만 비켜둡니다 (지웠다 다시 그리면 깜박입니다)
      hidden: Math.abs(angle) > VISIBLE_HALF,
    }
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
    const boardTop = phase === "revealing" ? 20 : boardTopSelect
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
    // 말풍선은 글의 흐름을 따라 상단에 놓입니다(고정 아님).
    // 아래 여백은 화면에 떠 있는 것 — 고르기의 슬라이더, 결과의 "해석 보기" 버튼 — 만큼만.
    <div
      className="flex flex-1 flex-col"
      // 고르기 화면은 무대가 이미 화면 맨 아래까지 내려가 있어 비울 필요가 없습니다.
      style={{ paddingBottom: phase === "revealing" ? 88 : 0 }}
    >
      <ReadingCharacterBubble
        placement="top"
        message={
          isShuffling
            ? (nudgeMessage ?? shuffleMessages[Math.min(shuffleStep, shuffleMessages.length - 1)])
            : phase === "selecting"
              ? (question.positions[selected.length]?.guide ?? "끌리는 카드를 골라보라냥")
              : flippedIndices.length >= requiredPicks
                ? mode === "inline"
                  ? "흠! 카드는 다 뽑혔구먼. 이 몸이 고심해서 들여다보는 중이니 잠깐만 기다려보라냥..."
                  : `${topicLabel}에 대한 카드 ${requiredPicks}장을 골랐어냥. 아래 내용을 복사해서 좋아하는 AI에게 물어봐!`
                : "카드를 하나씩 뒤집어보는 중이야냥..."
        }
        promptText={
          mode === "prompt" && phase === "revealing" && flippedIndices.length >= requiredPicks
            ? buildPrompt()
            : undefined
        }
        onHeightChange={setBubbleHeight}
      />

      {/* ── 섞기 단계: 화면 가득 흩어진 카드 더미 (셔플 시안) ── */}
      {isShuffling && (
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

      {/* ── 고르기/결과 무대: 부채(위) + 스프레드 슬롯(아래), 겹치지 않게 ── */}
      {!isShuffling && (
      /* 부채는 화면 좌우 끝까지 꽉 차야 합니다. 페이지 좌우 여백(px-6)
         바깥으로 빼내려고 음수 여백을 씁니다.
         양끝 카드는 화면 밖으로 나가므로, 페이지가 스크롤되지 않도록
         여기서 잘라냅니다. */
      <div
        ref={stageRef}
        // 고르기 화면에서는 남는 자리를 flex 로 받아갑니다 (모바일 주소창 대응).
        // 결과 화면은 보드만 있으면 되므로 높이를 지정합니다.
        className={`relative isolate -mx-6 overflow-hidden sm:-mx-8 ${
          phase === "revealing" ? "transition-[height] duration-500" : "min-h-0 flex-1"
        }`}
        style={phase === "revealing" ? { height: stageHeight } : undefined}
      >
        {/* 스프레드 슬롯 — 어떤 배열로 나올지 항상 미리 보여줍니다 (시안 기준) */}
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

        {/* 카드들 */}
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
            // 뽑힌 카드는 부채 위 어느 카드보다도 앞에 놓입니다
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

          // 부채에 얹혀 있는 카드인지 (뽑히지도, 남지도 않은 카드)
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
              // 부채 위 카드는 손잡이를 따라 바로 놓입니다 (원판이 도는 느낌).
              // 뽑혀서 자리로 날아가는 카드만 0.6초 동안 움직입니다.
              transition={isOnFan ? { duration: 0 } : { duration: 0.6, ease: "easeInOut" }}
              style={{ pointerEvents: target.opacity === 0 ? "none" : undefined }}
            >
              {/* 카드 한 장 — PC는 마우스 오버로 빼꼼 후 클릭,
                  모바일은 누르면 빼꼼 → 누른 채 움직이면 손가락 아래 카드로 빼꼼이 옮겨감 → 떼면 그 카드 선택 */}
              <motion.div
                onClick={!isTouchDevice && canClick ? () => handlePick(index) : undefined}
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
                        // 손가락 아래에 있는 카드를 찾아 빼꼼을 옮깁니다 (PC 호버와 같은 감각)
                        const touch = e.touches[0]
                        const el = document.elementFromPoint(touch.clientX, touch.clientY)
                        const cardEl = el?.closest("[data-fan-card]") as HTMLElement | null
                        if (cardEl) {
                          setPeekedIndex(Number(cardEl.dataset.fanCard))
                        } else {
                          // 부채를 벗어나면 빼꼼 해제 → 떼도 아무것도 선택되지 않음
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

      {/* 하단 슬라이더 — 부채를 호를 따라 굴립니다.
          카드를 고르는 건 카드 위를 눌러 좌우로 문지르는 동작입니다(초록 강조). */}
      {phase === "selecting" && (
        /* 손잡이 줄 — 부채가 이 뒤로 이어지므로 반투명 유리면으로 둡니다 */
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-glass px-6 py-4 backdrop-blur-[var(--glass-blur)] sm:px-8">
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={fanRoll}
            onChange={(e) => setFanRoll(Number(e.target.value))}
            aria-label="카드 굴리기"
            className="mx-auto block h-1 w-full max-w-3xl cursor-pointer appearance-none rounded-full bg-foreground/20
              [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
          />
        </div>
      )}

      {/* 고르러 가기 — 1번만 섞어도 이동 가능 */}
      {isShuffling && shuffleStep >= 1 && (
        <button
          type="button"
          onClick={handleGoToPick}
          className="fixed bottom-6 right-6 z-[70] rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:right-8"
        >
          고르러 가기
        </button>
      )}


    </div>
  )
}
