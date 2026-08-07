// miniapp/apps-in-toss.config.ts
// 앱인토스 미니앱 설정 — SDK 3.x 형식입니다.
//
// ⚠️ 인터넷에 도는 예제는 대부분 2.x 라 그대로 베끼면 안 됩니다. 2.x 는
//    파일 이름이 granite.config.ts 였고 outdir·webViewProps 를 썼습니다.
//    3.x 로 한 번 출시하면 2.x 로 되돌릴 수 없습니다(공식 문서).
import { defineConfig } from "@apps-in-toss/web-framework/config"

export default defineConfig({
  /**
   * 콘솔에서 앱을 등록할 때 정해지는 이름.
   *
   * ⚠️ 이 한 글자가 세 곳에서 같은 값이어야 합니다. 하나라도 어긋나면
   *    "샌드박스에서는 열리는데 API 만 막히는" 식으로 나타나서, 원인을
   *    찾는 데 한참 걸립니다.
   *
   *      1) 여기 appName
   *      2) 샌드박스에서 여는 스킴          intoss://<appName>
   *      3) 우리 서버의 TOSS_APP_NAME 환경변수 (CORS 를 여는 값)
   *         → lib/server/toss-origin.ts
   *
   * ⚠️ 아직 콘솔에 등록하지 않았습니다. 이 값은 **자리표시자**입니다.
   *    등록하면서 실제로 받은 이름으로 바꾸세요.
   */
  appName: "soulseoul",

  brand: {
    // 라임 (globals.css 의 --brand-lime 과 같은 값이어야 합니다)
    primaryColor: "#C6F24E",
  },

  /**
   * 웹뷰 설정.
   *
   * ⚠️ 당김새로고침(pullToRefresh)을 켜지 않습니다. 타로 해석은 스트리밍으로
   *    받는 중에 화면을 당기면 그대로 끊깁니다 — 사용자는 별조각만 쓰고
   *    답을 못 받습니다.
   */
  webView: {
    pullToRefreshEnabled: false,
    bounces: false,
  },

  /**
   * 권한.
   *
   * ⚠️ 지금은 비워 둡니다. 필요해지면 그때 넣습니다 — 심사에서 "왜 이
   *    권한이 필요한가"를 묻고, 안 쓰는 권한이 적혀 있으면 반려 사유가
   *    됩니다.
   *
   *    쓸 만한 자리가 하나 있긴 합니다: 위기 연락처 번호 복사(clipboard).
   *    웹에서 tel: 이 막힐 때 쓰던 대비책과 같은 일입니다. 그 화면을
   *    미니앱에 옮길 때 { name: "clipboard", access: "write" } 를 넣으세요.
   */
  permissions: [],

  /** vite build 결과물이 놓이는 곳 (2.x 의 outdir) */
  webBundleDir: "dist",
})
