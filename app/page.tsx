// app/page.tsx
import { Sparkle } from "lucide-react"
import { Footer } from "@/components/footer"
import { MenuList } from "@/components/menu-list"
import { PageBackground } from "@/components/page-background"
import { AdFit } from "@/components/adfit"

// 홈 메뉴의 내용(번호·이름·주소)은 여기서 수정합니다.
// 메뉴의 생김새(글자 크기·간격·색)는 components/menu-list.tsx에서 수정합니다.
const menuItems = [
  { number: "01", label: "Tarot", href: "/tarot", active: true },
  { number: "02", label: "Meditation", href: "#", active: false },
  { number: "03", label: "Yoga", href: "#", active: false },
  { number: "04", label: "Astrology", href: "/tarot/astrology", active: true },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 홈은 웜톤 오로라 배경 */}
      <PageBackground variant="aurora" />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20 sm:px-8">
        {/* 시안의 상단 이탤릭 라벨 */}
        {/*
        <p className="mb-4 font-serif text-sl italic text-primary "> A Personal Archive of Meaning </p>
        <p className="mb-4 text-Seeking Meaning font-medium uppercase tracking-[0.01em] text-muted-foreground">
        Connecting Symbols Across Time
        </p>
        */}
        <h1 className="flex items-start gap-3 font-serif text-6xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          <span>
            Soul
            <br />
            Seoul
            <br />
            <span className="border-b-2 border-primary/60">—Shanti</span>
          </span>
          <Sparkle className="mt-3 h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
        </h1>

        <p className="mt-8 max-w-md text-pretty leading-relaxed text-muted-foreground">
          타로를 중심으로 영화, 책, 신화, 천문학, 점성술, 명상 등을 기록하고 연결하는 개인
          아카이브입니다.
        </p>

        <div className="mt-16">
          <MenuList items={menuItems} />
        </div>
      </main>

      {/* 광고(카카오 애드핏) — 푸터 위 가운데. 노출할 광고가 없으면 높이 0으로 접힘 */}
      <div className="relative z-10 mx-auto flex w-full max-w-2xl justify-center px-6 pb-6">
        <AdFit adUnit="DAN-lbLAE5kPgKDh1dxL" width={320} height={50} className="mx-auto" />
      </div>

      {/* 홈은 시안(Site design.pdf) 기준 라이트 푸터 */}
      <Footer variant="light" />
    </div>
  )
}
