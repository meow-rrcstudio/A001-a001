// app/mypage/charge/page.tsx
// [목업] 별 충전하기 — 크레딧 패키지 선택 + 결제하기. (사주아이 가격표 참고, 우리 톤으로)
// 아직 실제 결제(PG) 연동 전 데모입니다. 결제 버튼을 눌러도 결제되지 않습니다.
"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { CREDIT_NAME, CREDIT_SYMBOL } from "@/lib/counselors"

const PACKAGES = [
  { id: "taste", name: "한 걸음", desc: `${CREDIT_NAME} 1개`, price: 990, best: false },
  { id: "step", name: "동행", desc: `${CREDIT_NAME} 3개 + 1개 보너스`, price: 2970, best: false },
  { id: "regular", name: "단골", desc: `${CREDIT_NAME} 5개 + 2개 보너스`, price: 4950, best: false },
  { id: "deep", name: "깊은 인연", desc: `${CREDIT_NAME} 10개 + 3개 보너스`, price: 9900, best: true },
]

export default function ChargePage() {
  const [selected, setSelected] = useState("taste")
  const pkg = PACKAGES.find((p) => p.id === selected)!

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-primary px-5 py-4">
        <span className="text-lg font-semibold text-primary-foreground">{CREDIT_NAME} 충전하기</span>
        <Link href="/mypage" aria-label="닫기" className="text-primary-foreground">
          <X className="h-5 w-5" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-5">
        {/* 안내 배너 */}
        <div className="mb-5 rounded-2xl border border-border bg-secondary/50 p-5 text-center">
          <p className="font-serif text-2xl italic text-foreground">
            {CREDIT_SYMBOL} 1{CREDIT_NAME} = 990원
          </p>
          <p className="mt-1 text-xs text-muted-foreground">한 번의 상담이 1{CREDIT_NAME}이에요</p>
        </div>

        {/* 패키지 목록 */}
        <div className="space-y-2.5">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                selected === p.id ? "border-primary bg-secondary/50" : "border-border bg-card hover:bg-secondary/30"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  {p.best && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                      BEST
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-primary">{p.desc}</p>
              </div>
              <span className="text-base font-bold text-foreground">{p.price.toLocaleString()}원</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          * 지금은 결제 연동 전 미리보기예요. 실제 결제는 되지 않아요.
        </p>
      </main>

      {/* 결제 버튼 */}
      <footer className="sticky bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <button className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
          {pkg.name} · {pkg.price.toLocaleString()}원 결제하기
        </button>
      </footer>
    </div>
  )
}
