// app/auth/callback/route.ts
// 구글·카카오에서 돌아오는 자리입니다.
//
// 로그인 창에서 승인하면 그쪽이 이 주소로 되돌려 보내면서 code 를 붙여줍니다.
// 그 code 를 세션(쿠키)으로 바꿔 끼우는 것이 여기서 하는 일 전부입니다.
//
// ⚠️ Supabase 대시보드의 Authentication → URL Configuration 에
//    이 주소가 등록돼 있어야 합니다. 미리보기 주소도 함께 넣어야
//    미리보기에서 로그인이 됩니다.
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * 로그인 뒤 돌아갈 곳을 안전한 것만 통과시킵니다.
 *
 * ⚠️ 검사 없이 new URL(next, origin) 을 쓰면 안 됩니다. next 가
 *    "https://남의사이트" 라면 그 주소가 그대로 살아나서, 우리 로그인
 *    링크가 남의 사이트로 보내는 발판이 됩니다(오픈 리다이렉트).
 *    피싱에 쓰이는 흔한 수법입니다 — 주소만 보면 우리 도메인이니까요.
 *
 * "/" 로 시작하는 우리 안쪽 길만 받습니다. "//남의사이트" 는 브라우저가
 * 프로토콜 상대 주소로 읽어 바깥으로 나가므로 함께 막습니다.
 */
function safeNext(raw: string | null): string {
  // 돌아갈 곳을 모르면 홈입니다. 예전에는 MY(기록 목록)였는데, 홈에서
  // 로그인한 사람도 기록 목록에 떨어졌습니다 — 보러 온 것이 아닌데도요.
  if (!raw) return "/"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/"
  return raw
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  // 로그인 뒤 돌아갈 곳. 없거나 바깥으로 나가는 주소면 홈으로 보냅니다.
  const next = safeNext(url.searchParams.get("next"))

  // 되돌려 보낼 때 사유와 함께 "가려던 곳"도 들려 보냅니다.
  //
  // ⚠️ next 를 빠뜨리면 안 됩니다. 타로를 보다 로그인으로 넘어온 사람이
  //    한 번 실패하면, 다시 로그인한 뒤 보던 자리가 아니라 홈으로 떨어집니다.
  //    실패한 것도 억울한데 하던 일까지 잃습니다.
  const backToLogin = (reason: string) => {
    const target = new URL("/login", url.origin)
    target.searchParams.set("error", reason)
    if (next !== "/") target.searchParams.set("next", next)
    return NextResponse.redirect(target)
  }

  // 사용자가 창을 닫거나 승인을 거부한 경우
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error")
  if (error) return backToLogin(error)

  if (!code) return backToLogin("코드가 없습니다")

  const supabase = await getSupabaseServer()
  if (!supabase) return backToLogin("로그인 설정이 없습니다")

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) return backToLogin(exchangeError.message)

  return NextResponse.redirect(new URL(next, url.origin))
}
