// app/counsel/page.tsx
// [목업] 상담소 — 캐릭터별 타로 상담가 목록. (사주아이의 수다방 구조 참고, 우리 톤으로)
import Link from "next/link"
import { User } from "lucide-react"
import { counselors, CREDIT_SYMBOL } from "@/lib/counselors"

export default function CounselListPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 상단 바: 타이틀 + 크레딧 + 마이페이지 */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <span className="font-serif text-xl italic text-foreground">상담소</span>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              {CREDIT_SYMBOL} 0
            </span>
            <Link
              href="/mypage"
              aria-label="마이페이지"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-5">
        {/* 무료 상담권 배너 */}
        <div className="mb-6 rounded-2xl border border-primary/30 bg-secondary/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">무료 상담권이 도착했어요 ✧</p>
              <p className="mt-0.5 text-xs text-muted-foreground">매일 밤 11시에 1장 자동 충전돼요</p>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-card px-4 py-2 shadow-sm">
              <span className="text-lg font-bold text-primary">1</span>
              <span className="text-[10px] text-muted-foreground">장 남음</span>
            </div>
          </div>
        </div>

        {/* 상담가 목록 */}
        <ul className="space-y-3">
          {counselors.map((c) => {
            const locked = c.status === "soon"
            const row = (
              <div
                className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 ${
                  locked ? "opacity-60" : "transition-colors hover:bg-secondary/40"
                }`}
              >
                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl ${c.accent}`}>
                  {c.emoji}
                  {locked && (
                    <span className="absolute -bottom-1 rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-medium text-background">
                      오픈예정
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg text-foreground">{c.name}</span>
                    <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-[10px] text-primary">
                      {c.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{c.greeting}</p>
                </div>
              </div>
            )
            return (
              <li key={c.id}>
                {locked ? row : <Link href={`/counsel/${c.id}`}>{row}</Link>}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
