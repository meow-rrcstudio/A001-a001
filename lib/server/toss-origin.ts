// lib/server/toss-origin.ts
// 앱인토스 미니앱이 우리 API 를 부를 수 있게 열어주는 자리.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 미니앱은 우리 도메인이 아니라 토스가 주는 주소에서 뜹니다. 브라우저는
// │ 다른 출처가 부르는 것을 기본으로 막습니다(CORS) — 토큰이 맞아도
// │ 응답을 읽지 못합니다.
// │
// │ 그래서 "이 출처는 우리다"라고 답해줘야 하는데, 그 주소가 무엇인지
// │ 몰라서 그동안 열지 못하고 있었습니다. SDK 3.x 문서에 적혀 있습니다.
// │
// │   https://<appName>.web.tossmini.com          실서비스
// │   https://<appName>.private-web.tossmini.com  콘솔 QR 테스트
// │
// │ appName 은 콘솔에서 앱을 등록할 때 정해집니다. 코드에 박지 않고
// │ 환경변수로 받습니다 — 아직 등록 전이고, 정해진 뒤에 코드를 고쳐
// │ 배포하는 것보다 값 하나 넣는 편이 낫습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 값이 없으면 **아무 곳도 열지 않습니다**(닫힌 채로 실패). 모른다고
//    `*` 로 열어두면 아무 사이트나 우리 API 를 부를 수 있게 됩니다.
//    토큰이 있어야 하니 당장 새는 것은 없지만, 열어둘 까닭도 없습니다.
//
// ⚠️ SDK 3.x 기준입니다. 1.x~2.x 는 `.apps.tossmini.com` 이었습니다 —
//    우리는 처음부터 3.x 로 만들기 때문에 옛 주소는 넣지 않습니다.
//    (3.x 로 한 번 출시하면 2.x 로 되돌릴 수 없다고 문서가 못박습니다)
import "server-only"

/**
 * 콘솔에서 정한 미니앱 이름. 스킴 `intoss://<appName>` 의 그 이름입니다.
 *
 * Vercel 환경변수에 넣습니다: `TOSS_APP_NAME=soulseoul`
 */
const APP_NAME = process.env.TOSS_APP_NAME?.trim()

/**
 * 미니앱이 뜨는 주소들.
 *
 * ⚠️ 두 곳 다 열어야 합니다. 콘솔 QR 로 테스트할 때는 private-web 으로
 *    뜨는데, 여기를 빠뜨리면 "출시 전에는 되는데 테스트에서만 막히는"
 *    (혹은 그 반대) 상태가 됩니다.
 */
const ALLOWED = APP_NAME
  ? new Set([
      `https://${APP_NAME}.web.tossmini.com`,
      `https://${APP_NAME}.private-web.tossmini.com`,
    ])
  : new Set<string>()

/** 이 출처에 문을 열어줘도 되는가 */
export function isAllowedTossOrigin(origin: string | null): boolean {
  return Boolean(origin) && ALLOWED.has(origin as string)
}

/**
 * 열어줄 때 함께 보내는 머리말.
 *
 * ⚠️ Allow-Credentials 를 켜지 않습니다. 미니앱은 쿠키가 아니라 토큰으로
 *    옵니다(lib/supabase/server.ts). 켜면 브라우저가 쿠키를 실어 보내려
 *    하고, 그때부터는 남의 사이트가 우리 쿠키로 API 를 부를 수 있는지를
 *    따져야 합니다 — 안 켜면 그 걱정 자체가 없습니다.
 *
 * ⚠️ Vary: Origin 이 꼭 있어야 합니다. 없으면 중간 캐시가 한 출처에 준
 *    답을 다른 출처에도 그대로 내줍니다.
 */
export function tossCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    // Authorization 이 빠지면 토큰을 실은 요청이 사전 확인에서 막힙니다.
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

/** 설정이 들어와 있는가 (진단용) */
export function isTossOriginConfigured(): boolean {
  return ALLOWED.size > 0
}
