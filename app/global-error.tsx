// app/global-error.tsx
// 공용 레이아웃까지 넘어졌을 때 — 마지막 그물.
//
// ┌─ app/error.tsx 와 무엇이 다른가 ──────────────────────────────────
// │ error.tsx 는 "화면 하나"가 넘어졌을 때이고, 공용 레이아웃(app/layout.tsx)은
// │ 살아 있습니다. 여기는 그 레이아웃 자체가 넘어진 경우라, Next 가 레이아웃을
// │ 통째로 이 파일로 갈아끼웁니다. 그래서 <html>·<body> 를 직접 그려야 하고,
// │ globals.css 도 여기서 다시 불러와야 합니다 — 레이아웃이 없으니 아무도
// │ 대신 불러주지 않습니다.
// │
// │ 헤더는 달지 않습니다. 레이아웃이 넘어진 마당에 메뉴 서랍·최근 기록까지
// │ 끌어오면 그 코드가 또 넘어져서, 마지막 그물마저 빈 화면이 됩니다.
// │ 여기서는 돌 하나와 나갈 길만 둡니다.
// │
// │ ⚠️ 제목 글꼴(명조)은 next/font 변수 없이 시스템 명조로 떨어집니다.
// │    글꼴을 여기서 다시 불러오면 그것도 실패할 수 있는 고리가 하나 늘어서,
// │    globals.css 의 대체 글꼴에 맡깁니다 (--font-myeongjo).
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect } from "react"
import { ErrorScreen } from "@/components/error-screen"
import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko" className="bg-background">
      <body className="font-sans antialiased">
        <ErrorScreen
          title="화면을 여는 데 실패했어요"
          description={
            <>
              잠시 뒤에 다시 열어봐 주세요.
              <br />
              계속 이러면 아래 코드와 함께 알려주세요.
            </>
          }
          primary={{ label: "다시 시도", onClick: reset }}
          secondary={{ label: "홈으로 가기", href: "/" }}
          digest={error.digest}
        />
      </body>
    </html>
  )
}
