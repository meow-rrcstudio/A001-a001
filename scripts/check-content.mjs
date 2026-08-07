// scripts/check-content.mjs
// 준비된 질문·스프레드·멘트가 제 모양인지 확인합니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 질문 60개를 손으로 쓰면 반드시 어딘가 틀립니다. 그런데 이 파일들의
// │ 실수는 **빌드를 통과합니다** — 타입은 맞고 값만 어긋나기 때문입니다.
// │
// │   layoutKey 는 5장짜리인데 positions 를 4개만 적었다
// │     → 카드 한 자리가 비거나 자리 이름이 한 칸씩 밀립니다
// │   없는 스프레드 id 를 가리켰다
// │     → 카드를 다 뽑고 나서 화면이 죽습니다
// │   confirms 를 빈 배열로 두었다
// │     → 고를 것이 없어 그 질문에서만 오류가 납니다
// │
// │ 셋 다 눈으로는 안 보이고, 그 질문을 실제로 골라봐야 압니다.
// │ 60개를 다 눌러볼 수는 없으니 세어봅니다.
// └──────────────────────────────────────────────────────────────────
//
// 쓰는 법: node --experimental-strip-types scripts/check-content.mjs
import { register } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

// tsconfig 의 "@/" 별칭은 node 가 모릅니다. 저장소 뿌리로 되돌려 줍니다.
const ROOT = fileURLToPath(new URL("../", import.meta.url))
register(
  "data:text/javascript," +
    encodeURIComponent(`
      import { existsSync } from "node:fs"
      import { pathToFileURL } from "node:url"
      const ROOT = ${JSON.stringify(ROOT)}
      export function resolve(spec, ctx, next) {
        if (!spec.startsWith("@/")) return next(spec, ctx)
        let p = ROOT + spec.slice(2)
        if (!existsSync(p)) {
          for (const ext of [".ts", ".tsx", "/index.ts"]) {
            if (existsSync(p + ext)) { p += ext; break }
          }
        }
        return next(pathToFileURL(p).href, ctx)
      }
    `),
  pathToFileURL(ROOT)
)

const { SPREADS } = await import("../lib/content/spreads.ts")
const { PREPARED } = await import("../lib/content/questions.ts")
const { ENTRY_LINES, TOPIC_LINES, SHUFFLE_URGE, SHUFFLE_POOL } = await import(
  "../lib/content/lines.ts"
)
const { TRAITS, AXES, COMBOS } = await import("../lib/content/traits.ts")
const { spreadLayouts } = await import("../lib/spread-layouts.ts")

const problems = []
const warnings = []
const fail = (where, what) => problems.push(`✘ ${where}\n    ${what}`)
const warn = (where, what) => warnings.push(`· ${where}\n    ${what}`)

/** 같은 갈래의 양쪽을 함께 적었는가 ("꽃결이면서 돌결인 사람"은 없습니다) */
function checkResonance(where, traits) {
  if (!traits) return
  const seen = new Map()
  for (const t of traits) {
    if (!TRAITS[t]) {
      fail(where, `성향 "${t}" 은 없는 값입니다. 쓸 수 있는 것: ${Object.keys(TRAITS).join(" · ")}`)
      continue
    }
    const axis = TRAITS[t].axis
    if (seen.has(axis)) {
      fail(
        where,
        `"${seen.get(axis)}" 와 "${t}" 는 같은 갈래(${AXES[axis].name})의 양쪽입니다 — ` +
          `둘 다 가진 사람은 없으므로 이 표는 아무에게도 안 맞습니다`
      )
    }
    seen.set(axis, t)
  }
}

// ── 여덟 사람이 다 있는가 ────────────────────────────────────────────
for (const grain of AXES.grain.pair) {
  for (const light of AXES.light.pair) {
    for (const time of AXES.time.pair) {
      const key = `${grain}-${light}-${time}`
      if (!COMBOS[key]) fail("성향 조합", `${key} 에 이름이 없습니다`)
    }
  }
}

// ── 스프레드 ─────────────────────────────────────────────────────────
for (const [id, spread] of Object.entries(SPREADS)) {
  const where = `스프레드 "${id}" (${spread.name})`

  const slots = spreadLayouts[spread.layoutKey]
  if (!slots) {
    fail(where, `layoutKey "${spread.layoutKey}" 는 lib/spread-layouts.ts 에 없습니다`)
  } else if (slots.length !== spread.positions.length) {
    fail(
      where,
      `layoutKey "${spread.layoutKey}" 는 ${slots.length}장인데 ` +
        `positions 는 ${spread.positions.length}개입니다`
    )
  }

  checkResonance(where, spread.resonatesWith)

  spread.positions.forEach((p, i) => {
    for (const field of ["label", "short", "long"]) {
      if (!p[field]?.trim()) fail(where, `${i + 1}번 자리의 ${field} 가 비었습니다`)
    }
  })

  // 결과를 맞히는 자리는 두지 않기로 했습니다 (자유 질문 규칙과 같은 잣대).
  const FORTUNE = /합격|불합격|당첨|승소|패소|검사\s*결과|진단\s*결과|주가|시세|성별|수명/
  spread.positions.forEach((p, i) => {
    if (FORTUNE.test(p.label)) {
      fail(where, `${i + 1}번 자리 이름 "${p.label}" 은 결과를 맞히는 자리입니다`)
    }
  })
}

// ── 질문 ─────────────────────────────────────────────────────────────
let questionCount = 0
for (const [topic, questions] of Object.entries(PREPARED)) {
  if (!questions?.length) {
    warn(`주제 "${topic}"`, "질문이 하나도 없습니다 (아직 안 채웠다면 넘어가도 됩니다)")
    continue
  }

  const slugs = new Set()
  for (const q of questions) {
    questionCount += 1
    const where = `${topic} · "${q.label || q.slug}"`

    if (!q.slug?.trim()) fail(where, "slug 가 비었습니다")
    else if (slugs.has(q.slug)) fail(where, `slug "${q.slug}" 가 이 주제 안에서 겹칩니다`)
    else if (!/^[a-z0-9-]+$/.test(q.slug)) fail(where, `slug "${q.slug}" 는 영문 소문자·숫자·하이픈만`)
    slugs.add(q.slug)

    if (!q.label?.trim()) fail(where, "label 이 비었습니다")

    if (!q.spreads?.length) fail(where, "spreads 가 비었습니다 — 하나 이상 있어야 합니다")
    for (const id of q.spreads ?? []) {
      if (!SPREADS[id]) fail(where, `스프레드 "${id}" 는 lib/content/spreads.ts 에 없습니다`)
    }

    // 확정 멘트는 질문마다 직접 씁니다 (풀이 없으므로 비면 안 됩니다).
    if (!q.confirms?.length) fail(where, "confirms 가 비었습니다 — 질문마다 하나 이상 있어야 합니다")
    ;(q.confirms ?? []).forEach((line, i) => {
      if (!line?.text?.trim()) fail(where, `confirms 의 ${i + 1}번째 text 가 비었습니다`)
      checkResonance(`${where} · confirms ${i + 1}번째`, line?.resonatesWith)
    })

    // 섞기 멘트는 풀에서 꺼냅니다. 결 이름이 있어야 하고, 그 풀이 있어야 합니다.
    if (!q.shuffleStyle) {
      fail(where, `shuffleStyle 이 없습니다 — 쓸 수 있는 것: ${Object.keys(SHUFFLE_POOL).join(" · ")}`)
    } else if (!SHUFFLE_POOL[q.shuffleStyle]) {
      fail(
        where,
        `shuffleStyle "${q.shuffleStyle}" 에 맞는 풀이 없습니다. ` +
          `쓸 수 있는 것: ${Object.keys(SHUFFLE_POOL).join(" · ")}`
      )
    }
    // 풀 대신 직접 적은 경우만 봅니다 (대개 비어 있습니다).
    ;(q.shuffles ?? []).forEach((line, i) => {
      if (!line?.text?.trim()) fail(where, `shuffles 의 ${i + 1}번째 text 가 비었습니다`)
      checkResonance(`${where} · shuffles ${i + 1}번째`, line?.resonatesWith)
    })

    checkResonance(where, q.resonatesWith)
    // 아무에게도 안 당겨지는 질문 — 언제나 꼴찌라 사실상 안 나옵니다.
    if (!q.resonatesWith?.length) {
      warn(where, "resonatesWith 가 비었습니다 — 어느 성향에도 안 당겨져서 거의 안 나옵니다")
    }
  }

  if (!slugs.has("general")) {
    warn(`주제 "${topic}"`, `"general"(전체보기) 질문이 없습니다 — 그 주제에 전체보기가 사라집니다`)
  }
  if (questions.length !== 10) {
    warn(`주제 "${topic}"`, `질문이 ${questions.length}개입니다 (목표는 10개)`)
  }
}

// ── 멘트 ─────────────────────────────────────────────────────────────
if (ENTRY_LINES.length < 2) fail("ENTRY_LINES", "둘 이상이어야 매번 달라집니다")
ENTRY_LINES.forEach((l, i) => {
  if (!l.text?.trim()) fail("ENTRY_LINES", `${i + 1}번째가 비었습니다`)
  checkResonance(`ENTRY_LINES ${i + 1}번째`, l.resonatesWith)
})
if (!SHUFFLE_URGE.length) fail("SHUFFLE_URGE", "비어 있습니다")
for (const [style, lines] of Object.entries(SHUFFLE_POOL)) {
  if (!lines?.length) fail(`SHUFFLE_POOL.${style}`, "비어 있습니다 — 이 결을 쓰는 질문이 멈춥니다")
  ;(lines ?? []).forEach((l, i) => {
    if (!l.text?.trim()) fail(`SHUFFLE_POOL.${style}`, `${i + 1}번째가 비었습니다`)
    checkResonance(`SHUFFLE_POOL.${style} ${i + 1}번째`, l.resonatesWith)
  })
  if (lines?.length === 1) warn(`SHUFFLE_POOL.${style}`, "한 줄뿐이라 늘 같은 말이 나옵니다")
}
for (const [topic, lines] of Object.entries(TOPIC_LINES)) {
  if (!lines?.length) fail(`TOPIC_LINES.${topic}`, "비어 있습니다")
  ;(lines ?? []).forEach((l, i) => {
    if (!l.text?.trim()) fail(`TOPIC_LINES.${topic}`, `${i + 1}번째가 비었습니다`)
  })
  if (lines?.length === 1) warn(`TOPIC_LINES.${topic}`, "한 줄뿐이라 늘 같은 말이 나옵니다")
}

// ── 알림 ─────────────────────────────────────────────────────────────
if (warnings.length) {
  console.log("아직 채우는 중이라면 넘어가도 되는 것들:\n")
  console.log(warnings.join("\n") + "\n")
}

if (problems.length) {
  console.error(problems.join("\n"))
  console.error(`\n${problems.length} 군데가 어긋났습니다.`)
  process.exit(1)
}

const shufflePoolCount = Object.values(SHUFFLE_POOL).reduce((n, l) => n + l.length, 0)
console.log(
  `✔ 질문 ${questionCount}개 · 스프레드 ${Object.keys(SPREADS).length}개 · ` +
    `진입 멘트 ${ENTRY_LINES.length}개 · 섞기 멘트 ${shufflePoolCount}개 — 모두 제자리입니다.`
)
