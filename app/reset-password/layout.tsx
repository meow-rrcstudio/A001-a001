// app/reset-password/layout.tsx
// 비밀번호 재설정 화면을 검색결과에서 뺍니다.
// page.tsx 가 "use client" 라 그 파일에서는 metadata 를 내보낼 수 없어
// 한 겹 위 layout 에 둡니다. 화면은 그대로 통과시킵니다.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
