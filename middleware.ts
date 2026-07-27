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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
}
