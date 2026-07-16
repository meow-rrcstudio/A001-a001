// components/ai-summary-box.tsx
import { Sparkles } from "lucide-react"
import type { AISummaryResult } from "@/lib/ai-summary"

export function AISummaryBox({ summary }: { summary: AISummaryResult }) {
  return (
    <div className="mb-8 rounded-xl border border-border bg-white/70 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          <Sparkles className="h-3 w-3" />
          AI 요약
        </span>
      </div>

      {summary.status === "ok" && (
        <ul className="ml-1 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
          {summary.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}

      {summary.status === "quota" && (
        <p className="text-sm text-muted-foreground">
          요청이 많아 잠시 쉬어가는 중이에요. 보통 몇 분 안에, 늦어도 자정에는 다시 이용하실 수 있어요.
        </p>
      )}

      {summary.status === "unavailable" && (
        <p className="text-sm text-muted-foreground">AI 요약을 준비 중이에요. 곧 만나보실 수 있어요.</p>
      )}
    </div>
  )
}