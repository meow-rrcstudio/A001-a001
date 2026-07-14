// app/page.tsx
import Link from "next/link"
import { ArrowUpRight, Sparkle } from "lucide-react"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"

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
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Personal Archive
        </p>

        <h1 className="flex items-start gap-3 font-serif text-6xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          <span>
            Soul
            <br />
            Seoul
            <br />
            <span className="border-b-2 border-foreground/40">—Shanti</span>
          </span>
          <Sparkle className="mt-3 h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
        </h1>

        <p className="mt-8 max-w-md text-pretty leading-relaxed text-muted-foreground">
          타로를 중심으로 영화, 책, 신화, 천문학, 점성술, 명상 등을 기록하고 연결하는 개인
          아카이브입니다.
        </p>

        <nav className="mt-16 flex flex-col">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.active ? item.href : "#"}
              aria-disabled={!item.active}
              className={`group flex items-center justify-between border-t border-border py-5 last:border-b ${item.active ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                }`}
            >
              <span className="flex items-baseline gap-4">
                <span className="text-xs text-muted-foreground">{item.number}</span>
                <span className="font-serif text-4xl tracking-tight sm:text-5xl">{item.label}</span>
              </span>
              {item.active && (
                <ArrowUpRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              )}
            </Link>
          ))}
        </nav>
      </main>

      <Footer />
    </div>
  )
}