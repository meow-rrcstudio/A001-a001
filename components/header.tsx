// components/header.tsx
// 블로그 상단에 고정으로 표시되는 헤더입니다.
import Link from "next/link"
import { Sparkle } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight">
          <Sparkle className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Soul Seoul</span>
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-6 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                홈
              </Link>
            </li>
            <li>
              <Link href="/tarot" className="transition-colors hover:text-foreground">
                Tarot
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
