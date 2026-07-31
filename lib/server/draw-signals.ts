// lib/server/draw-signals.ts
// 화면이 보낸 "이 판을 어떻게 뽑았는지"를 믿을 수 있는 모양으로만 걸러냅니다.
//
// ⚠️ 화면에서 온 값이라 그대로 담지 않습니다. 아무 JSON 이나 들어오면
//    readings 행이 남의 쓰레기통이 됩니다. 아는 칸만, 숫자는 숫자로,
//    배열은 길이를 잘라 담습니다.
//
// ⚠️ 여기서도 판단하지 않습니다 ("오래 망설임" 같은 값을 만들지 않습니다).
//    무엇이 오래인지는 자료가 쌓인 뒤에 정합니다 — lib/draw-signals.ts 참고.
import "server-only"

/** 사람이 낼 수 없는 값(음수·무한대·터무니없이 큰 수)을 자릅니다 */
function num(raw: unknown, max: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.round(n * 100) / 100, max)
}

const HOUR_MS = 60 * 60 * 1000

export function readDrawSignals(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null
  const s = raw as Record<string, any>

  const source = ["opener", "chip", "typed"].includes(s.question?.source)
    ? s.question.source
    : "opener"

  const msPerPick = Array.isArray(s.pick?.msPerPick)
    ? s.pick.msPerPick.slice(0, 12).map((v: unknown) => num(v, HOUR_MS))
    : []

  return {
    v: num(s.v, 99) || 1,
    question: {
      msToChoose: num(s.question?.msToChoose, HOUR_MS),
      source,
      topicChanges: num(s.question?.topicChanges, 999),
      ...(source === "typed"
        ? {
            typedChars: num(s.question?.typedChars, 100000),
            erasedChars: num(s.question?.erasedChars, 100000),
          }
        : {}),
    },
    shuffle: {
      msToFirstTouch: num(s.shuffle?.msToFirstTouch, HOUR_MS),
      msShuffling: num(s.shuffle?.msShuffling, HOUR_MS),
      pauses: num(s.shuffle?.pauses, 9999),
      steps: num(s.shuffle?.steps, 99),
      endedEarly: s.shuffle?.endedEarly === true,
      travelScreens: num(s.shuffle?.travelScreens, 100000),
    },
    pick: {
      msPerPick,
      fanReversals: num(s.pick?.fanReversals, 99999),
      peeksWithoutPick: num(s.pick?.peeksWithoutPick, 999),
    },
    device: {
      input: s.device?.input === "mouse" ? "mouse" : "touch",
      viewportWidth: num(s.device?.viewportWidth, 20000),
      viewportHeight: num(s.device?.viewportHeight, 20000),
    },
  }
}
