# 앱인토스 미니앱 — 설계 메모

토스 앱 안에서 도는 미니앱을 만들려면 무엇을 새로 만들고 무엇을 그대로
쓰는지 적어둡니다. **아직 아무것도 만들지 않았습니다** — 이 문서는 결정을
내리기 위한 것입니다.

이 문서의 근거는 둘입니다.

- 앱인토스 **서비스 오픈 정책** (아리님이 옮겨 주신 것)
- `@apps-in-toss/web-framework@3.0.2` **패키지 안의 타입 정의**
  (개발자센터 문서 사이트는 이 작업 환경에서 막혀 있어, SDK 를 npm 으로
  받아 직접 읽었습니다. 추측이 아니라 실제 함수 서명입니다)

---

## 1. 결론부터 — 미니앱은 "우리 웹을 띄우는 것"이 될 수 없습니다

정책 6번이 세 가지를 못박습니다.

| | 미니앱에서 허용 | 우리 웹 |
|---|---|---|
| 로그인 | **토스 로그인만** | 카카오·구글·이메일 ❌ |
| 결제 | 디지털 상품은 **인앱결제만** | 카카오페이 ❌ (토스페이먼츠도 명시적으로 ❌) |
| 광고 | 앱인토스 광고만 | 애드센스·애드핏 ❌ |

정책 4번은 **외부 결제창으로 이동하는 것 자체**를 금지합니다. 우리 카카오페이
흐름(카카오톡으로 이동)이 정확히 그 구조입니다.

빌드도 다릅니다. 빌드한 정적 번들을 콘솔에 올립니다. **서버가 따라가지
않습니다.** 우리 앱은 Next.js 서버 렌더링에 API 18개라 그대로는 올라가지
않습니다.

⚠️ **SDK 3.x 로 만듭니다.** 설정 파일 이름과 항목이 2.x 와 다릅니다 —
   인터넷에 돌아다니는 예제는 대부분 2.x 라 그대로 베끼면 안 됩니다.

| | 2.x (옛것) | **3.x (우리가 쓸 것)** |
|---|---|---|
| 설정 파일 | `granite.config.ts` | `apps-in-toss.config.ts` |
| 번들 자리 | `outdir` | `webBundleDir` |
| 웹뷰 설정 | `webViewProps` (`type` 있음) | `webView` (`type` 없음) |
| `brand` | `displayName`·`primaryColor`·`icon` | `primaryColor` 만 |
| dev·build 명령 | 설정 파일의 `web.commands` | `package.json` 의 스크립트 |

```ts
// apps-in-toss.config.ts
import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'soulseoul',            // ← 콘솔에서 확정 (CORS·스킴이 이걸 씁니다)
  brand: { primaryColor: '#…' },
  webView: {},
  permissions: [],
  webBundleDir: 'dist',
})
```

```jsonc
// package.json — build 에 `ait build` 가 함께 들어가야 합니다
"dev":   "vite --port 3000",
"build": "vite build && ait build"
```

⚠️ **3.x 로 한 번 출시하면 2.x 로 되돌릴 수 없습니다.** 문서가 못박습니다.

→ **미니앱은 별도 프런트(Vite + React)이고, 우리 서버는 API 로 씁니다.**

---

## 2. 그래도 대부분은 그대로 씁니다

새로 만드는 것은 "겉"이고, 값이 나가는 곳은 이미 다 있습니다.

| 그대로 쓰는 것 | 어디 |
|---|---|
| 타로 엔진 (질문 분류·배열·프롬프트·해석) | `lib/question-safety.ts`, `lib/ai/*`, `lib/reading-prompt-templates.ts` |
| 별조각 원장과 셈 | `credit_entries`, `spend_credit` |
| 결제 마무리 · 환불 | `finalize_purchase`, `refund_purchase` |
| 판·대화 저장 | `readings`, `reading_turns` |
| API 16개 | `app/api/**` |

| 새로 만드는 것 | 왜 |
|---|---|
| 미니앱 프런트 (Vite+React) | 정적 번들이어야 함 |
| 토스 로그인 ↔ 우리 계정 잇기 | 소셜 로그인을 못 씀 |
| 인앱결제 지급 경로 | 외부 PG 를 못 씀 |
| ~~토큰 세션~~ ✅ 2026-08-07 | 교차 출처라 쿠키가 안 먹음 → §3 참고 |

---

## 3. 로그인 — 실제 API

```ts
import { TossAuth } from "@apps-in-toss/web-framework"

const { authorizationCode, referrer } = await TossAuth.login()
// referrer: "DEFAULT" | "SANDBOX"
// → 이 둘을 서버로 보냅니다 (SDK 주석: "서버로 전달해야 해요")
```

우리 서버가 할 일:

1. `authorizationCode` 를 토스 서버에 보내 사용자 식별자로 바꿉니다
   (교환용 서버 API 와 앱 키는 **콘솔에서 발급** — 아직 못 봤습니다)
2. 그 식별자로 우리 계정을 찾거나 만듭니다
3. 우리 세션 토큰을 발급해 미니앱에 돌려줍니다

### ✅ `Authorization` 헤더로 받는 길 — 뚫어 두었습니다 (2026-08-07)

지금 우리 인증은 Supabase **쿠키** 세션이었습니다. 미니앱은 다른 출처라
쿠키가 실리지 않아서, 그대로면 API 18개가 전부 401 입니다.

고친 곳은 `lib/supabase/server.ts` **한 곳**입니다 — 모든 API 가
`requireUser()` → `getCurrentUser()` 를 지나기 때문에, 여기만 열면 18개가
함께 열립니다. 라우트마다 손대면 한 곳을 빠뜨리고, 빠뜨린 그 API 만
미니앱에서 안 되는데 까닭을 찾기 어렵습니다.

```
Authorization: Bearer <access_token>  있으면  → 그 토큰의 자격으로
                                      없으면  → 예전 그대로 쿠키
```

`middleware.ts` 도 토큰 요청은 그냥 지나보냅니다. 거기가 하는 일은 쿠키를
새로 심는 것 하나뿐이라 미니앱에는 쓸모가 없는데, 두면 요청마다 Supabase
왕복이 한 번씩 더 붙습니다.

**확인한 것** (Supabase 를 흉내 낸 서버를 세우고 실제로 불러봤습니다):

| 보낸 것 | 결과 |
|---|---|
| 서명이 확인되는 토큰 | ✅ 로그인됨 — 프로필 생성·웰컴 별조각까지 정상으로 돌았습니다 |
| 서명을 못 믿는 토큰 | ❌ 401 |
| JWT 모양이 아닌 아무 글자 | ❌ 401 |
| 헤더 없음 (웹) | 예전 그대로 쿠키 |

⚠️ 토큰을 우리가 뜯어보지 않습니다. `auth.getUser(token)` 이 Supabase 에
   물어서 서명과 만료를 확인하고 옵니다 — 실제로 `GET /auth/v1/user` 가
   나가는 것을 확인했습니다. 글자만 보고 통과시키는 자리는 없습니다.

> **iOS 가 쿠키를 아예 막습니다.** 문서에 이렇게 적혀 있습니다 —
> "iOS/iPadOS 13.4 이상에서는 서드파티 쿠키가 완전히 차단돼요. 앱인토스
> 도메인이 아닌 파트너사 도메인에서 쿠키 기반 로그인을 구현하면 정상
> 동작하지 않아요. 토큰 기반 등 대체 인증 방식을 적용해 주세요."
> 토큰 길은 있으면 좋은 것이 아니라 **없으면 iOS 에서 아예 안 되는 것**입니다.

### ✅ CORS — 열었습니다 (2026-08-07)

토큰 길이 뚫려도 브라우저가 **다른 출처에서 부르는 것 자체**를 막습니다.
그 출처를 몰라서 못 열고 있었는데, SDK 3.x 문서에 적혀 있습니다.

| 주소 | 언제 |
|---|---|
| `https://<appName>.web.tossmini.com` | 실서비스 |
| `https://<appName>.private-web.tossmini.com` | 콘솔 QR 테스트 |

`lib/server/toss-origin.ts` + `middleware.ts` 에 넣었습니다.

⚠️ `appName` 을 코드에 박지 않습니다. Vercel 환경변수 **`TOSS_APP_NAME`**
   으로 받습니다 — 아직 콘솔 등록 전이고, 정해진 뒤에 코드를 고쳐 배포하는
   것보다 값 하나 넣는 편이 낫습니다.

⚠️ **값이 없으면 아무 곳도 열지 않습니다**(닫힌 채로 실패). 몰라서 `*` 로
   열어두는 일은 하지 않았습니다.

⚠️ `Allow-Credentials` 를 켜지 않습니다. 미니앱은 쿠키가 아니라 토큰으로
   옵니다. 안 켜면 "남의 사이트가 우리 쿠키로 API 를 부를 수 있나"를
   따질 일 자체가 없습니다.

⚠️ `/api/**` 에만 겁니다. 미니앱이 부르는 것은 API 뿐이고, 화면(HTML)까지
   열어줄 까닭이 없습니다.

**확인한 것** (실제로 불러봤습니다):

| 보낸 것 | 결과 |
|---|---|
| 실서비스 출처로 사전확인(OPTIONS) | ✅ 열어줌 |
| 콘솔 QR 출처로 사전확인 | ✅ 열어줌 |
| 남의 사이트 · 이름이 다른 미니앱 | ❌ 머리말 없음 → 브라우저가 막음 |
| 미니앱 출처 + 토큰으로 진짜 요청 | ✅ 200 + 머리말 |
| `TOSS_APP_NAME` 이 없을 때 | ❌ 아무 곳도 안 열림 |

⚠️ SDK 1.x~2.x 는 `.apps.tossmini.com` 이었습니다. 우리는 처음부터 3.x 라
   옛 주소는 넣지 않았습니다 — **3.x 로 한 번 출시하면 2.x 로 되돌릴 수
   없다**고 문서가 못박습니다.

### 계정을 웹과 이을 것인가 — 결정이 필요합니다

| | 잇기 | 따로 두기 |
|---|---|---|
| 별조각 | 웹·미니앱 공용 | 각각 |
| 만드는 품 | 큼 (연결 화면·본인 확인) | 작음 |
| 위험 | 잘못 이으면 남의 별조각이 보임 | 없음 |
| 사용자 | "웹에서 산 게 여기도 있네" | "여기서 또 사야 하네" |

**권함: 따로 두고 시작합니다.** 다만 표에 `toss_user_id` 를 두어 나중에
잇는 길을 막지 않습니다. 초기 미니앱 사용자는 웹 사용자와 거의 겹치지
않습니다 — 겹치기 시작하면 그때 이어도 늦지 않습니다.

---

## 4. 결제 — 실제 API

```ts
import { IAP } from "@apps-in-toss/web-framework"

const cleanup = IAP.createOneTimePurchaseOrder({
  options: {
    sku: "credits_ten",              // 콘솔에 등록한 상품 식별자
    async processProductGrant({ orderId }) {
      // 여기서 우리 서버를 부릅니다. 별조각을 실제로 얹는 곳입니다.
      // true 를 돌려줘야 지급 완료로 봅니다.
      return await grantOnOurServer(orderId)
    },
  },
  onEvent: ({ data }) => { /* orderId, amount, displayName … */ },
  onError: (e) => { /* … */ },
})
// 흐름이 끝나면 cleanup() 을 반드시 부릅니다
```

곁들여 있는 것들:

- `IAP.getProductItemList()` — 콘솔에 등록한 상품 목록
- `IAP.getPendingOrders()` — **아직 지급 못 한 주문** (우리 `payment-recovery` 와 같은 역할)
- `IAP.getCompletedOrRefundedOrders()` — `status: "COMPLETED" | "REFUNDED"`
- `IAP.completeProductGrant({ params: { orderId } })` — 지급 완료 알림

### 우리 쪽에 붙는 자리

이미 만들어 둔 것이 그대로 맞물립니다.

| 토스 | 우리 |
|---|---|
| `sku` | `lib/credit-packs.ts` 의 `key` (single·three·ten) |
| `orderId` | `purchases.order_id`, `provider = 'toss-iap'` |
| `processProductGrant` | `finalize_purchase()` |
| `getPendingOrders` | `recoverPendingPurchases()` 와 같은 일 |
| `REFUNDED` 감지 | `refund_purchase()` (별조각 회수) |

⚠️ **환불이 토스 쪽에서 일어납니다.** 웹에서는 우리가 환불을 시작하지만,
인앱결제는 사용자가 토스에서 환불받습니다. 그러면 우리는 모르는 채로
별조각만 남습니다 — `getCompletedOrRefundedOrders()` 를 주기적으로 훑어
`REFUNDED` 를 찾아 거둬야 합니다. 이건 미니앱을 열 때마다 도는 일로 둡니다.

⚠️ 가격을 두 곳에서 정하게 됩니다 (우리 `credit-packs` · 토스 콘솔 상품).
어긋나면 "888원인 줄 알고 눌렀는데 다른 값"이 됩니다. 지급할 때 **금액이
아니라 sku 로** 판단하고, 값이 다르면 지급을 멈추고 로그를 남깁니다.

---

## 5. 광고 — 쓸 수 있는 것으로 갈아끼웁니다

미니앱에서는 애드센스·애드핏이 금지입니다. 대신 SDK 가 줍니다.

```ts
import { TossAds } from "@apps-in-toss/web-framework"
TossAds.attachBanner(...)   // 배너
TossAds.loadFullScreenAd(...) / showFullScreenAd(...)  // 전면·보상형
```

웹 쪽은 이미 대비해 뒀습니다 — `lib/runtime.ts` 가 토스에서 열렸는지 가리고,
애드센스에 `pauseAdRequests` 를 세우고 애드핏 스크립트를 부르지 않습니다.

---

## 6. 공유 — 숨기지 않아도 될 수 있습니다

정책 4번이 "공유 링크가 자사 웹사이트로 랜딩되는 것"을 제한해서 지금은
미니앱에서 공유 단추를 내리고 있습니다. 그런데 SDK 에 이런 것이 있습니다.

- `getTossShareLink()` — 미니앱으로 돌아오는 링크
- `Share` / `share()`

즉 **토스 딥링크로 공유하면 정책을 지키면서 공유를 살릴 수 있습니다.**
미니앱을 만들 때 이걸로 바꿉니다.

## 7. 그 밖에 쓸 만한 것 (SDK 에 있음)

- `Storage` — 웹뷰에서 `localStorage` 가 못 미더울 때
- `Clipboard.setClipboardText` — 위기 연락처 번호 복사 (지금 웹 대비책과 같은 일)
- `openURL` — 법정 고지 같은 허용된 외부 링크
- `Environment` / `getOperationalEnvironment` — 샌드박스인지 운영인지
- `getDeviceId`, `getTossAppVersion`, `isMinVersionSupported`

⚠️ 대부분의 API 에 `MIN_TOSS_APP_VERSION` 과 `isSupported()` 가 붙어 있습니다.
낡은 토스 앱에서는 없는 기능이 있다는 뜻이라, **부르기 전에 `isSupported()`
를 봐야 합니다.** 안 보면 옛 버전 사용자에게서 조용히 깨집니다.

---

## 8. 서버 API — 문서를 받아 적어둡니다 (2026-08-07)

### 인증은 mTLS 입니다 (키 한 장이 아닙니다)

앱인토스 서버 API 는 전부 **mTLS 클라이언트 인증서**로 우리를 알아봅니다.
헤더에 키를 얹는 방식이 아니라, TLS 를 맺는 단계에서 서로 신원을 확인합니다.

```
https://apps-in-toss-api.toss.im       로그인·메시지·포인트·인앱결제 조회
https://pay-apps-in-toss-api.toss.im   토스페이
```

사용자 단위 API 는 아래 중 하나를 함께 보냅니다.

| 헤더 | 무엇 |
|---|---|
| `x-toss-user-key` | 토스 로그인으로 받은 사용자 키 |
| `x-anon-key` | 비로그인 식별 키 (`User.getAnonymousKey`) |
| `Authorization: Bearer` | 토스 로그인 Access Token (일부 로그인 API) |

⚠️ **Vercel 에서 mTLS 클라이언트 인증서를 쓸 수 있는지 확인이 필요합니다.**
   서버리스 함수에서 클라이언트 인증서를 붙여 나가는 것이라, Node 런타임의
   `undici` 로는 됩니다(`connect: { cert, key }`). Edge 런타임에서는 안
   됩니다 — 앱인토스를 부르는 라우트는 Node 런타임으로 못박아야 합니다.

⚠️ 방화벽 목록도 있습니다(Outbound `117.52.3.192` 등). Vercel 은 나가는
   IP 를 고정하지 않으므로, 저쪽이 우리 IP 를 막지 않는 한 문제는 없습니다.
   반대로 **콜백을 받을 때**는 저쪽 IP 만 받도록 막을 수 있습니다.

### ✅ 주문을 서버에서 검증할 수 있습니다

전에 "없으면 미니앱 화면이 보내는 `orderId` 를 그대로 믿어야 한다"고
걱정했던 자리인데, **API 가 있습니다.**

```
POST https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/order/get-order-status
{ "orderId": "…" }
→ { "orderId", "sku", "status": "PURCHASED", "statusDeterminedAt", "reason" }
```

⚠️ 그러니 `processProductGrant({ orderId })` 에서 곧바로 별조각을 얹지
   않습니다. 우리 서버가 이 API 로 **다시 물어서** `status` 와 `sku` 를
   확인한 뒤에 얹습니다. 화면이 보내는 값을 믿고 지급하면, 주문번호를
   지어내서 별조각을 받아갈 수 있습니다.

⚠️ `sku` 로 판단합니다. 금액이 아니라 sku 입니다 (§4 의 ⚠️ 와 같은 이유).

### 응답 봉투가 특이합니다

```
{ "resultType": "SUCCESS", "success": { … } }
{ "resultType": "FAIL",    "error": { "errorCode": "4010", "reason": "…" } }
```

⚠️ **비즈니스 오류가 HTTP 200 으로 옵니다.** `res.ok` 만 보고 성공으로
   넘기면 실패한 요청을 성공으로 셉니다. `resultType` 을 먼저 봐야 합니다.
   요청 한도(4095)에 걸리면 `error.data.retryAfterSeconds` 가 옵니다 —
   우리 로그인 재전송이 서버가 준 초를 쓰는 것과 같은 방식입니다.

- 요청 한도: 앱당 **분당 3,000회**

### 아직 모르는 것

1. `authorizationCode` → 사용자 식별자 교환의 **정확한 엔드포인트**
   (문서에 "사용자 정보 받기" API 로 `x-toss-user-key` 를 얻는다고만 있고
   전체 경로를 아직 못 봤습니다)
2. mTLS 인증서 **발급 절차** (콘솔 → 서버 mTLS 인증서 발급받기)
3. 콘솔에서 상품(SKU) 등록 방법과 수수료·정산
4. 앱 심사에서 타로 서비스에 붙는 추가 조건

## 8-1. 샌드박스 — 개발용 토스앱은 따로 없습니다

전용 **샌드박스 앱**을 깔아서 테스트합니다.

```
토스 비즈니스 개인 계정으로 로그인 → 앱 선택 → 토스 인증 → intoss://<appName>
```

- Android 7 / iOS 16 이상
- 샌드박스에서는 `http` 도 됩니다. **라이브는 `https` 만** — 샌드박스에서만
  되는 것을 만들지 않도록 조심해야 합니다.
- 로컬 개발: Android 는 `adb reverse tcp:8081` · `tcp:5173`, iOS 실기기는
  같은 와이파이 + 맥 IP 입력

| 샌드박스에서 되는 것 | 안 되는 것 |
|---|---|
| 토스 로그인 · 사용자 식별키(단, mock) · 토스페이 · **인앱결제** | 분석 · 공유 리워드 · **인앱 광고** |

⚠️ 광고가 샌드박스에서 안 됩니다. 광고는 콘솔 '출시하기' QR 로 실제
   토스앱에서만 확인할 수 있습니다.

⚠️ 공용 계정으로 로그인하면 세션이 자주 끊깁니다 — 개인 계정을 쓰라고
   문서가 못박습니다.

---

## 9. 순서 제안

**지금은 웹입니다.** 8/21 유료 오픈(카카오페이)이 먼저고, 미니앱은 로그인과
결제를 새로 만들어야 해서 함께 가기 어렵습니다.

0. ✅ **서버 쪽 문 열기** — 콘솔 없이 할 수 있어서 먼저 했습니다.
   이게 없으면 미니앱을 만들어도 API 를 하나도 못 부릅니다.
   · 토큰(`Authorization`)으로 사람 알아보기 (§3)
   · 미니앱 출처에 CORS 열기 (§3) — `TOSS_APP_NAME` 만 넣으면 켜집니다
1. 8/21 — 웹 오픈 (카카오페이)
2. 콘솔에서 앱 등록 → `appName` 확정, 상품(SKU) 3개 등록, mTLS 인증서 발급
   → Vercel 환경변수에 `TOSS_APP_NAME` 넣기 (그 순간 CORS 가 열립니다)
3. 미니앱 프런트 껍데기(SDK 3.x) + 토스 로그인 → 우리 세션 잇기
   → 샌드박스 앱에서 `intoss://<appName>` 로 확인
4. 타로 흐름 이식 (화면만 새로, API 는 그대로)
5. 인앱결제 + 환불 감지
6. 앱인토스 광고
7. 샌드박스 → 토스앱 테스트 → 심사

---

## 10. 웹에 이미 해둔 것

미니앱을 아직 안 만들어도, 정책 때문에 웹에 먼저 해둔 것들입니다.

- `lib/runtime.ts` · `lib/use-runtime.ts` — 토스에서 열렸는지 가리기
  (미니앱 시작 주소를 `/tarot/ask?in=toss` 로 잡으면 정확합니다)
- 미니앱에서 외부 광고 끄기
- `tel:` 이 막힐 때 번호 복사로 (위기 연락처)
- 공유가 막히면 알려주기
- 생성형 AI 고지·표시 (정책 5번 · 법정 의무)
