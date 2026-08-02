// components/error-screen.tsx
// [단일 진실 소스] 막다른 화면 — 404 · 오류 · 앱 전체가 넘어졌을 때.
//
// ┌─ 왜 한 곳에 모으는가 ─────────────────────────────────────────────
// │ 에러 화면은 Next 규칙상 파일이 셋으로 갈립니다.
// │   app/not-found.tsx    없는 주소
// │   app/error.tsx        화면 하나가 넘어졌을 때
// │   app/global-error.tsx 공용 레이아웃까지 넘어졌을 때
// │ 셋이 각자 화면을 그리면, 돌 크기·문장 말투·버튼 모양이 조금씩
// │ 어긋난 채로 남습니다 — 게다가 사람이 가장 당황한 순간에 보는
// │ 화면들이라, 어긋난 것이 그대로 "고장난 느낌"으로 읽힙니다.
// │ 그래서 그림·간격·버튼은 여기 한 곳에서만 정합니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 돌 가이드 (디자인시스템 "돌" 절과 같은 규칙) ─────────────────────
// │ · 돌은 이 화면의 주인공입니다 — 높이 80px (로그인의 51px 보다 큽니다.
// │   로그인은 버튼이 주인공이고, 여기는 돌이 유일한 그림입니다)
// │ · 높이만 주고 가로는 w-auto — 그림 비율(75:51)대로 따라옵니다
// │ · 색은 text-foreground — 검정 부분이 글자색을 따라갑니다
// │ · 눈은 깜빡입니다(BlinkingStone). 멈춰 있는 돌은 "화면도 멈췄다"로
// │   읽힙니다. 움직임 최소화를 켠 기기에서는 저절로 뜬 채로 있습니다
// │ · 돌 위에 표정·말풍선·이모지를 얹지 않습니다. 미안한 얼굴을 그리면
// │   사람 잘못처럼 보입니다 — 그냥 같이 서 있게 둡니다
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 여기에 날오류(서버가 준 영어 문장)를 찍지 않습니다.
//    components/chat-error-box.tsx 와 같은 이유입니다 — 읽는 사람에게는
//    알 수 없는 글자이고, 우리 쪽 사정이 그대로 드러납니다. 원문은 서버
//    로그와 브라우저 콘솔에 있습니다. 화면에는 digest(우리가 로그에서
//    찾아낼 수 있는 짧은 표식)만 흐리게 답니다.
import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlinkingStone } from "@/components/blinking-stone"
import { HEADER_SPACE } from "@/lib/layout"

/** 돌 높이 — 디자인시스템 "돌" 절의 "막다른 화면" 크기와 같은 값입니다 */
const STONE_HEIGHT = "h-20"

export interface ErrorScreenAction {
  label: string
  /** 안쪽 주소로 보냅니다 */
  href?: string
  /** 제자리에서 다시 해봅니다 (다시 시도) */
  onClick?: () => void
}

export function ErrorScreen({
  /** 큰 글씨 한 줄. 무슨 일이 났는지를 사람 말로 */
  title,
  /** 그 아래 한두 줄. 지금 무엇을 하면 되는지 */
  description,
  /** 주요 버튼(검정 알약) */
  primary,
  /** 보조 버튼(테두리 알약). 없으면 그리지 않습니다 */
  secondary,
  /** 서버 로그에서 이 일을 찾아낼 수 있는 짧은 표식 */
  digest,
  /** 화면 맨 위(헤더 자리)에 넣을 것. 넘겨주지 않으면 비웁니다 */
  header,
}: {
  title: string
  description: ReactNode
  primary: ErrorScreenAction
  secondary?: ErrorScreenAction
  digest?: string
  header?: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {header}

      {/* 세로 가운데 정렬 — 막다른 화면은 내용이 짧아서, 위에 붙여두면
          아래가 휑하게 비어 "덜 그려진 화면"으로 보입니다.
          헤더는 떠 있으므로(고정) 위쪽은 HEADER_SPACE 만큼 비웁니다 —
          비워야 가운데가 헤더를 뺀 나머지의 가운데가 됩니다. */}
      <main
        className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pb-20 ${HEADER_SPACE}`}
      >
        <ErrorScreenBody
          title={title}
          description={description}
          primary={primary}
          secondary={secondary}
          digest={digest}
          headingLevel="h1"
        />
      </main>
    </div>
  )
}

/**
 * 화면 속 알맹이 — 돌 · 문장 · 버튼.
 *
 * ⚠️ 껍데기(ErrorScreen)와 나눠 둔 이유는 디자인시스템 때문입니다.
 *    ErrorScreen 은 min-h-screen 이라 스타일가이드의 상자 안에 넣을 수
 *    없어서, 예전 같으면 견본을 손으로 한 벌 더 그렸을 자리입니다.
 *    그러면 실제 404 를 고쳐도 견본은 옛 모양으로 남습니다.
 *    알맹이를 이렇게 떼어두면 스타일가이드가 진짜를 그대로 보여줍니다.
 */
export function ErrorScreenBody({
  title,
  description,
  primary,
  secondary,
  digest,
  /** 스타일가이드 안에서는 h1 이 이미 있으므로 p 로 낮춰 그립니다 */
  headingLevel = "h1",
}: {
  title: string
  description: ReactNode
  primary: ErrorScreenAction
  secondary?: ErrorScreenAction
  digest?: string
  headingLevel?: "h1" | "p"
}) {
  const Heading = headingLevel

  return (
    <div className="flex flex-col items-center text-center">
      <BlinkingStone className={`${STONE_HEIGHT} w-auto shrink-0 text-foreground`} title="돌" />

      <Heading className="mt-8 font-myeongjo text-2xl font-bold text-foreground">{title}</Heading>
      <div className="mt-3 max-w-xs text-pretty leading-relaxed text-muted-foreground">
        {description}
      </div>

      {/* 막다른 화면에는 나갈 길을 반드시 둡니다.
          "없어요"만 적어두면 뒤로가기 말고는 갈 데가 없습니다. */}
      <div className="mt-8 flex flex-col items-center gap-2.5">
        <ActionButton action={primary} variant="solid" />
        {secondary && <ActionButton action={secondary} variant="hollow" />}
      </div>

      {digest && (
        // 문의를 받을 때 이 표식으로 서버 로그를 찾습니다.
        // 사람에게는 읽을 것이 아니므로 가장 흐린 단계로 둡니다.
        <p className="mt-10 font-mono text-[11px] text-muted-foreground/60">오류 코드 {digest}</p>
      )}
    </div>
  )
}

/** href 면 링크로, onClick 이면 버튼으로 — 부르는 쪽이 고르지 않게 합니다 */
function ActionButton({
  action,
  variant,
}: {
  action: ErrorScreenAction
  variant: "solid" | "hollow"
}) {
  if (action.href) {
    return (
      <Button
        variant={variant}
        size="pill"
        className="w-[220px]"
        render={<Link href={action.href} />}
      >
        {action.label}
      </Button>
    )
  }
  return (
    <Button variant={variant} size="pill" className="w-[220px]" onClick={action.onClick}>
      {action.label}
    </Button>
  )
}
