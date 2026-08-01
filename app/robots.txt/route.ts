// app/robots.txt/route.ts
// robots.txt 를 동적으로 생성하는 라우트 핸들러입니다. ("/robots.txt" 로 접근)
//
// ┌─ 무엇을 막고 무엇을 여는가 ───────────────────────────────────────
// │ 열어 둘 것 : 읽을거리(홈·타로·아카이브·글·소개·약관)
// │ 막을 것    : 로그인해야 보이는 화면, 기계용 주소(API), 검색 결과 화면
// │
// │ 왜 막는가 — 구글이 하루에 우리 사이트를 훑는 양(크롤 예산)은 정해져
// │ 있습니다. 로그인 화면과 API 를 훑는 데 그 양을 쓰면, 정작 새로 올린
// │ 글이 늦게 발견됩니다. 읽힐 페이지 쪽으로 몰아줍니다.
// │
// │ ⚠️ robots.txt 는 "긁지 마라"이지 "검색결과에 띄우지 마라"가 아닙니다.
// │    확실히 빼야 하는 화면은 페이지에도 noindex 를 답니다
// │    (app/my/layout.tsx, app/login/page.tsx 참고).
// └──────────────────────────────────────────────────────────────────
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz").replace(/\/+$/, "")

// 검색엔진이 훑을 이유가 없는 경로들
const DISALLOW = [
  "/api/", // 기계용 주소 — 사람이 읽을 화면이 아닙니다
  "/auth/", // 로그인 연동이 거쳐 가는 자리
  "/my/", // 기록·설정·별조각 — 로그인해야 보입니다
  "/login",
  "/reset-password",
  "/search", // 검색 결과 화면 (내용은 전부 다른 페이지에 이미 있습니다)
  "/design-1859", // 비공개 스타일가이드
  "/*?from=", // 글 상세의 꼬리표 주소 — 같은 글의 중복 주소입니다
]

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    ...DISALLOW.map((path) => `Disallow: ${path}`),
    "",
    // AI 검색(ChatGPT·Perplexity 등)이 우리 글을 인용할 수 있게 열어 둡니다.
    // 인용에 사이트 이름과 링크가 함께 나가므로 유입 통로가 됩니다.
    // 학습에 쓰이는 것이 싫다면 아래 Allow 를 Disallow 로 바꾸세요.
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    "",
  ].join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      // 하루 캐시 — robots.txt 는 자주 바뀌지 않습니다
      "Cache-Control": "public, max-age=86400",
    },
  })
}
