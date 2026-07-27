// app/api/health/env-1859/route.ts
//
// ⚠️ [임시] 환경변수가 배포에 잘 들어왔는지 눈으로 확인하려고 만든 경로입니다.
//    · /design-1859 처럼 "주소를 아는 사람만" 들어오는 방식입니다
//    · 값은 절대 돌려주지 않습니다. 들어왔는지와 길이만 봅니다.
//      길이를 보여주는 건 "붙여넣다 잘렸는지"를 알기 위해서입니다.
//    · 연결이 끝나면 이 파일을 지우세요
//
// JSON 이 아니라 글로 돌려줍니다. JSON 으로 주면 아이폰 사파리가 파일로
// 내려받아 버려서 한글이 깨집니다 (try-1859 와 같은 방식).
import { NextResponse } from "next/server"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env"
import { SUPABASE_SECRET_KEY } from "@/lib/supabase/server-env"

export const dynamic = "force-dynamic"

/** 값은 숨기고 "왔는지 + 얼마나 긴지"만 */
function line(label: string, value: string, note = "") {
  const mark = value ? "✅" : "❌"
  const len = value ? `${value.length}자` : "비어 있음"
  return `${mark} ${label.padEnd(34)} ${len}${note ? `  ${note}` : ""}`
}

export async function GET() {
  // 비밀 키에 NEXT_PUBLIC_ 을 잘못 붙이면 브라우저로 새어나갑니다.
  const leaking = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  )

  const publishableName = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      : "없음"

  const secretName = process.env.SUPABASE_SECRET_KEY
    ? "SUPABASE_SECRET_KEY"
    : process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "SUPABASE_SERVICE_ROLE_KEY"
      : "없음"

  const urlShape = SUPABASE_URL
    ? /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL)
      ? "주소 형식 맞음"
      : "⚠️ 주소 형식이 이상합니다"
    : ""

  const body = [
    "환경변수 확인 — 값은 보여주지 않습니다. 들어왔는지와 길이만 봅니다.",
    "",
    "── Supabase ──────────────────────────────────────────────",
    line("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL, urlShape),
    line("publishable key", SUPABASE_PUBLISHABLE_KEY, `(${publishableName})`),
    line("secret key", SUPABASE_SECRET_KEY, `(${secretName})`),
    "",
    leaking
      ? "🚨 비밀 키가 NEXT_PUBLIC_ 이름을 달고 있습니다. 브라우저로 새어나갑니다.\n" +
        "   당장 그 변수를 지우고, Supabase 에서 키를 새로 발급받으세요."
      : "✅ 비밀 키가 브라우저로 새지 않습니다.",
    "",
    "── 그 밖에 ───────────────────────────────────────────────",
    line("GEMINI_API_KEY", process.env.GEMINI_API_KEY ?? ""),
    "",
  ].join("\n")

  return new NextResponse(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  })
}
