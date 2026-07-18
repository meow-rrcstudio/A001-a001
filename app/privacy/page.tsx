// app/privacy/page.tsx
// privacy statement — 애드센스 등 광고 심사에 필요한 필수 안내 페이지입니다.
// 내용을 고치고 싶으면 아래 본문 텍스트를 직접 수정하면 됩니다.
import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "privacy statement",
  description: "Soul Seoul의 privacy statement입니다.",
}

// 본문 단락 공통 스타일
const pClass = "text-[15px] leading-relaxed text-muted-foreground"
const h2Class = "mt-10 font-serif text-xl font-semibold text-foreground"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 sm:px-8 sm:pt-10">
        <PageHeader backHref="/" className="mb-8" />

        <h1 className="font-serif text-4xl italic leading-tight text-foreground">
          privacy statement
        </h1>
        <p className={`mt-4 ${pClass}`}>
          Soul Seoul(soulseoul.xyz, 이하 &ldquo;본 사이트&rdquo;)은 타로·명상·점성술을 기록하는
          개인 아카이브 블로그입니다. 본 사이트는 방문자의 개인정보를 소중히 여기며, 관련 법령을
          준수합니다. 이 문서는 본 사이트가 어떤 정보를 수집하고 어떻게 이용하는지 안내합니다.
        </p>

        <h2 className={h2Class}>1. 직접 수집하는 개인정보</h2>
        <p className={`mt-2 ${pClass}`}>
          본 사이트는 회원가입, 로그인, 댓글 기능을 제공하지 않으며, 방문자의 이름·이메일·연락처
          등의 개인정보를 직접 수집하지 않습니다.
        </p>

        <h2 className={h2Class}>2. 자동으로 수집되는 정보</h2>
        <p className={`mt-2 ${pClass}`}>
          사이트 운영을 위해 방문 통계 도구(Vercel Analytics)가 페이지 방문 수 등의 익명화된 통계
          정보를 수집할 수 있습니다. 이 정보는 개인을 식별할 수 없는 형태로 처리되며, 사이트 개선
          목적으로만 사용됩니다.
        </p>

        <h2 className={h2Class}>3. 광고와 쿠키</h2>
        <p className={`mt-2 ${pClass}`}>
          본 사이트는 Google AdSense, Kakao AdFit 등 제3자 광고 서비스를 이용할 수 있습니다. 광고
          제공 과정에서 이들 광고 사업자는 쿠키(cookie)를 사용하여 방문 기록에 기반한 맞춤형
          광고를 표시할 수 있습니다.
        </p>
        <ul className={`mt-3 list-disc space-y-2 pl-5 ${pClass}`}>
          <li>
            Google을 비롯한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록에 따라
            광고를 게재합니다.
          </li>
          <li>
            이용자는{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Google 광고 설정
            </a>
            에서 맞춤형 광고를 비활성화할 수 있습니다.
          </li>
          <li>
            브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 이 경우 일부 기능
            이용에 제한이 있을 수 있습니다.
          </li>
        </ul>

        <h2 className={h2Class}>4. 개인정보의 제3자 제공</h2>
        <p className={`mt-2 ${pClass}`}>
          본 사이트는 방문자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 위 광고·통계
          서비스가 쿠키를 통해 수집하는 정보는 각 사업자의 privacy statement을 따릅니다.
        </p>

        <h2 className={h2Class}>5. 문의</h2>
        <p className={`mt-2 ${pClass}`}>
          개인정보 관련 문의는 아래 이메일로 연락해 주세요.
          <br />
          이메일: aree.korea@gmail.com
        </p>

        <h2 className={h2Class}>6. 고지</h2>
        <p className={`mt-2 mb-12 ${pClass}`}>
          이 방침은 2026년 7월 18일부터 적용됩니다. 내용이 변경되는 경우 이 페이지를 통해
          공지합니다.
        </p>
      </main>

      <Footer variant="minimal" />
    </div>
  )
}
