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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  // 로그인 뒤 돌아갈 곳. 없으면 MY 로 보냅니다.
  const next = url.searchParams.get("next") ?? "/my"

  // 사용자가 창을 닫거나 승인을 거부한 경우
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error")
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, url.origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=코드가+없습니다", url.origin))
  }

  const supabase = await getSupabaseServer()
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=로그인+설정이+없습니다", url.origin))
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, url.origin)
    )
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
