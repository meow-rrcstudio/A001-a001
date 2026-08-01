import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Nanum_Myeongjo, Shadows_Into_Light } from 'next/font/google'
import { BASE_URL } from '@/lib/seo'
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

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'SoulSeoul — 소울서울, 타로와 명상 아카이브',
    template: '%s | SoulSeoul',
  },
  description: '타로를 중심으로 명상, 요가, 신화, 점성술을 기록하고 연결하는 개인 아카이브',
  generator: 'v0.app',
  // 사람이 실제로 검색창에 치는 말들. 순위를 직접 올려주지는 않지만
  // 네이버·다음 등 일부 검색엔진이 아직 참고합니다.
  keywords: ['타로', '타로카드', '무료 타로', '타로 해석', '소울서울', 'SoulSeoul', '명상', '점성술'],
  applicationName: 'SoulSeoul',
  // ⚠️ 여기(공용 layout)에 alternates.canonical 을 넣지 않습니다.
  //    넣으면 모든 하위 페이지가 "내 진짜 주소는 홈"이라고 말하게 되어
  //    글이 통째로 색인에서 빠집니다. canonical 은 페이지마다 따로 답니다.
  alternates: {
    types: { 'application/rss+xml': `${BASE_URL}/rss.xml` },
  },
  // 검색결과 미리보기를 넉넉히 허용합니다. 기본값은 엔진 재량이라
  // 글의 첫 문단이나 카드 그림이 잘려 나갈 수 있습니다.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  // 검색엔진 소유 확인 코드 (구글 서치콘솔 / 네이버 서치어드바이저)
  verification: {
    google: 'r3J5oHD2mNXTpaYCIVVqMflSE5pY5KLQ92FoKYcMvkU',
    other: { 'naver-site-verification': '35a3abd98e941de07a67600ae926ed54ff3cd1ae' },
  },
  // 링크 공유 시 미리보기 카드 기본값 — 커버 이미지 없는 페이지는 이 이미지가 나갑니다
  openGraph: {
    siteName: 'SoulSeoul',
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
  // ⚠️ interactiveWidget: "resizes-content" 를 넣지 않습니다.
  //    키보드가 올라올 때 화면을 줄여주는 값인데, lib/use-keyboard-inset.ts
  //    가 이미 같은 일을 합니다. 둘을 함께 켜면 화면도 줄고 입력창도
  //    올라가서 두 번 올라갑니다 — 입력창이 키보드에서 한참 떠 버립니다.
  //    올리는 일은 한 곳에서만 합니다.
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