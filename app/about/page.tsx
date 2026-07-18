// app/about/page.tsx
// about(About) 페이지 — 사이트가 어떤 곳인지 알려주는 페이지입니다.
// 애드센스 심사와 방문자 신뢰에 도움이 됩니다.
// 아래 본문 문구는 자유롭게 직접 수정하세요.
import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "about",
  description:
    "Soul Seoul은 타로를 중심으로 명상, 요가, 신화, 점성술을 기록하고 연결하는 개인 아카이브입니다.",
}

const pClass = "text-[15px] leading-relaxed text-muted-foreground"
const h2Class = "mt-10 font-serif text-xl font-semibold text-foreground"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 sm:px-8 sm:pt-10">
        <PageHeader backHref="/" className="mb-8" />

        {/* 페이지 제목 — 세리프 이탤릭 + 테라코타 애스터리스크 */}
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-5xl italic leading-tight text-foreground">About─</h1>
          <span aria-hidden="true" className="shrink-0 font-serif text-5xl leading-none text-primary">
            ✳
          </span>
        </div>

        <p className={`mt-6 ${pClass}`}>
          Soul Seoul은 서울(Seoul)과 영혼(Soul)을 겹쳐 지은 이름입니다. 타로를 중심으로 명상,
          요가, 신화, 점성술을 기록하고 연결하는 개인적인 아카이브이자, 그 기록을 나누는
          공간입니다.
        </p>

        <h2 className={h2Class}>이곳에서 만날 수 있는 것</h2>
        <ul className={`mt-2 list-disc space-y-2 pl-5 ${pClass}`}>
          <li>
            <strong className="text-foreground">카드 아카이브</strong> — 유니버설 웨이트를
            비롯한 여러 덱의 카드를 한 장씩 해석해 기록합니다. 카드의 상징, 정방향과 역방향의
            의미, 일상에 적용하는 방법을 함께 담습니다.
          </li>
          <li>
            <strong className="text-foreground">카드 리딩</strong> — 질문을 고르고 직접 카드를
            섞고 뽑아보는 리딩 체험을 제공합니다. 연애, 일, 선택의 갈림길 같은 고민에 맞춘
            여러 스프레드를 준비했습니다.
          </li>
          <li>
            <strong className="text-foreground">기록</strong> — 명상과 요가, 신화와 점성술에
            대한 단상을 천천히 쌓아갑니다.
          </li>
        </ul>

        <h2 className={h2Class}>운영자, Shānti</h2>
        <p className={`mt-2 ${pClass}`}>
          Shānti(샨티)는 산스크리트어로 &lsquo;평온&rsquo;을 뜻합니다. 카드와 상징의 언어를
          빌려 마음을 들여다보는 일을 좋아하며, 그 과정에서 얻은 것들을 이곳에 기록합니다.
          타로는 미래를 단정하는 도구가 아니라 스스로에게 질문을 건네는 거울이라고 믿습니다.
        </p>

        <h2 className={h2Class}>문의</h2>
        <p className={`mt-2 mb-12 ${pClass}`}>
          제안이나 문의는 aree.korea@gmail.com 으로 보내주세요.
        </p>
      </main>

      <Footer variant="minimal" />
    </div>
  )
}
