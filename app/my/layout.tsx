// app/my/layout.tsx
// MY 아래 화면들(기록·설정·별조각·결제 확인)을 검색엔진에서 통째로 뺍니다.
//
// ┌─ 왜 빼는가 ───────────────────────────────────────────────────────
// │ 로그인해야 내용이 보이는 화면입니다. 구글이 로그인하지 않은 채로
// │ 들어오면 "로그인하세요" 한 줄만 있는 빈 페이지를 보게 됩니다.
// │ 그런 빈 페이지가 여러 장 색인되면 사이트 전체의 품질 평가가
// │ 내려갑니다 — 정작 읽히길 바라는 글이 밀립니다.
// │
// │ robots.txt 에도 같은 경로를 막아 두었지만(app/robots.txt/route.ts),
// │ robots.txt 는 "긁지 마라"일 뿐 "결과에 띄우지 마라"가 아닙니다.
// │ 색인에서 확실히 빼려면 페이지 자체의 noindex 가 있어야 합니다.
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return children
}
