// miniapp/guard-shared-imports.ts
// 미니앱이 **가져다 쓰면 안 되는 것**을 가져다 쓰면 빌드를 멈춥니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 미니앱은 `@/` 로 저장소 뿌리를 봅니다. 웹과 같은 파일을 같은 이름으로
// │ 쓰기 위한 것인데(vite.config.ts), 그러면 **웹 전용 파일까지 손이
// │ 닿습니다.**
// │
// │ 처음에는 "그런 걸 가져다 쓰면 빌드가 알아서 실패한다"고 여겼습니다.
// │ 실제로 해보니 **둘 다 조용히 빌드됐습니다.**
// │
// │   · server-only 는 빌드 때가 아니라 실행할 때 던집니다
// │   · next/link 는 뿌리 node_modules 에 실제로 있어서 그냥 묶입니다
// │
// │ 그러면 샌드박스에 올려서 화면이 하얗게 뜬 뒤에야 압니다. 그때는
// │ 무엇이 원인인지도 안 보입니다 — 번들 안에 들어가 있으니까요.
// │
// │ 그래서 손으로 막습니다. 빌드가 **그 자리에서** 멈춥니다.
// └──────────────────────────────────────────────────────────────────
import type { Plugin } from "vite"

/** 미니앱에서 절대 쓸 수 없는 것들 */
const FORBIDDEN = [
  {
    match: (id: string) => id === "server-only",
    why: "서버에서만 도는 파일입니다 (Supabase 비밀키·mTLS 인증서 등이 딸려옵니다)",
  },
  {
    match: (id: string) => id === "next" || id.startsWith("next/"),
    why: "Next.js 전용입니다. 미니앱에는 Next 라우터도 서버도 없습니다",
  },
]

/** 뿌리에서 이 아래에 있는 것은 웹 전용입니다 */
const FORBIDDEN_DIRS = ["/lib/server/", "/app/"]

export function guardSharedImports(repoRoot: string): Plugin {
  return {
    name: "soulseoul:guard-shared-imports",
    // ⚠️ enforce: "pre" — 다른 플러그인이 주소를 바꿔놓기 전에 봅니다.
    enforce: "pre",

    resolveId(source, importer) {
      if (!importer) return null

      for (const rule of FORBIDDEN) {
        if (rule.match(source)) {
          throw new Error(
            [
              "",
              `미니앱이 쓸 수 없는 것을 가져왔습니다: ${source}`,
              `  가져온 곳: ${importer.replace(repoRoot, "")}`,
              `  까닭: ${rule.why}`,
              "",
              "  고치는 법 — 셋 중 하나입니다.",
              "   · 그 부품을 next 없이 쓸 수 있게 고칩니다 (웹도 함께 좋아집니다)",
              "   · 미니앱 껍데기(miniapp/src)에 그 자리만 따로 만듭니다",
              "   · 서버 일이라면 API 로 부릅니다 (miniapp/src/api.ts)",
              "",
            ].join("\n"),
          )
        }
      }
      return null
    },

    load(id) {
      const relative = id.replace(repoRoot, "/")
      // 미니앱 자기 파일은 봅니다 (miniapp/ 아래)
      if (relative.startsWith("/miniapp/")) return null

      for (const dir of FORBIDDEN_DIRS) {
        if (relative.startsWith(dir)) {
          throw new Error(
            [
              "",
              `미니앱이 웹 전용 자리의 파일을 가져왔습니다: ${relative}`,
              "",
              "  lib/server/** 와 app/** 은 서버·Next 전용입니다.",
              "  미니앱은 그 안의 것을 API 로만 부를 수 있습니다.",
              "",
            ].join("\n"),
          )
        }
      }
      return null
    },
  }
}
