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

빌드도 다릅니다. `granite.config.ts` 에 적힌 `build` 명령의 결과물(`outdir`)을
`.ait` 파일로 묶어 콘솔에 올립니다. **서버가 따라가지 않습니다.** 우리 앱은
Next.js 서버 렌더링에 API 16개라 그대로는 올라가지 않습니다.

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
| 토큰 세션 | 교차 출처라 쿠키가 안 먹음 |

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

⚠️ 지금 우리 인증은 Supabase **쿠키** 세션입니다. 미니앱은 다른 출처라
쿠키가 실리지 않습니다. `Authorization` 헤더로 받는 길을 새로 내야 합니다.

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

## 8. 아직 모르는 것 (콘솔·문서가 있어야 함)

1. `authorizationCode` 를 사용자 식별자로 바꾸는 **서버 API 와 키**
2. 인앱결제 주문을 **서버에서 검증**하는 API — 있는지, 있다면 어떻게
   (없으면 `processProductGrant` 의 `orderId` 만 믿어야 하는데, 그건
   미니앱 화면이 보내는 값이라 그대로 믿을 수 없습니다)
3. 콘솔에서 상품(SKU) 을 등록하는 방법과 수수료·정산
4. 앱 심사에서 타로 서비스에 붙는 추가 조건

---

## 9. 순서 제안

**지금은 웹입니다.** 8/21 유료 오픈(카카오페이)이 먼저고, 미니앱은 로그인과
결제를 새로 만들어야 해서 함께 가기 어렵습니다.

1. 8/21 — 웹 오픈 (카카오페이)
2. 콘솔에서 앱 등록 → `appName` 확정, 상품(SKU) 3개 등록
3. 미니앱 프런트 껍데기 + 토스 로그인 → 우리 세션 잇기
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
