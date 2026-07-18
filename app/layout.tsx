import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
// gemini 수정: 잘못된 import 제거 및 실제 사용할 Instrument_Serif import 추가
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// 제목(heading)에 사용할 세리프 폰트
// 'main'이라는 변수명으로 고정하여, 나중에 폰트가 바뀌어도 운영 코드를 수정할 필요가 없도록 설정
// gemini 수정: 라이브러리 함수 이름 수정 및 타입 오류 방지를 위한 옵션(weight, display) 추가
const main = Instrument_Serif({ 
  variable: '--font-main', 
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Soul Seoul — Shānti',
    template: '%s | Soul Seoul',
  },
  description: '타로를 중심으로 명상, 요가, 신화, 점성술을 기록하고 연결하는 개인 아카이브',
  generator: 'v0.app',
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${main.variable} bg-background`}
    >
      {/* 배경은 페이지마다 components/page-background.tsx 로 선택합니다 */}
      <body className="relative font-sans antialiased">
        {children}
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