// components/menu-list.tsx
// 홈 화면의 큰 메뉴 리스트(01 Tarot, 02 Meditation ...) 공용 컴포넌트입니다.
// 홈(app/page.tsx)과 스타일가이드(/design-1859)가 같은 이 컴포넌트를 쓰므로,
// 여기서 고치면 두 곳 모두 동시에 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ 아래 className 안의 값을 바꾸면 됩니다. (숫자 1칸 = 4px)
// │
// │ · 항목 위아래 여백  : py-5        → py-4로 줄이면 촘촘, py-6이면 여유
// │ · 메뉴 글자 크기    : text-4xl    → 모바일 크기 (3xl=30px, 4xl=36px, 5xl=48px)
// │                      sm:text-5xl → PC 크기
// │ · 번호(01) 글자     : text-xs     → 크기 12px / text-primary → 포인트색
// │ · 번호와 글자 간격  : gap-4       → 16px
// │ · 구분선 색         : border-border (globals.css의 --border 변수)
// │ · 비활성 항목 흐림  : opacity-40  → 40% 불투명 (숫자 낮을수록 더 흐림)
// │ · 화살표 아이콘 크기: h-6 w-6     → 24px
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export interface MenuItem {
  number: string // 왼쪽에 작게 표시되는 번호 (예: "01")
  label: string //  메뉴 이름 (예: "Tarot")
  href: string //   이동할 주소 (예: "/tarot")
  active: boolean // false면 흐리게 표시되고 클릭해도 이동하지 않음
}

export function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <nav className="flex flex-col">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.active ? item.href : "#"}
          aria-disabled={!item.active}
          className={`group flex items-center justify-between border-t border-border py-5 last:border-b ${item.active ? "cursor-pointer" : "cursor-not-allowed opacity-40"
            }`}
        >
          <span className="flex items-baseline gap-4">
            <span className="text-xs text-primary">{item.number}</span>
            <span className="font-serif text-4xl italic tracking-tight sm:text-5xl">{item.label}</span>
          </span>
          {item.active && (
            <ArrowUpRight className="h-6 w-6 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </Link>
      ))}
    </nav>
  )
}
