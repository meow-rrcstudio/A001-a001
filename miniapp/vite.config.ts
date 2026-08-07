// miniapp/vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],

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
