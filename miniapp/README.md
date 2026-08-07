# 앱인토스 미니앱 — 껍데기

토스 앱 안에서 도는 미니앱입니다. **아직 껍데기입니다** — 타로 화면은
옮기지 않았고, "서버까지 길이 뚫렸는가"를 눈으로 보는 화면 하나만 있습니다.

설계 결정과 근거는 [`../docs/apps-in-toss.md`](../docs/apps-in-toss.md) 에
있습니다. 여기는 **어떻게 돌리는가**만 적습니다.

## 왜 웹과 별도인가

우리 웹(Next.js)을 그대로 띄울 수 없습니다. 미니앱은 **정적 번들**을
콘솔에 올리는 방식이라 서버가 따라가지 않습니다. 그래서 화면만 새로 만들고
서버는 그대로 씁니다 — API 18개, 타로 엔진, 별조각 원장 전부 그대로입니다.

```
miniapp (정적 번들, 토스 주소)  ──토큰──▶  soulseoul.xyz/api/**  (지금 그대로)
```

## 돌리기

```bash
cd miniapp
pnpm install
pnpm dev            # http://localhost:5173
```

브라우저에서 열면 토스 SDK 가 없어서 로그인 단추는 실패합니다. 그건
정상입니다 — 화면이 그려지는지, 우리 API 에 닿는지까지만 봅니다.

### 샌드박스에서 보기

개발용 토스앱은 따로 없습니다. **샌드박스 앱**을 깔아서 봅니다.

1. 샌드박스 앱 설치 (Android 7+ / iOS 16+)
2. 토스 비즈니스 **개인** 계정으로 로그인
   (공용 계정은 세션이 자주 끊깁니다)
3. 앱 선택 → 토스 인증
4. 스킴 입력: `intoss://soulseoul`

로컬 서버를 물리려면 포트를 이어줍니다.

```bash
# Android — 5173 은 vite.config.ts 의 포트와 같아야 합니다
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173

# iOS 실기기 — 같은 와이파이에 두고 맥 IP 를 샌드박스에 입력
ipconfig getifaddr en0
```

⚠️ 샌드박스는 `http` 도 되지만 **라이브는 `https` 만** 됩니다. 샌드박스에서만
되는 것을 만들지 않도록 조심하세요.

⚠️ 샌드박스에서 **광고는 테스트할 수 없습니다.** 인앱결제·토스 로그인은
됩니다. 광고는 콘솔 '출시하기' QR 로 실제 토스앱에서만 확인됩니다.

## 빌드해서 올리기

```bash
pnpm build          # vite build && ait build
```

`ait build` 가 콘솔에 올릴 번들을 만듭니다.

## 콘솔에서 값이 나오면 넣을 곳

지금 막혀 있는 것은 전부 콘솔에서 나오는 값들입니다.

| 값 | 넣는 곳 | 그러면 |
|---|---|---|
| `appName` | `apps-in-toss.config.ts` · Vercel `TOSS_APP_NAME` | 스킴이 열리고 CORS 가 켜집니다 |
| mTLS 인증서 | Vercel `TOSS_CLIENT_CERT` · `TOSS_CLIENT_KEY` | `/api/auth/toss` 가 살아납니다 |
| 상품(SKU) 3개 | `lib/credit-packs.ts` 의 key 와 맞추기 | 인앱결제가 붙습니다 |

⚠️ `appName` 은 **세 곳이 같은 값**이어야 합니다 — 설정 파일, 스킴,
`TOSS_APP_NAME`. 하나만 어긋나면 "열리기는 하는데 API 만 막히는" 식으로
나타나서 원인을 찾는 데 한참 걸립니다.

## 파일

| | |
|---|---|
| `apps-in-toss.config.ts` | 미니앱 설정 (SDK **3.x** 형식) |
| `src/session.ts` | 토스 로그인 → 우리 세션 토큰 |
| `src/api.ts` | 우리 서버 부르기 (절대주소 + Bearer) |
| `src/App.tsx` | 길이 뚫렸는지 보는 화면 |

## 막혔을 때

| 보이는 것 | 볼 곳 |
|---|---|
| `Failed to fetch` (상태 코드 없음) | CORS. Vercel 의 `TOSS_APP_NAME` 이 `appName` 과 같은지 |
| 401 인데 로그인은 했음 | 토큰 만료. `src/api.ts` 가 401 에 토큰을 버립니다 — 다시 로그인 |
| 로그인에서 503 | 정상입니다. mTLS 인증서가 아직 없습니다 (`app/api/auth/toss/route.ts`) |
| 스킴을 열면 아무것도 안 뜸 | 샌드박스 앱이 낡았을 수 있습니다. 수시로 업데이트됩니다 |
