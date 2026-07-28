import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Nanum_Myeongjo, Shadows_Into_Light } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// 손글씨(캘리그라피) — 시안 지정 글꼴. 영문 강조에만 씁니다.
// 본문·제목용 SF Pro 는 애플 시스템 글꼴이라 여기서 불러오지 않고
// app/globals.css 의 --font-sans 에서 시스템 글꼴로 지정합니다.
// 카테고리 제목용 명조체 — 홈 카드와 아카이빙 배너 제목에만 씁니다
const myeongjo = Nanum_Myeongjo({
  variable: '--font-nanum',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const shadows = Shadows_Into_Light({
  variable: '--font-shadows',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://soulseoul.xyz'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Soul Seoul — Shānti',
    template: '%s | Soul Seoul',
  },
  description: '타로를 중심으로 명상, 요가, 신화, 점성술을 기록하고 연결하는 개인 아카이브',
  generator: 'v0.app',
  // 검색엔진 소유 확인 코드 (구글 서치콘솔 / 네이버 서치어드바이저)
  verification: {
    google: 'r3J5oHD2mNXTpaYCIVVqMflSE5pY5KLQ92FoKYcMvkU',
    other: { 'naver-site-verification': '35a3abd98e941de07a67600ae926ed54ff3cd1ae' },
  },
  // 링크 공유 시 미리보기 카드 기본값 — 커버 이미지 없는 페이지는 이 이미지가 나갑니다
  openGraph: {
    siteName: 'Soul Seoul',
    type: 'website',
    // ?v=2 : 이미지를 바꿀 때 숫자를 올리면 카톡 등이 캐시를 버리고 새로 가져갑니다
    images: [{ url: '/og-image.png?v=2', width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f1e8',
  // ⚠️ 키보드가 올라올 때 화면(레이아웃 뷰포트)을 함께 줄여달라는 뜻입니다.
  //    이게 없으면 화면 크기는 그대로인 채 키보드가 그 위를 덮어서,
  //    "화면 맨 아래"에 붙인 입력창이 키보드 뒤로 숨습니다.
  //    아직 이 값을 안 듣는 브라우저가 있어 lib/use-keyboard-inset.ts 가
  //    같은 일을 한 번 더 합니다 (둘이 겹쳐도 어긋나지 않습니다).
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} ${shadows.variable} ${myeongjo.variable} bg-background`}
    >
      {/* 배경은 페이지마다 components/page-background.tsx 로 선택합니다 */}
      <body className="relative font-sans antialiased">
        {/* app-shell: 메뉴(서랍)를 열면 이 상자가 왼쪽으로 밀립니다.
            서랍은 이 상자보다 "뒤"에 있어서, 밀린 자리로 드러납니다.
            (움직이는 코드는 components/site-menu.tsx) */}
        <div id="app-shell" className="relative z-10 min-h-screen bg-background">
          {children}
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* 구글 애드센스 — 사이트 소유 확인 + 광고 스크립트 (모든 페이지 공통).
            일반 <script> 태그로 써야 서버가 만드는 원본 HTML의 <head>에 바로 실려서
            구글 소유권 검사기가 찾을 수 있습니다 (React가 async 스크립트를 head로 올려줌).
            게시자 ID를 바꿀 일이 있으면 아래 client= 값과 public/ads.txt를 함께 수정하세요. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5017410876251301"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}