// app/counsel/[id]/page.tsx
// [목업] 캐릭터별 타로 채팅 상담. (사주아이 채팅 구조 참고 — 질문 칩/진행바/추천질문/입력창)
// 아직 실제 AI 연동 전이라, 화면 구성만 보여주는 데모입니다.
"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, Mic, Send } from "lucide-react"
import { getCounselor, CREDIT_SYMBOL } from "@/lib/counselors"

const QUESTION_OPTIONS = [
  { emoji: "💞", label: "배우자가 있어" },
  { emoji: "💗", label: "만나는 사람이 있어" },
  { emoji: "✨", label: "마음 가는 사람이 있어" },
  { emoji: "🌙", label: "지금은 혼자야" },
]

const SUGGESTED = [
  "나 올해 하반기엔 좀 풀리는 거 맞지?",
  "지금 썸 타는 이 사람이랑 이어지는 인연인 거 확실해?",
]

export default function CounselChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const counselor = getCounselor(id)
  const [picked, setPicked] = useState<string | null>(null)

  if (!counselor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        상담가를 찾을 수 없어요.
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-2.5">
          <button onClick={() => router.back()} aria-label="뒤로" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${counselor.accent}`}>
            {counselor.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base leading-tight text-foreground">{counselor.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{counselor.badge}</p>
          </div>
          <Link href="/counsel" aria-label="닫기" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </Link>
        </div>
        {/* 크레딧 줄 */}
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 pb-2 text-[11px]">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-primary">무료 1/1</span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">남은 대화 0회</span>
          <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 font-medium text-primary">
            {CREDIT_SYMBOL} 0
          </span>
        </div>
      </header>

      {/* 대화 영역 */}
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-5">
        {/* 상담가 인사 */}
        <div className="flex gap-2">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${counselor.accent}`}>
            {counselor.emoji}
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
            {counselor.greeting}
          </div>
        </div>

        {/* 질문 카드 (진행바 + 선택지) */}
        <div className="flex gap-2">
          <div className="w-8 shrink-0" />
          <div className="w-full max-w-[92%] rounded-2xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[8%] rounded-full bg-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground">8%</span>
            </div>
            <p className="mb-3 text-sm text-foreground">
              몇 개만 묻자. 알아야 제대로 봐주지. <b>연애부터. 지금 옆에 누구 있어?</b>
            </p>
            <div className="space-y-2">
              {QUESTION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setPicked(opt.label)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    picked === opt.label
                      ? "border-primary bg-secondary/60 text-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span className="flex-1">{opt.label}</span>
                  <span className="text-muted-foreground/50">›</span>
                </button>
              ))}
              <button className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 text-left text-sm text-muted-foreground">
                🔒 비밀이야
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
              답변 횟수를 쓰지 않아요 · 언제든 다시 고를 수 있어요
            </p>
          </div>
        </div>
      </main>

      {/* 추천 질문 + 입력창 */}
      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <input
              placeholder="질문을 입력하세요"
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
            <button aria-label="보내기" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
