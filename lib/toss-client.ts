// lib/toss-client.ts
// 토스페이먼츠 설정 중 브라우저에도 나가도 되는 것만.
//
// ⚠️ lib/toss.ts 와 나눠 둔 이유가 있습니다. 그쪽에는 "server-only" 가
//    붙어 있어서 화면 코드가 가져오면 빌드가 멈춥니다 — 일부러 그렇게
//    둔 것입니다. 승인 키(TOSS_SECRET_KEY)가 브라우저로 새면 남의 결제를
//    취소하고 조회할 수 있으니까요.
//
//    그래서 결제창을 띄우는 데 필요한 값만 이 파일로 떼어 둡니다.
//    이 파일에는 절대 비밀 키를 들이지 마세요.
//
// ⚠️ NEXT_PUBLIC_ 값은 "빌드할 때" 코드에 박힙니다. Vercel 에서 키를 넣거나
//    바꾼 뒤에는 반드시 재배포해야 합니다 (.env.example 에도 적어뒀습니다).

/** 브라우저에서 결제창을 띄울 때 쓰는 키. 나가도 되는 값입니다. */
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""

/** 결제창을 띄울 수 있는 상태인가 (승인까지 되는지는 서버가 압니다) */
export const isTossReady = Boolean(TOSS_CLIENT_KEY)

/**
 * 테스트 키인지.
 *
 * 토스는 테스트 키를 test_ 로 시작하게 만듭니다. 화면에 "지금은 테스트예요"
 * 라고 알려주는 데 씁니다 — 테스트 키인 줄 모르고 진짜 결제를 기다리는
 * 일이 없도록.
 */
export const isTossTestKey = TOSS_CLIENT_KEY.startsWith("test_")

/** 결제창 SDK. npm 패키지 대신 이 주소를 그때 불러옵니다 */
export const TOSS_SDK_URL = "https://js.tosspayments.com/v2/standard"
