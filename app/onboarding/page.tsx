// app/onboarding/page.tsx
// 샨티를 깨우는 화면 (/onboarding).
//
// 검색에 잡힐 화면이 아닙니다 — 답을 고르는 자리라 볼 글이 없고, 검색으로
// 여기에 바로 떨어지면 앞뒤 없이 키워드만 보게 됩니다. 그래서 색인을
// 막습니다 (/design-1859 와 같은 이유입니다).
import type { Metadata } from "next"
import { OnboardingFlow } from "@/components/onboarding-flow"

export const metadata: Metadata = {
  title: "샨티 깨우기",
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return <OnboardingFlow />
}
