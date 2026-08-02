// app/login/page.tsx
// 로그인 화면 — 시안(login-page) 기준 라임 전체화면입니다.
//
// 로그인 방식은 세 가지입니다 (시안 기준).
//   · 카카오 — 연동 (국내 사용자 대부분이 이걸 씁니다. 그래서 맨 위)
//   · 구글   — 연동
//   · 이메일 — 직접 가입
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 배경색     : bg-brand-lime (globals.css --brand-lime)
// │ · 버튼 배경  : bg-brand-ink (검정에 가까운 #333)
// │ · 버튼 높이  : h-13 (52px — 시안 실측)
// │ · 그림 크기  : max-h-[340px] — 남는 세로 안에서만 큽니다
// │
// │ ⚠️ 이 화면에는 사이트 공용 푸터를 달지 않습니다. 시안에서 뺐습니다 —
// │    로그인은 "고르고 끝"인 화면이라 아래에 링크가 늘어서면 눈이
// │    갈 곳이 늘어납니다. 약관·개인정보 링크는 동의 고지 한 줄이
// │    대신합니다 (components/login-form.tsx 의 Consent).
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Stone } from "@/components/stone"
import { HEADER_SPACE } from "@/lib/layout"
import { LoginForm } from "@/components/login-form"
import { translateAuthError } from "@/lib/auth-messages"

export const metadata: Metadata = {
  title: "로그인",
  // 로그인 화면은 검색 결과에 뜰 이유가 없습니다
  robots: { index: false, follow: false },
}

/**
 * 카카오·구글에서 돌아오다 실패하면 /auth/callback 이
 * /login?error=... 로 되돌려 보냅니다.
 *
 * ⚠️ 그 error 를 읽는 곳이 여기 말고는 없습니다. 예전에는 아무도 읽지
 *    않아서, 승인을 취소하거나 설정이 어긋난 사람에게는 로그인 화면이
 *    그냥 한 번 더 뜰 뿐이었습니다. 무엇이 잘못됐는지도, 다시 눌러야
 *    하는지도 알 수 없는 화면이었습니다.
 *
 * 사유는 영어로 오므로 lib/auth-messages.ts 를 거쳐 우리말로 바꿉니다
 * (못 알아본 것은 한 줄로 감싸고 원문은 콘솔에만 남습니다).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; debug?: string }>
}) {
  const { error, next, debug } = await searchParams
  const notice = error ? translateAuthError(error) : undefined

  // 실패해서 되돌아온 사람이 다시 로그인하면 가려던 자리로 갑니다.
  // 바깥으로 나가는 주소는 받지 않습니다 (app/auth/callback 의 safeNext 와 같은 이유).
  //
  // 가려던 곳을 모르면 홈입니다. 예전 기본값은 MY(기록 목록)였는데,
  // 홈에서 그냥 로그인한 사람까지 기록 목록에 내려놓았습니다.
  const backTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"

  return (
    <div className="flex min-h-screen flex-col bg-brand-lime text-brand-ink">
      {/* 뒤로 + 가운데 워드마크 + 더보기 (시안).
          로그인은 막다른 길이면 안 됩니다 — 항상 나갈 구멍을 둡니다.
          surface="lime": 이 화면은 배경이 이미 라임이라, 연라임 중간색을 뺀
          스크림을 씁니다. 크림용을 그대로 깔면 위쪽에만 연라임 띠가 얹혀
          이상한 그라데이션 자국이 생깁니다. */}
      <PageHeader backHref="/" surface="lime" centerMark />

      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 ${HEADER_SPACE}`}>
        <h1 className="sr-only">SoulSeoul 로그인</h1>

        {/* 마스코트 돌 (components/stone.tsx).
            배경이 없는 벡터라 라임 위에 그대로 얹힙니다.

            남는 세로를 이 칸이 다 가져가고 돌은 그 안에서 가운데에 섭니다.
            그래서 버튼은 늘 화면 아래에 붙고, 키보드가 올라오면 이 칸만
            줄어듭니다 — 시안 2~5번의 움직임이 이것입니다.

            ⚠️ 예전 UFO·고양이 그림은 세로로 길어서
               남는 자리를 가득 채웠습니다. 돌은 가로로 넓고 작아, 시안대로
               가운데에 작게 떠 있는 것이 맞습니다. 빈자리를 메우려고 크기를
               키우지 마세요 — 키보드가 올라올 때 도로 밀립니다. */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          <Stone className="h-12 shrink-0 text-brand-ink" />
        </div>

        {/* 카카오·구글은 연동, 이메일은 직접 가입입니다.
            동의 고지도 이 안에 있습니다 (모든 단계에서 보여야 해서). */}
        <LoginForm next={backTo} notice={notice} debug={debug === "1"} />
      </main>
    </div>
  )
}
