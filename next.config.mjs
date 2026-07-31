/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  // 주소 이전 — 검색엔진에 "영구 이동(301)"으로 알려서 기존 검색 순위를 넘겨받습니다.
  // permanent: true 는 브라우저가 캐시하므로, 임시 실험이면 false 로 두세요.
  async redirects() {
    return [
      // 카드 아카이브가 /archive 로 통합되었습니다 (구 이름이 내용과 맞지 않았음)
      { source: "/tarot/astrology", destination: "/archive", permanent: true },

      // 타로보기 진입점이 /tarot/ask 한 곳으로 합쳐졌습니다.
      //
      // ⚠️ 주소만 지우면 안 됩니다. 배포 직전에 열어둔 탭은 옛 화면(옛 링크)을
      //    들고 있는데 서버에는 그 주소가 없어서, 메뉴의 "타로보기"를 누르면
      //    404 가 뜹니다 — 실제로 그랬습니다. 지인들이 들고 있는 링크와
      //    북마크도 같습니다. 넘겨주면 둘 다 조용히 새 화면으로 갑니다.
      { source: "/tarot/reading", destination: "/tarot/ask", permanent: true },
      // 주제까지 고른 주소는 그 주제가 골라진 채로 넘깁니다
      { source: "/tarot/reading/:topic", destination: "/tarot/ask?topic=:topic", permanent: true },
      // 질문까지 고른 주소는 주제만 살립니다 (질문은 칩으로 다시 고릅니다)
      {
        source: "/tarot/reading/:topic/:question",
        destination: "/tarot/ask?topic=:topic",
        permanent: true,
      },
    ]
  },
}

export default nextConfig