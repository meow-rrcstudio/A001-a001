// components/legal.tsx
// 약관·개인정보처리방침·환불정책이 함께 쓰는 골격.
//
// ┌─ 왜 따로 빼는가 ──────────────────────────────────────────────────
// │ 법 문서 세 장은 서로 참조하고(약관 → 환불, 환불 → 약관), 같은 날짜
// │ 규칙을 쓰고, 같은 모양이어야 합니다. 각자 스타일을 들고 있으면
// │ 한 장만 손봤을 때 셋의 생김새가 조용히 어긋납니다.
// │
// │ 본문 글자색이 muted 인 것은 읽기 싫으라는 뜻이 아니라, 제목과
// │ 본문의 층을 나누기 위한 것입니다. 약관은 원래 길어서, 층이 없으면
// │ 찾고 싶은 조항으로 눈이 가지 못합니다.
// └──────────────────────────────────────────────────────────────────
import type { ReactNode } from "react"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"

/** 시행일 — 세 문서가 같은 날짜 표기를 쓰도록 한 곳에 둡니다 */
export function effectiveDate(date: string) {
  return `이 문서는 ${date}부터 적용됩니다. 내용이 바뀌면 시행 7일 전(이용자에게 불리한 변경은 30일 전)에 이 페이지에 공지합니다.`
}

const pClass = "text-[15px] leading-relaxed text-muted-foreground"

/** 문단 */
export function P({ children }: { children: ReactNode }) {
  return <p className={`mt-2 ${pClass}`}>{children}</p>
}

/** 번호 없는 목록 */
export function List({ children }: { children: ReactNode }) {
  return <ul className={`mt-3 list-disc space-y-2 pl-5 ${pClass}`}>{children}</ul>
}

/** 조·항 제목 */
export function H({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 font-serif text-xl font-semibold text-foreground">{children}</h2>
}

/**
 * 문서 한 장.
 *
 * lead 는 제목 바로 밑에 오는 한 문단입니다 — "이 문서가 무엇을 정하는지"를
 * 먼저 말해 두면, 조항을 다 읽지 않는 사람도 무엇을 놓쳤는지는 압니다.
 */
export function LegalPage({
  title,
  lead,
  children,
}: {
  title: string
  lead: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className={`mx-auto w-full max-w-site flex-1 px-5 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader backHref="/" />

        <h1 className="font-serif text-4xl leading-tight text-foreground">{title}</h1>
        <p className={`mt-4 ${pClass}`}>{lead}</p>

        <div className="pb-12">{children}</div>
      </main>

      <Footer variant="minimal" />
    </div>
  )
}
