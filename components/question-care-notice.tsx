// components/question-care-notice.tsx
// 조심해서 다뤄야 하는 물음일 때, 카드를 뽑기 전에 내미는 상자.
//
// ┌─ 왜 화면에 내미는가 ──────────────────────────────────────────────
// │ 프롬프트에 "위험하면 응급기관을 안내하라"고 적어두는 것만으로는
// │ 모자랍니다. 모델이 그 말을 할지 안 할지는 그때그때 다르고, 번호를
// │ 지어낼 수도 있습니다. 사람 목숨이 걸린 자리에서 "아마 말하겠지"에
// │ 기댈 수는 없습니다. 그래서 우리가 직접, 카드보다 먼저 내밉니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 거절 상자가 아닙니다. 타로는 그대로 이어집니다 — 다만 무엇을 보는
//    자리인지를 샨티의 말로 먼저 일러줍니다 (lib/question-safety.ts).
"use client"

import { useState } from "react"
import type { QuestionAudit } from "@/lib/question-safety"
import { useAppsInToss } from "@/lib/use-runtime"

export function QuestionCareNotice({
  audit,
  className = "",
}: {
  audit?: QuestionAudit | null
  className?: string
}) {
  // ⚠️ 웹뷰(앱인토스 미니앱) 안에서는 tel: 이 막힐 수 있습니다. 막히면
  //    눌러도 아무 일이 일어나지 않는데, 하필 이 자리는 사람 목숨이 걸린
  //    곳입니다. 그래서 미니앱에서는 "전화 걸기" 대신 번호를 복사할 수
  //    있게 내밉니다 — 눌렀는데 아무 일도 안 나는 것보다 낫습니다.
  const inToss = useAppsInToss()
  const [copied, setCopied] = useState<string | null>(null)

  if (!audit || audit.level === "normal" || !audit.notice) return null

  const urgent = audit.level === "crisis"

  async function copyTel(tel: string) {
    try {
      await navigator.clipboard.writeText(tel)
      setCopied(tel)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // 복사도 막힌 환경입니다. 번호는 화면에 그대로 보이므로 눈으로
      // 읽어 걸 수 있습니다 — 아무 말도 하지 않는 것보다 낫습니다.
      setCopied(null)
    }
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 ${
        urgent ? "border-primary/40 bg-primary/10" : "border-border bg-muted"
      } ${className}`}
    >
      <p className="text-sm leading-relaxed text-foreground">{audit.notice}</p>

      {/* 위기일 때만. 번호는 우리가 적어둔 것이고 모델이 만지지 않습니다 */}
      {audit.resources && audit.resources.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {audit.resources.map((resource) => (
            <li key={resource.tel} className="flex items-center gap-2 text-sm">
              {inToss ? (
                <button
                  type="button"
                  onClick={() => void copyTel(resource.tel)}
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  {resource.label} {resource.tel}
                  {copied === resource.tel ? " (복사했다냥)" : ""}
                </button>
              ) : (
                <a
                  href={`tel:${resource.tel.replace(/-/g, "")}`}
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  {resource.label} {resource.tel}
                </a>
              )}
              <span className="text-xs text-muted-foreground">{resource.note}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 거절 대신 권함 — 이렇게 물으면 카드가 더 잘 답한다는 안내입니다 */}
      {audit.suggestion && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          이렇게 물어도 좋다냥 — “{audit.suggestion}”
        </p>
      )}
    </div>
  )
}
