// middleware.ts
// 지나가는 요청에 두 가지를 합니다.
//   1) 앱인토스 미니앱이 우리 API 를 부를 수 있게 문을 열어줍니다 (CORS)
//   2) 로그인 세션(쿠키)을 살려 둡니다
//
// 세션 토큰은 한 시간쯤 뒤에 만료됩니다. 브라우저는 스스로 갱신하지만,
// 서버(app/api/**)가 보는 쿠키는 누군가 새로 써 주지 않으면 옛것 그대로라
// "브라우저에선 로그인돼 있는데 서버는 모르는" 상태가 됩니다.
// 요청이 지나갈 때마다 여기서 한 번씩 갱신해 둡니다.
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { isAllowedTossOrigin, tossCorsHeaders } from "@/lib/server/toss-origin"

// ═══════════════════════════════════════════════════════════════════
// 온보딩 문지기
// ═══════════════════════════════════════════════════════════════════
//
// ┌─ 무엇을 지키는가 ─────────────────────────────────────────────────
// │ 타로보기 진입 화면(/tarot/ask) 하나입니다. 아직 샨티를 깨우지 않은
// │ 사람이 이 문으로 들어오면 먼저 깨우는 자리로 보냅니다.
// │ 로그인했는지는 보지 않습니다 — 깨웠는가만 봅니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 홈(/)은 지키지 않습니다. 홈은 검색으로 사람이 들어오는 자리인데,
//    쿠키 없는 요청을 전부 넘겨보내면 크롤러도 함께 넘어갑니다. 그리고
//    /onboarding 은 색인을 막아 둔 화면이라(robots noindex), 홈이 그쪽으로
//    넘어가는 순간 검색에서 홈이 사라집니다. 글·아카이빙도 같은 이유로
//    건드리지 않습니다.
//
// ⚠️ 화면이 아니라 여기서 막습니다. 화면에서 막으면 타로보기가 한 번
//    그려졌다가 튕겨서, 처음 온 사람이 보는 첫 장면이 깜빡임이 됩니다.
const AWAKENED_COOKIE = "soulseoul.awakened"
const AWAKENED_MAX_AGE = 60 * 60 * 24 * 365

/** 이 문을 지납니다 */
const GATED_PATHS = new Set(["/tarot/ask"])

function gateOnboarding(request: NextRequest): NextResponse | null {
  // 화면을 여는 요청만 봅니다. 데이터를 가져가는 요청(fetch)까지 넘겨보내면
  // 화면은 그대로 있는데 응답만 엉뚱한 HTML 이 됩니다.
  if (request.method !== "GET") return null
  if (!GATED_PATHS.has(request.nextUrl.pathname)) return null

  // 온보딩을 막 마치고 오는 길. 쿠키를 여기서 찍어 주고 주소를 깨끗하게
  // 되돌립니다 — 쿠키를 막아둔 브라우저에서도 문 앞에 갇히지 않습니다.
  if (request.nextUrl.searchParams.get("awakened") === "1") {
    const clean = request.nextUrl.clone()
    clean.searchParams.delete("awakened")
    const response = NextResponse.redirect(clean)
    response.cookies.set(AWAKENED_COOKIE, "1", {
      path: "/",
      maxAge: AWAKENED_MAX_AGE,
      sameSite: "lax",
    })
    return response
  }

  if (request.cookies.get(AWAKENED_COOKIE)) return null

  return NextResponse.redirect(new URL("/onboarding", request.url))
}

export async function middleware(request: NextRequest) {
  // ── 앱인토스 미니앱에서 오는 요청 ────────────────────────────────
  //
  // ⚠️ 무엇보다 **먼저** 봅니다. 사전 확인(OPTIONS)은 브라우저가 스스로
  //    보내는 것이라 쿠키도 토큰도 실려 있지 않습니다. 아래 세션 코드로
  //    흘려보내면 답만 늦어지고 얻는 것이 없습니다.
  //
  // ⚠️ /api 밖에는 걸지 않습니다. 미니앱이 부르는 것은 API 뿐이고,
  //    화면(HTML)까지 열어줄 까닭이 없습니다.
  const origin = request.headers.get("origin")
  const isApi = request.nextUrl.pathname.startsWith("/api/")
  const allowed = isApi && isAllowedTossOrigin(origin)

  if (request.method === "OPTIONS") {
    // 허락하지 않는 출처의 사전 확인에는 아무 머리말도 주지 않습니다.
    // 브라우저가 알아서 막습니다 — 우리가 사유를 설명해 줄 이유가 없습니다.
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? tossCorsHeaders(origin as string) : undefined,
    })
  }

  /** 미니앱에서 온 것이면 응답에 문을 열어주는 머리말을 붙입니다 */
  const withCors = (response: NextResponse) => {
    if (!allowed) return response
    for (const [k, v] of Object.entries(tossCorsHeaders(origin as string))) {
      response.headers.set(k, v)
    }
    return response
  }

  // ── 샨티를 아직 안 깨운 사람은 깨우는 자리로 ──────────────────────
  //
  // ⚠️ 아래 "Supabase 가 아직 없으면 그냥 통과"보다 **먼저** 봅니다.
  //    뒤에 두었더니 연결 전 환경에서 문지기가 통째로 안 돌았습니다 —
  //    이 문은 로그인과 아무 상관이 없는데 로그인 설정에 딸려 꺼진 셈입니다.
  const awakenGate = gateOnboarding(request)
  if (awakenGate) return withCors(awakenGate)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 아직 연결 전이면 아무것도 하지 않습니다 (사이트는 그대로 돌아갑니다)
  if (!url || !key) return withCors(NextResponse.next())

  // ⚠️ 토큰으로 오는 요청에는 할 일이 없습니다 (앱인토스 미니앱).
  //
  //    여기가 하는 일은 **쿠키를 새로 심는 것** 하나뿐인데, 미니앱은
  //    다른 출처라 쿠키를 보내지도 받지도 않습니다. 그냥 두면 요청마다
  //    Supabase 에 쓸데없이 한 번 더 물어보게 됩니다 — 미니앱은 API 를
  //    자주 부르므로 그 왕복이 그대로 느려짐이 됩니다.
  //
  //    토큰을 여기서 확인하지 않는 것이 맞습니다. 확인은 그 토큰으로
  //    실제 일을 하는 자리(lib/server/guard.ts → getCurrentUser)에서
  //    합니다. 두 곳에서 보면 한 곳만 고쳐진 채 남습니다.
  if (request.headers.get("authorization")) return withCors(NextResponse.next())

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })

  // 이 한 줄이 토큰을 갱신하고 위의 setAll 로 쿠키를 다시 심습니다.
  await supabase.auth.getUser()

  return withCors(response)
}

export const config = {
  // 그림·글꼴처럼 세션이 필요 없는 것에는 걸지 않습니다 (괜히 느려집니다)
  // sitemap.xml / robots.txt / rss.xml 도 제외합니다 —
  // 크롤러용 파일이라 세션이 필요 없고, 쿠키가 붙으면 캐시에도 방해가 됩니다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|rss\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
}
