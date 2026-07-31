// components/free-reading-nudge.tsx
// 무료로 카드를 뽑은 뒤, 프롬프트 아래에 붙는 다음 걸음 안내.
//
// 이 자리에 오기까지 샨티가 이미 한 판을 읽어줬습니다
// (components/free-reading-preview.tsx). 그래서 권하는 말의 근거가
// "안 해준 것"이 아니라 "해준 것과 무엇이 다른가"입니다 — 맛보기를 보고
// 나서 더 깊은 것을 권하는 편이, 아무것도 안 보여주고 권하는 것보다 낫습니다.
//
// ┌─ 말이 갈립니다 ───────────────────────────────────────────────────
// │ 로그인 전  — "가입하면 더 깊이 읽어주고, 기록으로도 남습니다"
// │              지금 기록은 이 기기에만 있고 지우면 사라집니다.
// │              그 사실도 함께 말합니다.
// │ 로그인 후  — 가입은 이미 했으니 권할 것은 크레딧뿐입니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 겁주지 않습니다. "지금 가입 안 하면 사라집니다" 같은 말은 쓰지 않습니다.
//    무료로 한 번 보고 만족한 사람도 손님입니다. 사실만 담담히 적고,
//    누르고 싶으면 누르게 둡니다.
"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CREDIT_UNIT } from "@/lib/credit-packs"

export function FreeReadingNudge({
  isLoggedIn,
  /** 방금 남긴 기록 id — 있으면 "기록에서 보기"를 함께 띄웁니다 */
  savedId,
  /** 기록이 서버에 남았는지 (브라우저에만 남았으면 그 사실을 알려줍니다) */
  onServer = false,
}: {
  isLoggedIn: boolean
  savedId?: string | null
  onServer?: boolean
}) {
  const pill =
    "flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
  const quiet =
    "mt-2 block text-center text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"

  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-raised">
      {isLoggedIn ? (
        <>
          <p className="text-reading leading-relaxed text-foreground">
            여기까지가 맛보기라네. {CREDIT_UNIT.one}을 쓰면 이 몸이 더 오래 들여다보고, 궁금한
            걸 이어서 물을 수도 있다냥.
          </p>
          <Link href="/my/credits" className={`${pill} mt-3`}>
            {CREDIT_UNIT.one}으로 샨티에게 직접 듣기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <>
          <p className="text-reading leading-relaxed text-foreground">
            방금 읽어준 건 맛보기라네. 가입하면 이 몸이 더 오래 들여다본 해석을 받고, 궁금한
            걸 이어서 물을 수도 있다냥. 뽑은 카드도 기록으로 남는다네 — 지금은 이 기기에만
            담아뒀어.
          </p>
          <Link href="/login?next=/my" className={`${pill} mt-3`}>
            기록으로 남기기 (가입)
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      )}

      {savedId && (
        <Link href={`/my/${savedId}`} className={quiet}>
          방금 본 타로점 다시 보기
        </Link>
      )}

      {savedId && !onServer && (
        <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
          이 기록은 지금 이 기기에만 있어요.
        </p>
      )}
    </div>
  )
}
