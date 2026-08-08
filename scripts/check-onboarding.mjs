// scripts/check-onboarding.mjs
// 샨티를 깨우는 화면이 사람을 제대로 나누는지 봅니다.
//
//   node --experimental-strip-types scripts/check-onboarding.mjs
//
// ┌─ 무엇을 재는가 ───────────────────────────────────────────────────
// │ ① 낱말이 스스로를 지우지 않는가 — 한 낱말에 같은 갈래의 양쪽을 함께
// │    적으면(flower + stone) 서로 상쇄되어 아무 말도 안 한 것이 됩니다
// │ ② 여섯 쪽이 고르게 있는가 — 한쪽이 몰리면 모두가 그쪽으로 쏠립니다
// │ ③ 여덟 사람이 실제로 나오는가 — 표에는 여덟이 적혀 있어도 문답이
// │    닿지 못하는 조합이 있으면 그 이름은 아무도 못 받습니다
// │ ④ 카드가 결과를 바꾸는가 — 안 바뀌면 카드 고르기는 없어도 그만입니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 이 검사는 "잘 맞는가"를 재지 않습니다. 그건 사람이 해봐야 압니다.
//    여기서 잡는 것은 표가 스스로 어긋난 것뿐입니다.
import { register } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

// tsconfig 의 "@/" 별칭은 node 가 모릅니다. 저장소 뿌리로 되돌려 줍니다.
// (scripts/check-content.mjs 와 같은 방식입니다)
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

const { AXES, COMBOS } = await import("../lib/content/traits.ts")
const {
  DRAWN_KEYWORDS,
  FEAR_KEYWORDS,
  ONBOARDING_CARDS,
  PICK_MAX,
  PICK_MIN,
  profileOf,
} = await import("../lib/onboarding.ts")

const problems = []
const note = (line) => problems.push(line)

// ── ① 스스로를 지우는 낱말 ────────────────────────────────────────
const sideOf = new Map()
for (const [axis, { pair }] of Object.entries(AXES)) {
  for (const code of pair) sideOf.set(code, axis)
}

for (const k of DRAWN_KEYWORDS) {
  const axes = k.traits.map((t) => sideOf.get(t))
  const dup = axes.find((a, i) => axes.indexOf(a) !== i)
  if (dup) {
    note(`"${k.label}" 은 ${AXES[dup].name} 갈래의 양쪽을 함께 답니다 — 서로 지웁니다`)
  }
  if (k.traits.length === 0) note(`"${k.label}" 에 기우는 쪽이 없습니다`)
}

// ── ② 여섯 쪽의 균형 ──────────────────────────────────────────────
const count = {}
for (const k of DRAWN_KEYWORDS) for (const t of k.traits) count[t] = (count[t] ?? 0) + 1

for (const { name, pair } of Object.values(AXES)) {
  const [a, b] = pair.map((c) => count[c] ?? 0)
  if (a === 0 || b === 0) {
    note(`${name} 갈래의 한쪽이 낱말 0개입니다 — 아무도 그쪽으로 갈 수 없습니다`)
  } else if (Math.max(a, b) > Math.min(a, b) * 2) {
    note(`${name} 갈래가 ${a}:${b} 로 기울었습니다 — 두 배가 넘으면 한쪽으로 쏠립니다`)
  }
}

// ── ③ 여덟 사람이 다 나오는가 ─────────────────────────────────────
//
// 낱말을 3~5개 고르는 경우의 수는 너무 많아서 다 볼 수 없습니다.
// 무작위로 충분히 많이 굴려 봅니다 — 여덟이 다 나오면 닿는 것이고,
// 안 나오는 조합이 있으면 그 이름은 아무도 못 받습니다.
const seen = new Set()
const ROUNDS = 20000
let rng = 12345
const rand = () => {
  // 고정 시드 — 검사가 굴릴 때마다 다른 답을 내면 못 믿습니다
  rng = (rng * 1103515245 + 12345) & 0x7fffffff
  return rng / 0x7fffffff
}
const pickSome = (pool, n) => {
  const copy = [...pool]
  const out = []
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    out.push(...copy.splice(Math.floor(rand() * copy.length), 1))
  }
  return out
}

for (let i = 0; i < ROUNDS; i += 1) {
  const howMany = PICK_MIN + Math.floor(rand() * (PICK_MAX - PICK_MIN + 1))
  const answers = {
    drawn: pickSome(DRAWN_KEYWORDS, howMany).map((k) => k.label),
    fears: pickSome(FEAR_KEYWORDS, PICK_MIN).map((k) => k.label),
    cardSlug: ONBOARDING_CARDS[Math.floor(rand() * ONBOARDING_CARDS.length)].slug,
  }
  const profile = profileOf(answers)
  if (profile) seen.add(`${profile.grain}-${profile.light}-${profile.time}`)
}

for (const key of Object.keys(COMBOS)) {
  if (!seen.has(key)) note(`「${COMBOS[key].name}」(${key}) 에 닿는 답이 없습니다`)
}

// ── ④ 카드가 결과를 바꾸는가 ──────────────────────────────────────
let moved = 0
const sample = {
  drawn: ["새벽", "혼자", "안개"],
  fears: ["재촉", "비교", "뒤처짐"],
}
const base = profileOf({ ...sample, cardSlug: ONBOARDING_CARDS[0].slug })
for (const card of ONBOARDING_CARDS) {
  const p = profileOf({ ...sample, cardSlug: card.slug })
  if (p && base && `${p.grain}-${p.light}-${p.time}` !== `${base.grain}-${base.light}-${base.time}`) {
    moved += 1
  }
}
if (moved === 0) {
  note("카드를 무엇으로 바꿔도 결과가 그대로입니다 — 카드 고르기가 하는 일이 없습니다")
}

// ── 결과 ──────────────────────────────────────────────────────────
if (problems.length > 0) {
  console.error("✖ 어긋난 곳이 있습니다\n")
  for (const p of problems) console.error(`  · ${p}`)
  process.exit(1)
}

console.log(
  `✔ 낱말 ${DRAWN_KEYWORDS.length}개 · 두려움 ${FEAR_KEYWORDS.length}개 · 카드 ${ONBOARDING_CARDS.length}장 — ` +
    `여덟 사람이 모두 나오고, 카드가 결과를 ${moved}장에서 바꿉니다.`
)
