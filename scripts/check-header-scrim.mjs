// scripts/check-header-scrim.mjs
// 라임 배경 화면에 라임 스크림을 깔지 않았는지 화면마다 확인합니다.
//
// ┌─ 무엇을 잡는가 ───────────────────────────────────────────────────
// │ 스크림은 "크림색 본문이 헤더 밑을 지날 때도 버튼이 읽히게" 하려고
// │ 헤더 뒤에 라임 → 투명 그라데이션을 깔는 것입니다.
// │ 배경이 이미 라임인 화면에 깔면 연라임 띠가 얹혀, 띠가 끝나는 자리에
// │ 밝은 줄이 하나 생깁니다.
// │
// │ 눈으로는 화면을 하나하나 훑는 수밖에 없어서 /my/credits 에서 이
// │ 실수가 배포까지 나갔습니다. 그래서 셉니다.
// │
// │ 재는 방법: 픽셀 밝기가 아니라 "있는 그대로"를 물어봅니다.
// │   (1) 헤더가 어떤 스크림을 깔았는가 → [data-scrim] 의 값 (cream|lime)
// │   (2) 이 화면의 배경이 라임인가     → 헤더 뒤 실제 배경색
// │ 둘이 어긋나면 잘못된 짝입니다.
// │
// │ ⚠️ "스크림이 없다"도 통과가 아닙니다. 스크림은 색 장식이 아니라
// │    본문이 헤더 밑을 지날 때 버튼이 읽히게 하는 장치라, 고정 헤더가
// │    있는 화면에는 언제나 있어야 합니다. 라임 화면에서 끄고 넘어갔다가
// │    검정 본문이 버튼 뒤로 지나가는 것을 뒤늦게 봤습니다.
// │
// │ ⚠️ 처음에는 화면 위쪽 밝기가 "올랐다 내려가는지"로 쟀습니다. 그런데
// │    스크림은 반투명이라 그 아래를 지나는 본문(짙은 제목·카드 그림)까지
// │    함께 잡혀서 /tarot·/search 가 잘못 걸렸습니다. 재는 것이 흔들리면
// │    검사를 믿을 수 없게 되고, 믿지 못하는 검사는 없는 것과 같습니다.
// └──────────────────────────────────────────────────────────────────
//
// 쓰는 법:  pnpm build && pnpm start   (다른 창에서)
//           node scripts/check-header-scrim.mjs [http://localhost:3000]
const BASE = process.argv[2] ?? "http://localhost:3000"
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium"

/**
 * 브라우저를 조종하는 라이브러리를 찾습니다.
 *
 * 이 프로젝트의 의존성이 아닙니다 — 화면을 재보는 도구일 뿐이라 배포에
 * 나가는 꾸러미를 무겁게 만들 이유가 없습니다. 있는 곳을 차례로 찾고,
 * 없으면 무엇을 깔아야 하는지 말해줍니다.
 */
async function loadChromium() {
  const candidates = [
    "playwright",
    "playwright-core",
    "/opt/node22/lib/node_modules/playwright/index.mjs",
  ]
  for (const name of candidates) {
    try {
      const mod = await import(name)
      if (mod.chromium) return mod.chromium
    } catch {
      // 다음 후보
    }
  }
  console.error(
    "브라우저 조종 라이브러리를 못 찾았습니다.\n" +
      "  npm i -g playwright   (또는 pnpm add -D playwright-core)\n" +
      "브라우저 자체는 PLAYWRIGHT_CHROMIUM 로 알려줄 수 있습니다."
  )
  process.exit(2)
}

/**
 * 고정 헤더가 있는 화면들 — 새 화면을 만들면 여기에 더합니다.
 *
 * ⚠️ PageHeader 를 쓰지 않는 화면은 넣지 마세요. /search 가 그렇습니다
 *    (제 검색 화면 틀을 씁니다). 넣으면 "스크림이 없다"고 틀리게 걸립니다.
 * ⚠️ 홈(/)도 빼둡니다. 홈 헤더는 고정이 아니라 본문과 함께 굴러가므로
 *    본문이 헤더 밑을 지나가는 일이 없습니다.
 */
const PAGES = [
  "/my",
  "/my/settings",
  "/my/credits",
  "/my/credits/buy",
  "/login",
  "/reset-password",
  "/archive",
  "/tarot",
  // 타로보기 진입 — 주제·질문 칩부터 카드 뽑기까지 한 화면입니다.
  // ⚠️ 예전에 여기 있던 /tarot/reading 은 지웠습니다(이 주소로 넘겨보냅니다).
  //    지운 주소를 재고 있으면 넘겨보내진 화면을 재게 되어, 정작 새 화면이
  //    어긋나도 통과합니다.
  "/tarot/ask",
  "/about",
  "/privacy",
  // 없는 주소 — app/not-found.tsx 가 뜨는 자리입니다. 사람이 가장 당황한
  // 순간에 보는 화면이라, 여기서 버튼이 안 읽히면 나갈 길이 없어집니다.
  "/이-주소는-없습니다",
]

async function main() {
  const chromium = await loadChromium()
  const browser = await chromium.launch({ executablePath: CHROME })
  const page = await browser.newPage({ viewport: { width: 393, height: 700 } })

  let failed = 0
  let checked = 0
  // 스크림을 실제로 본 화면 수 — 0 이면 검사가 헛돈 것입니다 (아래 참고)
  let withScrim = 0

  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 20000 })
      await page.waitForTimeout(250)

      const found = await page.evaluate(() => {
        const rgb = (value) => {
          const m = value.match(/\d+(\.\d+)?/g)
          return m ? m.slice(0, 3).map(Number) : null
        }
        const close = (a, b, tolerance = 12) =>
          a && b && a.every((v, i) => Math.abs(v - b[i]) <= tolerance)

        // 이 프로젝트의 라임 — globals.css 에서 그대로 읽습니다.
        // 값을 여기에 베껴 적으면 색을 바꾼 날 검사가 조용히 틀립니다.
        //
        // ⚠️ 변수 값은 hex(#c7fe74)로 옵니다. 거기서 숫자만 긁어내면
        //    ["7","74"] 같은 쓰레기가 나와 모든 화면이 "크림"으로 보입니다
        //    (실제로 그렇게 한 번 틀렸습니다). 브라우저에게 풀게 합니다.
        const probe = document.createElement("span")
        probe.style.color = "var(--brand-lime)"
        probe.style.display = "none"
        document.body.appendChild(probe)
        const lime = rgb(getComputedStyle(probe).color)
        probe.remove()

        const scrim = document.querySelector("[data-scrim]")

        // 헤더 뒤의 실제 배경 — 헤더가 뜬 자리(가운데 위쪽)에서 위로
        // 올라가며 색이 칠해진 첫 조상을 찾습니다.
        let node = document.elementFromPoint(
          Math.floor(window.innerWidth / 2),
          Math.floor(window.innerHeight / 2)
        )
        let pageBg = null
        while (node && !pageBg) {
          const bg = rgb(getComputedStyle(node).backgroundColor)
          const alpha = getComputedStyle(node).backgroundColor.match(/rgba?\([^)]*,\s*0\)/)
          if (bg && !alpha) pageBg = bg
          node = node.parentElement
        }

        return {
          // "cream" | "lime" | null(없음)
          scrimFor: scrim ? scrim.getAttribute("data-scrim") : null,
          isLime: close(pageBg, lime),
          pageBg: pageBg?.join(","),
        }
      })

      checked += 1
      if (found.scrimFor) withScrim += 1

      const 배경 = found.isLime ? "라임" : "크림"
      const 있어야_할_것 = found.isLime ? "lime" : "cream"

      if (!found.scrimFor) {
        failed += 1
        console.log(
          `FAIL ${path}\n       스크림이 없습니다. 본문이 버튼 뒤로 그대로 지나갑니다 — ` +
            `PageHeader 에 surface="${있어야_할_것}" 로 스크림을 켜세요.`
        )
      } else if (found.scrimFor !== 있어야_할_것) {
        failed += 1
        console.log(
          `FAIL ${path}\n       배경은 ${배경}(rgb ${found.pageBg})인데 스크림은 ` +
            `"${found.scrimFor}" 용입니다 — surface="${있어야_할_것}" 로 바꾸세요.` +
            (found.isLime ? " (라임 위에 연라임 띠가 얹혀 밝은 줄이 생깁니다)" : "")
        )
      } else {
        console.log(`OK   ${path}  (${배경} 배경 · ${found.scrimFor} 스크림)`)
      }
    } catch (error) {
      console.log(`SKIP ${path} — ${error.message.split("\n")[0]}`)
    }
  }

  await browser.close()

  // ⚠️ "다 통과"가 실은 "아무것도 못 봤다"일 수 있습니다.
  //    표식([data-scrim])의 이름이 바뀌거나 낡은 빌드가 돌고 있으면
  //    모든 화면이 "스크림 없음"으로 나오고, 검사는 웃으며 통과합니다.
  //    실제로 그렇게 한 번 속았습니다. 크림 배경 화면에는 스크림이
  //    반드시 있어야 하므로, 하나도 없으면 검사 자체를 실패로 봅니다.
  if (withScrim === 0) {
    console.log(
      "\n어느 화면에서도 스크림을 찾지 못했습니다. 통과가 아니라 검사가 헛돈 것입니다 —\n" +
        "  · 낡은 빌드가 돌고 있는지 (pnpm build 를 다시)\n" +
        "  · PageHeader 의 data-scrim 표식이 그대로인지 확인하세요."
    )
    process.exit(2)
  }

  if (failed > 0) {
    console.log(`\n${checked}개 중 ${failed}개 화면의 헤더에 밝은 줄이 생깁니다.`)
    process.exit(1)
  }
  console.log(`\n${checked}개 화면 모두 배경과 스크림이 맞습니다.`)
}

main()
