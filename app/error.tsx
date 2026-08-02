// app/error.tsx
// 화면 하나가 넘어졌을 때.
//
// 언제 뜨나: 페이지를 그리다 예외가 났을 때 (데이터를 못 받아오거나,
// 없는 값을 읽거나). 공용 레이아웃은 살아 있으므로 헤더·메뉴는 그대로
// 쓸 수 있습니다. 레이아웃까지 넘어진 경우는 app/global-error.tsx 입니다.
//
// ⚠️ Next 규칙상 이 파일은 반드시 클라이언트 컴포넌트여야 합니다
//    (reset 을 눌러 다시 그려보려면 브라우저 쪽 코드가 필요합니다).
"use client"

import { useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { ErrorScreen } from "@/components/error-screen"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 원문은 여기(콘솔)와 서버 로그에만 남깁니다.
    // 화면에는 digest 만 흐리게 답니다 — components/error-screen.tsx 참고.
    console.error(error)
  }, [error])

  return (
    <ErrorScreen
      header={<PageHeader variant="minimal" backHref="/" />}
      title="잠깐 길이 막혔어요"
      description={
        <>
          화면을 그리다 문제가 생겼어요.
          <br />
          한 번 더 해보면 지나갈 때가 많아요.
        </>
      }
      // 다시 그려보기가 먼저입니다 — 대개 한 번에 지나갑니다.
      primary={{ label: "다시 시도", onClick: reset }}
      secondary={{ label: "홈으로 가기", href: "/" }}
      digest={error.digest}
    />
  )
}
