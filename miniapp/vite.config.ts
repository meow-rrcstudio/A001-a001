// miniapp/vite.config.ts
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { guardSharedImports } from "./guard-shared-imports"

/**
 * 공용 자리 — 웹과 미니앱이 **같은 파일**을 봅니다.
 *
 * ┌─ 왜 파일을 옮기지 않는가 ─────────────────────────────────────────
 * │ 공용 폴더를 새로 만들어 lib·components 를 거기로 옮기는 방법도
 * │ 있습니다. 그런데 그러면 웹 쪽 import 수백 줄이 한꺼번에 바뀝니다 —
 * │ 아직 웹 고도화가 한창인 시기에 그 큰 diff 를 얹으면, 다른 작업과
 * │ 부딪히고 무엇이 진짜 바뀐 것인지 안 보입니다.
 * │
 * │ 대신 미니앱이 저장소 뿌리를 `@/` 로 보게 합니다. 웹이 쓰는 것과
 * │ **똑같은 이름**으로 부를 수 있습니다.
 * │
 * │   웹      import { CREDIT_PACKS } from "@/lib/credit-packs"
 * │   미니앱  import { CREDIT_PACKS } from "@/lib/credit-packs"   ← 같은 파일
 * │
 * │ 옮기는 것은 나중에 해도 되고, 안 해도 됩니다. 지금 필요한 것은
 * │ "두 벌이 되지 않는 것" 하나뿐입니다.
 * └──────────────────────────────────────────────────────────────────
 *
 * ⚠️ 아무거나 가져다 쓰면 안 됩니다. 두 가지는 미니앱에서 **못 씁니다.**
 *      · `server-only` 를 부르는 것 (lib/server/**, lib/supabase/server 등)
 *      · `next/link`·`next/navigation`·`next/image` 를 쓰는 부품
 *
 *    ⚠️ 이게 저절로 막힐 줄 알았는데 **아니었습니다.** 실제로 해보니
 *       둘 다 조용히 빌드됐습니다 — server-only 는 실행할 때 던지고,
 *       next/link 는 뿌리 node_modules 에 있어서 그냥 묶입니다. 그러면
 *       샌드박스에 올려 화면이 하얗게 뜬 뒤에야 압니다.
 *       그래서 guard-shared-imports.ts 로 손수 막습니다.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url))

export default defineConfig({
  plugins: [react(), guardSharedImports(repoRoot.replace(/\/$/, ""))],

  resolve: {
    alias: { "@": repoRoot },
  },

  /**
   * ⚠️ base 를 "./" 로 둡니다.
   *
   * 번들은 우리 도메인이 아니라 토스가 주는 주소에서 뜹니다
   * (https://<appName>.web.tossmini.com). 기본값 "/" 로 두면 자원 주소가
   * 절대경로로 박혀서, 토스가 하위 경로에 올려주는 경우 전부 404 가 됩니다.
   * 상대경로면 어디에 올라가든 자기 옆을 찾습니다.
   */
  base: "./",

  server: {
    /**
     * ⚠️ 5173 고정입니다. 안드로이드에서 로컬 개발을 하려면
     *    `adb reverse tcp:5173 tcp:5173` 로 포트를 이어주는데, 그 번호와
     *    같아야 합니다. 비어 있는 아무 포트나 쓰면 기기에서 안 열립니다.
     */
    port: 5173,
    strictPort: true,
    /** iOS 실기기는 맥의 IP 로 들어옵니다 — localhost 로 묶으면 못 붙습니다 */
    host: true,
  },

  build: {
    outDir: "dist",
    /**
     * 소스맵을 올리지 않습니다. 번들이 콘솔에 통째로 올라가는데, 소스맵이
     * 함께 있으면 우리 코드가 그대로 읽힙니다.
     */
    sourcemap: false,
  },
})
