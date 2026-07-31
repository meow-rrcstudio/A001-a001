// lib/draw-signals.ts
// 한 판을 보는 동안 사람이 어떻게 움직였는지를 숫자로만 담습니다.
//
// ┌─ 지금은 재서 남기기만 합니다 ─────────────────────────────────────
// │ 해석에는 싣지 않습니다. "8초가 오래인가"를 우리가 아직 모르기
// │ 때문입니다 — 분포를 보기 전에 임계값을 정하면 근거 없는 라벨이
// │ 됩니다. 그래서 이 파일에는 판단이 한 줄도 없습니다. 숫자만 담고,
// │ 무엇이 오래이고 무엇이 짧은지는 쌓인 뒤에 정합니다.
// │
// │ ⚠️ 여기에 "빠름"·"신중함" 같은 말을 넣지 마세요. 재는 곳과 읽는 곳이
// │    섞이면, 나중에 기준을 고칠 때 옛 판단이 박힌 자료만 남습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 왜 예전 것(shuffleStyle)을 버렸는가 ─────────────────────────────
// │ "여러 번 끊어가며 신중하게 섞음"의 조건이 interactionCount >= 14
// │ 였는데, 그 값은 섞은 횟수가 아니라 포인터 이벤트 수였습니다. 드래그
// │ 중 60Hz 로 올라오므로 14 는 약 0.2초입니다 — 손을 댄 사람은 거의 다
// │ 넘겼습니다. "힘 있게"는 아예 재지도 않았고(속도·힘 측정 없음),
// │ 시간은 첫 터치부터 재서 화면을 보며 망설인 시간이 빠졌습니다.
// │
// │ 그래서 이 파일은 기기·화면 크기가 달라도 값이 같은 것만 담습니다.
// │ 픽셀 거리처럼 화면에 딸린 값은 화면 폭으로 나눠 담습니다.
// └──────────────────────────────────────────────────────────────────
"use client"

/** 끊겼다고 볼 최소 공백 (ms). 이보다 오래 손을 떼면 한 번 끊긴 것으로 셉니다 */
const PAUSE_MS = 400

/** 담는 모양이 바뀌면 올립니다 — 나중에 섞인 자료를 가려내려면 필요합니다 */
const SHAPE_VERSION = 1

export interface DrawSignals {
  v: number
  question: {
    /** 화면에 들어와 질문이 정해지기까지 (ms) */
    msToChoose: number
    /**
     * 어떻게 정했는가.
     *   opener 주제를 고르기 전 첫 화면의 추천 질문
     *   chip   주제를 고른 뒤 그 주제의 질문
     *   typed  직접 쳐서 넣은 질문
     */
    source: "opener" | "chip" | "typed"
    /** 주제를 고쳐 고른 횟수 (✕ 로 되돌린 횟수) */
    topicChanges: number
    /** 직접 친 경우에만 — 친 글자 수와 지운 글자 수 */
    typedChars?: number
    erasedChars?: number
  }
  shuffle: {
    /** 뽑기 화면에 들어와 첫 손을 대기까지 (ms) */
    msToFirstTouch: number
    /** 첫 손 → 섞기가 끝나기까지 (ms) */
    msShuffling: number
    /** 손을 뗐다가 다시 댄 횟수 (PAUSE_MS 이상 쉰 구간) */
    pauses: number
    /** 몇 단계까지 섞었는가 (0~4) */
    steps: number
    /** 끝까지 안 채우고 "고르러 가기"로 넘겼는가 */
    endedEarly: boolean
    /** 쓸어 넘긴 총 거리 ÷ 화면 폭. 화면 크기가 달라도 견줄 수 있습니다 */
    travelScreens: number
  }
  pick: {
    /** 자리별로 한 장 고르는 데 걸린 시간 (ms). 앞자리부터 차례로 */
    msPerPick: number[]
    /** 부채를 좌우로 굴리다 방향을 바꾼 횟수 */
    fanReversals: number
    /** 빼꼼 눌러봤다가 그 카드를 안 고른 횟수 */
    peeksWithoutPick: number
  }
  device: {
    /** 손가락인가 마우스인가 — 둘은 근본이 달라 함께 견주면 안 됩니다 */
    input: "touch" | "mouse"
    viewportWidth: number
    viewportHeight: number
  }
}

export interface DrawTracker {
  /** 주제를 고쳐 골랐습니다 */
  topicChanged(): void
  /** 입력창의 글이 바뀌었습니다 (지운 양을 알아내려고 길이를 봅니다) */
  typing(length: number): void
  /** 질문이 정해졌습니다 */
  chose(source: DrawSignals["question"]["source"]): void
  /** 뽑기 화면이 떴습니다 */
  drawStarted(input: "touch" | "mouse"): void
  /** 섞는 손이 한 번 움직였습니다 (거리는 px) */
  shuffleInput(distancePx: number): void
  /** 섞기가 끝났습니다 */
  shuffleDone(o: { steps: number; endedEarly: boolean }): void
  /** 부채를 굴렸습니다 (0~1) */
  fanMoved(value: number): void
  /** 카드를 빼꼼 눌러봤습니다 */
  peeked(index: number): void
  /** 카드를 골랐습니다 */
  picked(index: number): void
  /** 지금까지 잰 것 */
  snapshot(): DrawSignals
}

/**
 * 판 하나를 따라다니는 자.
 *
 * ⚠️ 판마다 새로 만듭니다. 하나를 계속 쓰면 앞 판의 시간이 다음 판에
 *    섞입니다. 면담 중에 카드를 더 뽑는 화면에는 아예 넘기지 않습니다 —
 *    그건 같은 판을 이어가는 것이라 "이 판을 어떻게 시작했는가"와 섞이면
 *    안 됩니다.
 */
export function createDrawTracker(): DrawTracker {
  const bornAt = Date.now()

  let topicChanges = 0
  let typedChars = 0
  let erasedChars = 0
  let lastTypedLength = 0
  let source: DrawSignals["question"]["source"] = "opener"
  let msToChoose = 0

  let drawStartedAt: number | null = null
  let firstTouchAt: number | null = null
  let lastTouchAt: number | null = null
  let pauses = 0
  let travelPx = 0
  let msShuffling = 0
  let steps = 0
  let endedEarly = false

  let pickClockFrom: number | null = null
  const msPerPick: number[] = []
  let fanReversals = 0
  let fanLast: number | null = null
  let fanDirection: 0 | 1 | -1 = 0
  const peeked = new Set<number>()
  const picked = new Set<number>()

  let input: "touch" | "mouse" = "touch"

  return {
    topicChanged() {
      topicChanges += 1
    },

    typing(length) {
      // 늘어난 만큼은 친 것, 줄어든 만큼은 지운 것입니다.
      const delta = length - lastTypedLength
      if (delta > 0) typedChars += delta
      else erasedChars += -delta
      lastTypedLength = length
    },

    chose(kind) {
      source = kind
      msToChoose = Date.now() - bornAt
    },

    drawStarted(kind) {
      input = kind
      drawStartedAt = Date.now()
    },

    shuffleInput(distancePx) {
      const now = Date.now()
      if (firstTouchAt === null) firstTouchAt = now
      // 앞선 입력과 사이가 벌어져 있으면 한 번 끊긴 것으로 셉니다.
      // ⚠️ 이벤트 수를 세지 않습니다 — 드래그 한 번에도 수십 개가 올라와서
      //    "끊어가며 섞었다"와 아무 상관이 없습니다 (예전 실수).
      if (lastTouchAt !== null && now - lastTouchAt >= PAUSE_MS) pauses += 1
      lastTouchAt = now
      travelPx += Math.abs(distancePx)
    },

    shuffleDone(o) {
      steps = o.steps
      endedEarly = o.endedEarly
      if (firstTouchAt !== null) msShuffling = Date.now() - firstTouchAt
      // 여기서부터 첫 장을 고르기까지의 시간을 잽니다
      pickClockFrom = Date.now()
    },

    fanMoved(value) {
      if (fanLast !== null) {
        const d = value - fanLast
        if (d !== 0) {
          const dir = d > 0 ? 1 : -1
          if (fanDirection !== 0 && dir !== fanDirection) fanReversals += 1
          fanDirection = dir
        }
      }
      fanLast = value
    },

    peeked(index) {
      peeked.add(index)
    },

    picked(index) {
      const now = Date.now()
      if (pickClockFrom !== null) msPerPick.push(now - pickClockFrom)
      pickClockFrom = now
      picked.add(index)
    },

    snapshot() {
      const width = typeof window === "undefined" ? 0 : window.innerWidth
      const height = typeof window === "undefined" ? 0 : window.innerHeight
      // 빼꼼 눌러봤지만 끝내 안 고른 카드
      let peeksWithoutPick = 0
      for (const i of peeked) if (!picked.has(i)) peeksWithoutPick += 1

      return {
        v: SHAPE_VERSION,
        question: {
          msToChoose,
          source,
          topicChanges,
          ...(source === "typed" ? { typedChars, erasedChars } : {}),
        },
        shuffle: {
          msToFirstTouch:
            drawStartedAt !== null && firstTouchAt !== null ? firstTouchAt - drawStartedAt : 0,
          msShuffling,
          pauses,
          steps,
          endedEarly,
          travelScreens: width > 0 ? Math.round((travelPx / width) * 100) / 100 : 0,
        },
        pick: { msPerPick, fanReversals, peeksWithoutPick },
        device: { input, viewportWidth: width, viewportHeight: height },
      }
    },
  }
}
