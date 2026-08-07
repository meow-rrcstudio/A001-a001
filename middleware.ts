// middleware.ts
// 로그인 세션을 살려 두는 일만 합니다.
//
// 세션 토큰은 한 시간쯤 뒤에 만료됩니다. 브라우저는 스스로 갱신하지만,
// 서버(app/api/**)가 보는 쿠키는 누군가 새로 써 주지 않으면 옛것 그대로라
// "브라우저에선 로그인돼 있는데 서버는 모르는" 상태가 됩니다.
// 요청이 지나갈 때마다 여기서 한 번씩 갱신해 둡니다.
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 아직 연결 전이면 아무것도 하지 않습니다 (사이트는 그대로 돌아갑니다)
  if (!url || !key) return NextResponse.next()

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
  if (request.headers.get("authorization")) return NextResponse.next()

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

  return response
}

export const config = {
  // 그림·글꼴처럼 세션이 필요 없는 것에는 걸지 않습니다 (괜히 느려집니다)
  // sitemap.xml / robots.txt / rss.xml 도 제외합니다 —
  // 크롤러용 파일이라 세션이 필요 없고, 쿠키가 붙으면 캐시에도 방해가 됩니다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|rss\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
}
