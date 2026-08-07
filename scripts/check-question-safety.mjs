// scripts/check-question-safety.mjs
// 자유 질문을 어느 무게로 받는지 — 말뭉치를 세워두고 확인합니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ lib/question-safety.ts 는 정규식 한 줄이 사람의 목숨과 닿는 자리인데,
// │ 정규식은 눈으로 읽어서는 무엇이 걸리고 무엇이 안 걸리는지 모릅니다.
// │
// │ 실제로 「죽을래」가 통째로 빠져 있었습니다. 목록에는 「죽고 싶」만
// │ 있었고, 그래서 그렇게 친 사람에게 소드 4 가 깔리고 "온전한 휴식을
// │ 가지라"는 해석이 나갔습니다. 목록을 읽어봐도 눈에 안 띕니다 —
// │ 있는 것만 보이지 없는 것은 안 보이니까요.
// │
// │ 그래서 "이렇게 치면 이렇게 받아야 한다"를 글로 적어두고 셉니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 통과가 곧 안전이 아닙니다. 여기 적힌 것은 우리가 이미 아는 말들이고,
//    사람은 늘 우리가 모르는 말로 옵니다. 그래서 프롬프트 지침도 함께
//    붙이고(safetyDirective), 연락처는 모델이 아니라 화면이 내밉니다.
//    이 파일은 "아는 것만이라도 다시는 놓치지 않기" 위한 자리입니다.
//
// 쓰는 법: node --experimental-strip-types scripts/check-question-safety.mjs
import { register } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

// ⚠️ 검사할 파일들이 서로를 "@/lib/…" 로 부릅니다. 그 별칭은 tsconfig 의
//    것이라 node 는 모릅니다 — 붙여주지 않으면 "@/lib 패키지를 못 찾음"
//    으로 멈춥니다. 저장소 뿌리로 되돌려 주는 갈고리 하나면 됩니다.
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

const { auditFreeQuestion } = await import("../lib/question-safety.ts")

/** 목숨이 걸린 말 — 반드시 위기로 받아야 합니다 */
const CRISIS = [
  "죽을래",
  "죽을까",
  "나 죽고 싶어",
  "그냥 죽어버릴까",
  "죽는 게 나을 것 같아",
  "죽으면 편해질까",
  "자살하고 싶어",
  "자해를 멈추고 싶어",
  "목숨을 끊고 싶다",
  "유서를 써두었어",
  "살고 싶지 않아",
  "살기 싫어",
  "살아서 뭐 하나 싶어",
  "사라지고 싶어",
  "없어지고 싶다",
  "다 끝내고 싶어",
  "태어나지 말았어야 했어",
  "아침에 안 깨어났으면 좋겠어",
  "뛰어내리고 싶어",
  "손목을 그었어",
  "약을 다 먹어버릴까",
  "극단적인 선택을 생각해",
  // 말버릇이 섞여 들어와도 뒤에 진짜가 있으면 잡아야 합니다
  "짜증나 죽겠어 그냥 죽을까",
]

/** 남을 해치려는 말 — 이쪽도 위기입니다 */
const HARM = ["죽여버리고 싶어", "그 사람을 죽이고 싶어", "너 죽을래", "칼로 찌르고 싶어"]

/** 위기는 아니지만 그냥 지나칠 수 없는 말 */
const HEAVY = [
  "힘들어서 못 살겠어",
  "더는 못 버티겠어",
  "다 놓고 싶어",
  "버틸 힘이 없어",
  "모든 걸 그만두고 싶어",
  "아무것도 하기 싫어",
  "한계인 것 같아",
]

/** 결과를 맞히듯 말하면 안 되는 말 */
const SENSITIVE = [
  ["암일까요 검사 결과가 무서워", "의료"],
  ["소송에서 이길 수 있을까", "법률"],
  ["비트코인 지금 사도 될까", "투자"],
]

/**
 * 그냥 읽으면 되는 말.
 *
 * ⚠️ 이쪽이 더 중요할 수도 있습니다. 아무 데나 상담전화가 뜨면 사람이
 *    그 상자를 안 읽게 되고, 정작 필요한 날에도 안 읽습니다.
 */
const NORMAL = [
  "배고파 죽겠어 뭐 먹을까",
  "너무 좋아 죽겠어",
  "귀여워 죽겠어",
  "일이 많아 바빠 죽겠다",
  "그 사람 마음이 궁금해",
  "이직해도 될까",
  "올해 내 운은 어때",
  "친구랑 화해할 수 있을까",
  "요즘 좀 지쳤어",
]

let failed = 0

function check(label, question, expected) {
  const audit = auditFreeQuestion(question)
  const ok = expected(audit)
  if (!ok) {
    failed += 1
    console.error(
      `✘ ${label} — 「${question}」\n    받은 것: level=${audit.level} category=${audit.category} ` +
        `resources=${audit.resources?.length ?? 0}`
    )
  }
  return ok
}

for (const q of CRISIS) {
  check("위기여야 합니다", q, (a) => a.level === "crisis" && (a.resources?.length ?? 0) > 0)
}

for (const q of HARM) {
  check("위기(가해)여야 합니다", q, (a) => a.level === "crisis" && a.category === "범죄")
}

for (const q of HEAVY) {
  // 위기 상자까지는 아니어도, 등급이 오르고 번호는 곁에 있어야 합니다.
  check(
    "무거운 마음으로 받아야 합니다",
    q,
    (a) => a.level === "sensitive" && (a.resources?.length ?? 0) > 0
  )
}

for (const [q, category] of SENSITIVE) {
  check(`${category} 로 받아야 합니다`, q, (a) => a.level === "sensitive" && a.category === category)
}

for (const q of NORMAL) {
  check("그냥 읽어야 합니다", q, (a) => a.level === "normal")
}

// 프롬프트에 실리는 지침이 실제로 붙는지도 함께 봅니다 — 등급만 맞고
// 지침이 비면 모델은 아무것도 모르는 채로 답합니다.
const { safetyDirective } = await import("../lib/question-safety.ts")
const crisisDirective = safetyDirective(auditFreeQuestion("죽을래"))
if (!crisisDirective.includes("사람먼저") || !crisisDirective.includes("뽑기금지")) {
  failed += 1
  console.error("✘ 위기 지침에 사람먼저·뽑기금지가 없습니다:\n" + crisisDirective)
}

// ═══════════════════════════════════════════════════════════════════
// 카드를 섞기 전에 건네는 첫 마디
//
// 「"힘들다"이라... 좋은 질문이구먼」이 실제로 나갔습니다. 물음이 아니라
// 털어놓은 말인데 물음이라 부르고, 무거운 말인데 좋다고 했습니다.
// ═══════════════════════════════════════════════════════════════════
const { freeIntroFor } = await import("../lib/free-question.ts")

let introFailed = 0
function checkIntro(question, expect) {
  const line = freeIntroFor(question, auditFreeQuestion(question))
  const bad = expect(line)
  if (bad) {
    introFailed += 1
    console.error(`✘ 첫 마디 — 「${question}」\n    ${bad}\n    받은 것: ${line}`)
  }
}

// 어떤 말에도 칭찬을 얹지 않습니다.
for (const q of ["힘들다", "나 암이래 너무 걱정돼", "죽을래", "이직해도 될까", "못 살겠어"]) {
  checkIntro(q, (line) => (/좋은 질문|훌륭한|재미있는 질문/.test(line) ? "물음을 칭찬했습니다" : null))
}

// 조사가 앞말의 받침을 따라갑니다.
checkIntro("힘들다", (line) => (line.startsWith(`"힘들다"라...`) ? null : `조사가 어긋났습니다`))
checkIntro("이직", (line) => (line.startsWith(`"이직"이라...`) ? null : `조사가 어긋났습니다`))

// 무거운 말은 무겁게 받습니다.
checkIntro("나 암이래 너무 걱정돼", (line) =>
  line.includes("걱정이 크겠구먼") ? null : "몸 이야기를 그냥 지나쳤습니다"
)
checkIntro("죽을래", (line) =>
  line.includes("흘려듣지 않겠다") ? null : "위기인데 평범하게 받았습니다"
)

failed += introFailed

const total = CRISIS.length + HARM.length + HEAVY.length + SENSITIVE.length + NORMAL.length + 1 + 9
if (failed > 0) {
  console.error(`\n${total} 개 중 ${failed} 개가 어긋났습니다.`)
  process.exit(1)
}
console.log(`✔ ${total} 개 모두 제자리입니다.`)
