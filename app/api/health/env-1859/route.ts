// app/api/health/env-1859/route.ts
//
// ⚠️ [임시] 환경변수가 배포에 잘 들어왔는지 눈으로 확인하려고 만든 경로입니다.
//    · /design-1859 처럼 "주소를 아는 사람만" 들어오는 방식입니다
//    · 값은 절대 돌려주지 않습니다. 들어왔는지(true/false)와 길이만 봅니다.
//      길이를 보여주는 건 "붙여넣다 잘렸는지"를 알기 위해서입니다.
//    · 연결이 끝나면 이 파일을 지우세요
import { NextResponse } from "next/server"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env"
import { SUPABASE_SECRET_KEY } from "@/lib/supabase/server-env"

export const dynamic = "force-dynamic"

/** 값은 숨기고 "왔는지 + 얼마나 긴지"만 */
function report(value: string) {
  return { 들어옴: Boolean(value), 길이: value.length }
}

export async function GET() {
  return NextResponse.json({
    안내: "값은 보여주지 않습니다. 들어왔는지와 길이만 봅니다.",
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: {
        ...report(SUPABASE_URL),
        // 주소는 비밀이 아니라 형태만 확인해 줍니다 (오타 잡기 좋습니다)
        생김새: SUPABASE_URL ? SUPABASE_URL.replace(/\/\/([^.]{4})[^.]*/, "//$1***") : "",
        형식맞음: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL),
      },
      publishable_key: {
        ...report(SUPABASE_PUBLISHABLE_KEY),
        // 어느 이름으로 넣었는지 (둘 다 받습니다)
        쓴이름: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
          : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
            : "없음",
      },
      secret_key: {
        ...report(SUPABASE_SECRET_KEY),
        쓴이름: process.env.SUPABASE_SECRET_KEY
          ? "SUPABASE_SECRET_KEY"
          : process.env.SUPABASE_SERVICE_ROLE_KEY
            ? "SUPABASE_SERVICE_ROLE_KEY"
            : "없음",
        // 이게 true 면 큰일입니다 — 비밀 키가 브라우저로 나가는 이름을
        // 달고 있다는 뜻입니다. 즉시 지우고 Supabase 에서 새로 발급하세요.
        "⚠️브라우저로_새는중": Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
        ),
      },
    },
    기존: {
      GEMINI_API_KEY: report(process.env.GEMINI_API_KEY ?? ""),
    },
  })
}
