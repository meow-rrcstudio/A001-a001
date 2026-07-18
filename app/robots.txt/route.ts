// app/robots.txt/route.ts
// robots.txt 를 동적으로 생성하는 라우트 핸들러입니다. ("/robots.txt" 로 접근)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz"

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
