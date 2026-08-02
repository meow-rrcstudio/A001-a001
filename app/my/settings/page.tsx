// app/my/settings/page.tsx
// 설정 — 계정·앱 관리. 리딩 기록(마이 히스토리)과 분리된 화면입니다.
//
// 항목은 아래 배열에서만 관리하고, 행 모양은 components/ui/settings-list.tsx 가
// 담당합니다. 새 설정을 추가하려면 배열에 한 줄 넣으면 됩니다.
"use client"

import Link from "next/link"
import { LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { CREDIT_UNIT, countCredits } from "@/lib/credit-packs"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { SettingsGroup, type SettingsItem } from "@/components/ui/settings-list"
import { useAccount } from "@/lib/use-account"
import { useLoginHref } from "@/lib/login-href"
import {
  signOut,
} from "@/lib/reading-entitlement"

// ⚠️ "앱" 묶음을 통째로 뺐습니다. 안에 "연동" 한 줄뿐이었고 그마저
//    href="#" 이라 눌러도 아무 일이 없었습니다. 무엇과 연동한다는
//    말인지도 화면 어디에도 없었습니다.
//
//    앱을 실제로 내거나(권한·햅틱), 캘린더·노션 같은 붙일 곳이
//    생기면 그때 되살리세요.

export default function SettingsPage() {
  const router = useRouter()
  const { account: entitlement, ready } = useAccount()
  // 로그인을 마치면 이 화면으로 돌아옵니다 (lib/login-href.ts)
  const loginHref = useLoginHref()

  if (!ready) return <div className="min-h-screen bg-background" />

  if (!entitlement.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PageHeader backHref="/my" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="font-myeongjo text-2xl font-bold text-foreground">설정</h1>
          <p className="mt-4 text-sm text-muted-foreground">로그인 후에 볼 수 있어요.</p>
          <Button variant="solid" size="pill" className="mt-8" render={<Link href={loginHref} />}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            로그인하기
          </Button>
        </main>
        <Footer variant="lime" />
      </div>
    )
  }

  const accountItems: SettingsItem[] = [
    // 계정에 관한 일(로그인 수단 확인·회원탈퇴)이 이 안에 있습니다
    { label: "프로필", href: "/my/settings/profile" },
    {
      // 건별이라 "플랜"이 없습니다. 남은 개수를 그대로 보여줍니다.
      // 부르는 말은 lib/credit-packs.ts 한 곳에서 옵니다.
      label: `나의 ${CREDIT_UNIT.one}`,
      href: "/my/credits",
      value: `${countCredits(entitlement.credits)} 남음`,
      // 행은 "얼마 남았고 어디에 썼나"(내역)로, 배너는 "더 사기"(구매)로
      // 갈라집니다. 예전에는 둘 다 한 화면이라 사러 들어간 사람에게
      // 사용내역이, 내역을 보러 들어간 사람에게 가격표가 함께 나왔습니다.
      accent:
        entitlement.credits > 0
          ? { label: `${CREDIT_UNIT.one} 더 사기`, href: "/my/credits/buy" }
          : { label: `${CREDIT_UNIT.one} 사러 가기`, href: "/my/credits/buy" },
    },
    // 결제내역 — 환불정책 제5조가 "결제일을 함께 적어 주세요"라고
    // 요구하는데, 그 값을 볼 자리가 여기입니다.
    { label: "결제내역", href: "/my/credits/purchases" },
    // ⚠️ "알림"과 "연동"을 뺐습니다. 둘 다 href="#" 이라 눌러도 아무 일이
    //    없었습니다. 눌리지 않는 행은 "곧 될 것 같은데 안 되는" 자리라,
    //    없는 것보다 나쁩니다.
    //
    //    알림은 보낼 수단(메일·알림톡)이 생기면 그때 되살리세요. 그때는
    //    약관에도 "미리 알린다"를 함께 넣습니다 — 지금은 뺐습니다
    //    (lib/credit-rules.ts 주석 참고).
    //
    //    "개인정보"도 뺐습니다. 개인정보처리방침은 모든 화면 아래 푸터에
    //    이미 있어서, 여기 두면 같은 곳으로 가는 길이 둘이 됩니다.
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader backHref="/my" />
      <main className={`mx-auto w-full max-w-md flex-1 px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="pb-4 pt-2 font-myeongjo text-2xl font-bold text-foreground">설정</h1>

        <p className="rounded-xl bg-muted px-5 py-4 text-base font-semibold text-foreground">
          {entitlement.email ?? entitlement.displayName ?? "로그인됨"}
        </p>

        <SettingsGroup label="계정" items={accountItems} />

        {/* 로그아웃 — 설정 행과 같은 폭·같은 바탕의 버튼입니다.
            예전에는 밑줄 친 작은 글씨였는데, 목록 아래에 글씨만 떠 있어서
            "설정 항목이 하나 더 있나" 처럼 보였습니다. 목록에 끼워 넣지도
            않습니다 — 들어가는 길(›) 사이에 나가는 길이 섞이니까요. */}
        <button
          type="button"
          onClick={() => {
            void signOut()
            router.push("/")
            router.refresh()
          }}
          className="mt-8 w-full rounded-xl bg-muted py-4 text-center text-base font-semibold text-foreground transition-colors hover:bg-black/5"
        >
          로그아웃 하기
        </button>

        {/* ⚠️ 회원탈퇴는 여기 두지 않습니다. 프로필 안에 있습니다
               (/my/settings/profile). 로그아웃 바로 옆에 두면 나가는 길
               둘이 나란히 붙어 잘못 누르기 쉽고, "계정에 관한 일"은
               한자리에 모이는 편이 찾기 좋습니다. */}
      </main>

      <Footer variant="lime" />
    </div>
  )
}
