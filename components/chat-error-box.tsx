// components/chat-error-box.tsx
// 막혔을 때 보여주는 상자. 해석과 대화가 같은 것을 씁니다.
//
// ⚠️ 여기에 날오류를 찍지 않습니다. 예전에는 서버가 준 문장을 그대로
//    내보냈고, 그래서 제미나이의 영어 JSON 이 화면에 고스란히 떴습니다 —
//    읽는 사람에게는 무슨 일인지도, 무엇을 하면 되는지도 알 수 없는
//    글자이고, 우리 쪽 사정(모델·한도)까지 드러납니다.
//    원문은 브라우저 콘솔과 서버 로그에 있습니다.
//
// 말과 "다음에 무엇을 하면 되는지"는 lib/chat-errors.ts 한 곳에서 옵니다.
// 문장을 여기에 새로 쓰지 마세요.
"use client"

import Link from "next/link"
import { RefreshCw } from "lucide-react"
import type { ChatErrorInfo } from "@/lib/chat-errors"

export function ChatErrorBox({
  info,
  onRetry,
  busy = false,
  className = "",
}: {
  info: ChatErrorInfo
  /** 다시 해보는 방법. 없으면 다시 하기 버튼을 내지 않습니다 */
  onRetry?: () => void
  busy?: boolean
  className?: string
}) {
  // 다시 해도 같은 벽에 부딪히는 일에는 버튼을 내지 않습니다.
  // (하루 몫을 다 쓴 경우에 "다시 물어보기"를 내주면 두 번 실망합니다)
  const showRetry = info.canRetry && !!onRetry

  return (
    <div className={`rounded-xl border border-border bg-muted px-4 py-4 ${className}`}>
      <p className="text-reading leading-relaxed text-foreground">{info.message}</p>
      {info.hint && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{info.hint}</p>
      )}

      {(showRetry || info.action) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {showRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              다시 물어보기
            </button>
          )}
          {info.action && (
            <Link
              href={info.action.href}
              className="inline-flex items-center rounded-full bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-raised transition-colors hover:bg-muted"
            >
              {info.action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
