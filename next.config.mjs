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
    ]
  },
}

export default nextConfig