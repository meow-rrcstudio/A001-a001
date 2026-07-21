// app/mypage/page.tsx
// [목업] 마이페이지 — 프로필 · 크레딧(별) · 충전 · 결제내역 · 보관함 등.
// (사주아이 마이페이지 구조 참고, 우리 톤으로. 아직 실제 로그인/결제 연동 전)
import Link from "next/link"
import {
  X,
  HelpCircle,
  Receipt,
  Archive,
  Gift,
  Ticket,
  LogOut,
  ChevronRight,
  Send,
} from "lucide-react"
import { CREDIT_NAME, CREDIT_SYMBOL } from "@/lib/counselors"

const MENU = [
  { icon: HelpCircle, label: "문의하기", accent: true },
  { icon: Receipt, label: "결제 내역" },
  { icon: Archive, label: "보관함" },
  { icon: Gift, label: "선물하기" },
  { icon: Ticket, label: "쿠폰 등록하기" },
]

export default function MyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-primary px-5 py-4">
        <span className="text-lg font-semibold text-primary-foreground">마이페이지</span>
        <Link href="/counsel" aria-label="닫기" className="text-primary-foreground">
          <X className="h-5 w-5" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-5">
        {/* 로그인 정보 */}
        <p className="text-sm font-medium text-foreground">Google 이메일로 로그인했습니다.</p>
        <p className="text-xs text-muted-foreground">aree.korea@gmail.com</p>

        {/* 대표 프로필 */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-primary">★ 대표 프로필</p>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">
              야
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                야르 <span className="text-xs text-muted-foreground">본인</span>
              </p>
              <p className="text-xs text-muted-foreground">1999-09-09</p>
            </div>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">변경</button>
          </div>
        </div>

        {/* 크레딧(별) 잔액 + 충전 */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-primary">{CREDIT_SYMBOL}</span> 내 {CREDIT_NAME}
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              0<Send className="h-3.5 w-3.5 text-primary" />
            </span>
          </div>
        </div>
        <Link
          href="/mypage/charge"
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {CREDIT_NAME} 충전하기
        </Link>

        {/* 메뉴 */}
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {MENU.map((m) => (
            <button
              key={m.label}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/40"
            >
              <m.icon className={`h-4 w-4 ${m.accent ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`flex-1 text-sm ${m.accent ? "font-medium text-primary" : "text-foreground"}`}>
                {m.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>

        {/* 로그아웃 · 탈퇴 */}
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-foreground">
            <LogOut className="h-4 w-4 text-muted-foreground" /> 로그아웃
          </button>
          <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-muted-foreground/70">
            <X className="h-4 w-4" /> 회원 탈퇴
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-3 text-xs text-muted-foreground/70">
          <Link href="/about" className="underline underline-offset-2">회사 소개</Link>
          <span>·</span>
          <Link href="/privacy" className="underline underline-offset-2">개인정보 처리방침</Link>
        </div>
      </main>
    </div>
  )
}
