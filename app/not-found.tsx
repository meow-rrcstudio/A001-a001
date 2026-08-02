// app/not-found.tsx
// 없는 주소 (404).
//
// 언제 뜨나: 지워진 글, 오타 난 주소, 오래된 링크를 타고 들어왔을 때.
// 그리고 페이지 코드에서 notFound() 를 부를 때도 여기로 옵니다.
//
// ┌─ 왜 홈으로 튕기지 않는가 ─────────────────────────────────────────
// │ 없는 주소를 홈으로 보내버리면 사람은 "내가 뭘 잘못 눌렀나"만 남고,
// │ 검색엔진은 없는 글을 계속 살아있는 것으로 봅니다. 404 는 404 로
// │ 답해야 색인에서 빠집니다.
// └──────────────────────────────────────────────────────────────────
//
// 그림·간격·버튼 모양은 components/error-screen.tsx 한 곳에서 옵니다
// (디자인시스템의 "돌" 절 참고). 여기서는 문장과 갈 곳만 정합니다.
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { ErrorScreen } from "@/components/error-screen"

export const metadata: Metadata = {
  title: "찾는 페이지가 없어요",
  // 없는 주소가 검색 결과에 뜰 이유는 없습니다
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <ErrorScreen
      // 뒤로가기만 있는 헤더 — 여기까지 온 사람에게 필요한 건 나갈 길뿐입니다.
      // ⋯(더보기)를 달면 없는 페이지 위에서 메뉴 서랍이 열립니다.
      header={<PageHeader variant="minimal" backHref="/" />}
      // 해달 — 물 위에 누워 떠 있는 모습이라 "떠내려왔다"가 그림 하나로
      // 읽힙니다. 오류 화면(app/error.tsx)은 돌입니다.
      character="otter"
      title="찾는 페이지가 없어요"
      description={
        <>
          주소가 바뀌었거나, 지워진 글일 수 있어요.
          <br />
          아래 길로 돌아가 주세요.
        </>
      }
      primary={{ label: "홈으로 가기", href: "/" }}
      secondary={{ label: "아카이빙 둘러보기", href: "/archive" }}
    />
  )
}
