// app/my/credits/success/page.tsx
// 토스가 결제창을 닫고 되돌려 보내는 자리(successUrl).
//
// ⚠️ 승인은 화면이 청합니다(confirm-view.tsx). 여기서 서버가 바로 승인하지
//    않는 이유는, 토스가 이 주소를 GET 으로 열기 때문입니다 — 링크를 미리
//    긁어가는 것들에도 그대로 열립니다. 돈이 나가는 일은 사람이 실제로
//    화면을 연 뒤에 일어나야 합니다.
//
// useSearchParams 는 Suspense 안에 있어야 합니다. 없으면 빌드가
// "이 페이지는 미리 만들 수 없다"고 멈춥니다.
import { Suspense } from "react"
import { ConfirmView } from "./confirm-view"

export const metadata = { title: "결제 확인" }

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-lime" />}>
      <ConfirmView />
    </Suspense>
  )
}
