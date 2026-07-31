// app/my/credits/fail/page.tsx
// 결제창에서 실패하거나 창을 닫았을 때 토스가 보내오는 자리(failUrl).
//
// useSearchParams 는 Suspense 안에 있어야 합니다 (success 쪽과 같은 이유).
import { Suspense } from "react"
import { FailView } from "./fail-view"

export const metadata = { title: "결제 실패" }

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-lime" />}>
      <FailView />
    </Suspense>
  )
}
