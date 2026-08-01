// app/tarot/ask/layout.tsx
// 타로보기 화면의 제목·설명만 담당하는 껍데기입니다.
//
// page.tsx 가 "use client" 라서 그 파일에서는 metadata 를 내보낼 수 없습니다
// (metadata 는 서버에서만 읽힙니다). 그래서 한 겹 위 layout 에 둡니다.
// 화면은 아무것도 감싸지 않고 그대로 통과시킵니다.
import type { Metadata } from "next"
import { canonicalPath } from "@/lib/seo"

export const metadata: Metadata = {
  title: "무료 타로 리딩 — 지금 카드 뽑기",
  description:
    "묻고 싶은 것을 고르면 카드를 뽑고 해석까지 바로 볼 수 있습니다. 연애·일·마음, 무엇이든 물어보세요.",
  alternates: { canonical: canonicalPath("/tarot/ask") },
  openGraph: {
    title: "무료 타로 리딩 — 지금 카드 뽑기",
    description: "묻고 싶은 것을 고르면 카드를 뽑고 해석까지 바로 볼 수 있습니다.",
    url: canonicalPath("/tarot/ask"),
  },
}

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children
}
