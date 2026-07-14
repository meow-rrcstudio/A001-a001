// app/page.tsx
import { Sparkle } from "lucide-react"
import { Footer } from "@/components/footer"
import { MenuList } from "@/components/menu-list"

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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20 sm:px-8">
        {/* 시안의 상단 이탤릭 라벨 */}
        <p className="mb-2 font-serif text-sm italic text-primary">The 12th Annual</p>
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Personal Archive
        </p>

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

      <Footer />
    </div>
  )
}
