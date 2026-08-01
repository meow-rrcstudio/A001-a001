// app/privacy/page.tsx
// 개인정보처리방침.
//
// ┌─ 왜 통째로 다시 썼는가 ───────────────────────────────────────────
// │ 이전 판은 "회원가입·로그인·댓글 기능을 제공하지 않으며 개인정보를
// │ 직접 수집하지 않습니다"라고 적혀 있었습니다. 광고 심사용으로 쓸
// │ 때에는 맞는 말이었지만, 그 뒤로 로그인·크레딧·리딩 기록이 생겼고
// │ 결제까지 붙게 됩니다. 사실과 다른 방침은 없는 것보다 나쁩니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 고칠 때 ─────────────────────────────────────────────────────────
// │ · 새 외부 서비스를 붙였다면 제5조(위탁)와 제6조(국외 이전)에
// │   반드시 한 줄 추가하세요. 이 두 조는 "빠뜨리면 위법"인 항목입니다.
// │ · 수집 항목이 늘면 제2조. 보관 기간이 바뀌면 제4조.
// │ · 사업자·책임자 정보는 lib/business.ts 에서 옵니다.
// │ · 방침을 바꾸면 시행일(EFFECTIVE)을 올리고 7일 전에 공지합니다.
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import { canonicalPath } from "@/lib/seo"
import type { ReactNode } from "react"
import Link from "next/link"
import { H, LegalPage, List, P, effectiveDate } from "@/components/legal"
import { BUSINESS } from "@/lib/business"
import { CREDIT_UNIT } from "@/lib/credit-packs"

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "SoulSeoul이 어떤 정보를 수집하고 어떻게 다루는지 안내합니다.",  alternates: { canonical: canonicalPath("/privacy") },
}

const EFFECTIVE = "2026년 8월 6일"

const linkClass = "text-primary underline underline-offset-4"

/** 바깥 링크 — 위탁받는 회사의 방침으로 보냅니다 */
function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export default function PrivacyPage() {
  const unit = CREDIT_UNIT.one

  return (
    <LegalPage
      title="개인정보처리방침"
      lead={
        <>
          SoulSeoul(soulseoul.xyz, 이하 &ldquo;서비스&rdquo;)은 타로 리딩과 기록을 제공합니다. 이
          방침은 서비스가 어떤 정보를 받아 무엇에 쓰고 언제 지우는지, 그리고 이용자가 무엇을 요구할
          수 있는지를 밝힙니다.
        </>
      }
    >
      <H>제1조 (한눈에)</H>
      <List>
        <li>회원가입을 하지 않고 글을 읽기만 한다면, 받아 두는 개인정보는 없습니다.</li>
        <li>
          가입하면 이메일과 표시할 이름을 받습니다. 리딩을 하면 질문과 해석이 회원의 기록으로
          남습니다.
        </li>
        <li>
          <strong className="text-foreground">
            타로 질문에 적은 내용은 해석을 만들기 위해 국외의 인공지능 제공사로 전송됩니다.
          </strong>{" "}
          자세한 것은 제6조에 있습니다.
        </li>
        <li>탈퇴하면 계정과 리딩 기록은 지웁니다. 법이 남기라고 정한 결제 기록만 남습니다.</li>
      </List>

      <H>제2조 (수집하는 개인정보)</H>
      <P>회원가입과 서비스 이용 과정에서 다음을 받습니다.</P>
      <List>
        <li>
          <strong className="text-foreground">가입</strong> — 이메일 주소, 비밀번호(암호화되어
          저장되며 회사는 원래 값을 알 수 없습니다), 표시할 이름. 카카오·구글로 가입하면 그 계정이
          알려주는 닉네임(카카오)과 이름·이메일(구글)을 받습니다.
        </li>
        <li>
          <strong className="text-foreground">서비스 이용</strong> — 타로 질문, 뽑은 카드, 해석
          결과, 샨티와 나눈 대화, 해석에 남긴 평가.
        </li>
        <li>
          <strong className="text-foreground">{unit}</strong> — 적립·사용 내역과 그 사유.
        </li>
        <li>
          <strong className="text-foreground">결제</strong> — 주문번호, 결제 금액, 결제수단 종류,
          결제 승인 정보.{" "}
          <strong className="text-foreground">
            카드번호·계좌번호는 결제대행사가 처리하며 회사는 받지도, 저장하지도 않습니다.
          </strong>
        </li>
        <li>
          <strong className="text-foreground">자동으로 쌓이는 것</strong> — 접속 일시, 브라우저
          종류, 페이지 방문 통계, 쿠키.
        </li>
      </List>
      <P>
        회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 사상·신념, 건강, 성생활 등
        민감정보는 요구하지 않으며, 이용자가 질문에 스스로 적지 않는 한 다루지 않습니다.
      </P>

      <H>제3조 (이용 목적)</H>
      <List>
        <li>회원 확인과 로그인 유지</li>
        <li>타로 해석 제공, 이어서 묻기, 지난 기록 다시 보기</li>
        <li>{unit} 적립·차감과 잔액 확인</li>
        <li>결제 처리, 청약철회·환불, 거래 기록 보관</li>
        <li>서비스 장애 확인, 부정 이용(자동 반복 요청 등) 차단</li>
        <li>해석 품질 개선. 이때 누가 물었는지는 보지 않습니다.</li>
      </List>

      <H>제4조 (보관 기간)</H>
      <List>
        <li>
          <strong className="text-foreground">회원 정보·리딩 기록</strong> — 탈퇴할 때까지. 탈퇴하면
          지체 없이 파기합니다.
        </li>
        <li>
          <strong className="text-foreground">계약·청약철회 기록</strong> — 5년 (전자상거래법)
        </li>
        <li>
          <strong className="text-foreground">대금 결제·재화 공급 기록</strong> — 5년
          (전자상거래법)
        </li>
        <li>
          <strong className="text-foreground">소비자 불만·분쟁 처리 기록</strong> — 3년
          (전자상거래법)
        </li>
        <li>
          <strong className="text-foreground">접속 기록</strong> — 3개월 (통신비밀보호법)
        </li>
      </List>
      <P>
        기간이 지난 정보는 복구할 수 없는 방법으로 지웁니다. 종이로 출력된 것이 있다면 파쇄합니다.
      </P>

      <H>제5조 (처리 위탁)</H>
      <P>서비스를 굴리기 위해 아래 회사에 일부 처리를 맡깁니다.</P>
      <List>
        <li>
          <Out href="https://supabase.com/privacy">Supabase</Out> — 회원 인증, 데이터 보관
        </li>
        <li>
          <Out href="https://vercel.com/legal/privacy-policy">Vercel</Out> — 사이트 호스팅, 방문
          통계
        </li>
        <li>
          <Out href="https://openai.com/policies/privacy-policy/">OpenAI</Out> — 타로 해석과 대화
          생성
        </li>
        <li>
          <Out href="https://policies.google.com/privacy">Google</Out> — 일부 해석·요약 생성(Gemini),
          광고(AdSense)
        </li>
        <li>
          <Out href="https://upstash.com/trust/privacy.pdf">Upstash</Out> — 임시 저장(캐시), 요청
          횟수 제한
        </li>
        <li>
          <Out href="https://www.tosspayments.com/policy/privacy">토스페이먼츠</Out> — 결제 처리와
          결제 수단 인증
        </li>
        <li>
          <Out href="https://www.kakao.com/policy/privacy">카카오</Out> — 로그인, 광고(AdFit)
        </li>
      </List>
      <P>
        위탁 계약에는 개인정보를 목적 밖으로 쓰지 못하게 하는 조항을 두고 있으며, 위탁받는 회사가
        바뀌면 이 방침을 고쳐 알립니다.
      </P>

      <H>제6조 (국외 이전)</H>
      <P>
        위 회사 가운데 토스페이먼츠·카카오를 뺀 나머지는 서버가 국외에 있습니다. 아래 정보가
        국외로 전송됩니다.
      </P>
      <List>
        <li>
          <strong className="text-foreground">이전받는 자</strong> — Supabase Inc., Vercel Inc.,
          OpenAI, L.L.C., Google LLC, Upstash, Inc.
        </li>
        <li>
          <strong className="text-foreground">이전 국가</strong> — 미국 등 각 사가 운영하는 데이터
          센터 소재국
        </li>
        <li>
          <strong className="text-foreground">이전 일시와 방법</strong> — 서비스를 이용하는 그때,
          암호화된 통신망을 통해 전송
        </li>
        <li>
          <strong className="text-foreground">이전 항목</strong> — 계정 식별자, 이메일, 표시할 이름,
          타로 질문과 대화 내용, 접속 기록
        </li>
        <li>
          <strong className="text-foreground">이전 목적</strong> — 회원 인증, 데이터 보관, 해석
          생성, 사이트 제공
        </li>
        <li>
          <strong className="text-foreground">보유 기간</strong> — 제4조의 기간과 같습니다
        </li>
      </List>
      <P>
        이용자는 국외 이전을 거부할 수 있습니다. 다만 로그인과 해석 생성이 이 전송 위에서
        이루어지므로, 거부하면 회원 기능을 이용할 수 없습니다.
      </P>

      <H>제7조 (제3자 제공)</H>
      <P>
        회사는 이용자의 개인정보를 팔지 않습니다. 법령에 따른 요구나 수사기관의 적법한 절차에 따른
        요청이 있는 경우가 아니면 제3자에게 제공하지 않습니다.
      </P>

      <H>제8조 (광고와 쿠키)</H>
      <P>
        서비스는 Google AdSense와 Kakao AdFit을 통해 광고를 표시할 수 있습니다. 이들은 쿠키를 써서
        이전 방문 기록에 맞춘 광고를 보여줍니다.
      </P>
      <List>
        <li>
          <Out href="https://www.google.com/settings/ads">Google 광고 설정</Out>에서 맞춤형 광고를
          끌 수 있습니다.
        </li>
        <li>
          브라우저 설정에서 쿠키를 거부하거나 지울 수 있습니다. 다만 로그인 유지에 쓰이는 쿠키까지
          막으면 로그인 상태가 유지되지 않습니다.
        </li>
      </List>

      <H>제9조 (이용자의 권리)</H>
      <P>이용자는 언제든지 다음을 요구할 수 있습니다.</P>
      <List>
        <li>어떤 정보를 갖고 있는지 열람</li>
        <li>틀린 정보의 정정</li>
        <li>삭제 — 탈퇴하면 계정과 리딩 기록이 함께 지워집니다</li>
        <li>처리의 정지</li>
      </List>
      <P>
        요구는 {BUSINESS.email} 로 보내 주세요. 받은 날부터 10일 안에 처리합니다. 대리인이 신청할
        때에는 위임장이 필요합니다.
      </P>

      <H>제10조 (안전 조치)</H>
      <List>
        <li>비밀번호는 되돌릴 수 없는 방식으로 변환해 저장합니다.</li>
        <li>
          데이터베이스에는 행 단위 접근 제어를 걸어, 로그인한 회원이 자기 것 외에는 볼 수 없게 해
          두었습니다.
        </li>
        <li>모든 통신은 암호화(HTTPS)합니다.</li>
        <li>운영에 쓰는 열쇠는 서버에서만 다루며 브라우저로 내보내지 않습니다.</li>
      </List>

      <H>제11조 (개인정보 보호책임자)</H>
      <P>
        {BUSINESS.privacyOfficer && (
          <>
            책임자: {BUSINESS.privacyOfficer}
            <br />
          </>
        )}
        이메일: {BUSINESS.email}
        <br />
        사업자 정보는 모든 화면 아래 푸터의 &ldquo;사업자정보&rdquo;와{" "}
        <Link href="/terms" className={linkClass}>
          이용약관
        </Link>
        에 있습니다.
      </P>

      <H>제12조 (권익 침해 구제)</H>
      <P>
        회사의 처리에 만족하지 못했다면 아래에 도움을 요청할 수 있습니다.
      </P>
      <List>
        <li>개인정보분쟁조정위원회 — 1833-6972 (kopico.go.kr)</li>
        <li>개인정보침해신고센터 — 118 (privacy.kisa.or.kr)</li>
        <li>대검찰청 사이버수사과 — 1301</li>
        <li>경찰청 사이버수사국 — 182</li>
      </List>

      <H>부칙</H>
      <P>{effectiveDate(EFFECTIVE)}</P>
    </LegalPage>
  )
}
