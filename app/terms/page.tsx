// app/terms/page.tsx
// 이용약관 — 크레딧을 돈 받고 팔기 시작하면서 필요해진 문서입니다.
//
// ┌─ 고칠 때 ─────────────────────────────────────────────────────────
// │ · 가격·묶음        : lib/credit-packs.ts (여기 숫자를 적지 마세요)
// │ · 사업자 정보      : lib/business.ts
// │ · 환불 기준        : app/refund/page.tsx — 여기서는 가리키기만 합니다
// │ · 시행일           : 아래 EFFECTIVE
// │
// │ ⚠️ 약관은 "바꿨다"는 사실 자체를 알려야 하는 문서입니다. 조항을
// │    고쳤다면 시행일도 함께 올리고, 불리해지는 변경이면 30일 전에
// │    공지해야 합니다 (제3조).
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import { canonicalPath } from "@/lib/seo"
import Link from "next/link"
import { H, LegalPage, List, P, effectiveDate } from "@/components/legal"
import { CREDIT_UNIT, countCreditsWith } from "@/lib/credit-packs"
import { FOLLOWUPS_PER_CREDIT } from "@/lib/reading-entitlement"
import {
  FREE_CREDIT_VALID_MONTHS,
  PAID_CREDIT_VALID_MONTHS,
  validityLabel,
} from "@/lib/credit-rules"
import { BUSINESS } from "@/lib/business"

export const metadata: Metadata = {
  title: "이용약관",
  description: "SoulSeoul 서비스 이용약관입니다.",  alternates: { canonical: canonicalPath("/terms") },
}

const EFFECTIVE = "2026년 8월 6일"

const linkClass = "text-primary underline underline-offset-4"

export default function TermsPage() {
  const unit = CREDIT_UNIT.one

  return (
    <LegalPage
      title="이용약관"
      lead={
        <>
          이 약관은 SoulSeoul(soulseoul.xyz, 이하 &ldquo;서비스&rdquo;)을 이용하는 데 필요한
          조건과 절차, 회사와 회원의 권리·의무를 정합니다. 회원가입을 하면 이 약관에 동의한
          것으로 봅니다.
        </>
      }
    >
      <H>제1조 (서비스와 용어)</H>
      <List>
        <li>
          &ldquo;서비스&rdquo;란 회사가 soulseoul.xyz 에서 제공하는 타로 리딩·기록 서비스입니다.
          &ldquo;회원&rdquo;은 이 약관에 동의하고 계정을 만든 사람입니다.
        </li>
        <li>
          &ldquo;{unit}&rdquo;은 리딩에 필요한 서비스 내 이용권입니다. &ldquo;리딩&rdquo;은 카드를
          뽑고 해석을 받는 한 판이며, 해석과 대화는 인공지능 캐릭터 &ldquo;샨티&rdquo;가 맡습니다.
        </li>
        <li>
          리딩 한 판에 {unit} {countCreditsWith(1, "이가")} 듭니다. 같은 판에 이어서 묻는 것은{" "}
          {FOLLOWUPS_PER_CREDIT}번까지 포함되며 따로 들지 않습니다.
        </li>
        <li>
          회사는 서비스의 내용과 구성을 바꿀 수 있습니다. 이미 구매한 {unit}의 가치를 떨어뜨리는
          변경에는 제3조의 절차를 따릅니다.
        </li>
      </List>

      <H>제2조 (사업자 정보)</H>
      <P>
        상호·대표자·주소·사업자등록번호·연락처는 모든 화면 아래 푸터의 &ldquo;사업자정보&rdquo;에
        있습니다. 문의는 {BUSINESS.email} 로 받습니다.
      </P>

      <H>제3조 (약관의 변경)</H>
      <List>
        <li>바뀐 약관은 시행일 7일 전부터 이 페이지에 공지합니다.</li>
        <li>
          회원에게 불리하게 바뀌는 경우에는 시행일 30일 전에 공지하고, 바뀐 내용을 따로 밝힙니다.
        </li>
        <li>
          시행일까지 거부의 뜻을 밝히지 않으면 동의한 것으로 봅니다. 동의하지 않으면 언제든 탈퇴할
          수 있습니다.
        </li>
      </List>

      <H>제4조 (가입과 계정)</H>
      <List>
        <li>
          가입은 카카오·구글 계정 또는 이메일로 합니다. <strong className="text-foreground">만
          14세 미만은 가입할 수 없습니다.</strong>
        </li>
        <li>계정은 본인만 쓸 수 있고, 빌려주거나 팔 수 없습니다.</li>
        <li>
          남의 이름을 쓰거나 허위 정보를 적은 신청, 이 약관을 어겨 정지된 사람의 재가입은 거절하거나
          나중에 취소할 수 있습니다.
        </li>
      </List>

      <H>제5조 ({unit}과 결제)</H>
      <List>
        <li>
          {unit}은 유상{unit}(결제해서 받은 것)과 무상{unit}(가입 축하·이벤트로 받은 것)으로
          나뉩니다. 쓸 때에는{" "}
          <strong className="text-foreground">무상{unit}부터</strong> 차감합니다 — 회원에게 유리한
          쪽이기 때문입니다.
        </li>
        <li>
          유효기간은 결제일로부터 {validityLabel(PAID_CREDIT_VALID_MONTHS)}(무상{unit}은 지급일로부터{" "}
          {validityLabel(FREE_CREDIT_VALID_MONTHS)})이며, 결제 건마다 따로 셉니다. 소멸 예정은 미리
          알립니다.
        </li>
        <li>{unit}은 현금으로 바꾸거나 남에게 넘길 수 없습니다.</li>
        <li>
          결제는 결제대행사(토스페이먼츠)를 통합니다. 가격은 구매 화면에 표시된 금액(부가세
          포함)이며, 승인되면 즉시 적립됩니다.
        </li>
        <li>
          남은 {unit}과 사용 내역은{" "}
          <Link href="/my/credits" className={linkClass}>
            {unit} 화면
          </Link>
          에서 확인할 수 있습니다.
        </li>
      </List>

      <H>제6조 (청약철회와 환불)</H>
      <P>
        청약철회 기간, 이미 사용한 {unit}의 처리, 환불 금액을 세는 법은{" "}
        <Link href="/refund" className={linkClass}>
          환불정책
        </Link>
        에서 정합니다. 환불정책은 이 약관의 일부입니다.
      </P>

      <H>제7조 (회원의 의무와 이용 제한)</H>
      <P>회원은 다음 행위를 해서는 안 됩니다.</P>
      <List>
        <li>남의 계정·개인정보를 쓰거나 도용하는 행위</li>
        <li>자동화된 수단으로 반복 접속하거나 서비스에 과도한 부하를 일으키는 행위</li>
        <li>서비스를 거꾸로 분석하거나 프롬프트·응답을 대량으로 긁어가는 행위</li>
        <li>남을 괴롭히거나 불법적인 내용을 만들도록 유도하는 행위</li>
        <li>서비스의 결과물을 사실인 예언으로 광고하는 행위</li>
      </List>
      <P>
        이를 어기면 회사는 경고 → 일시 정지 → 해지의 순서로 이용을 제한합니다. 다만 법령 위반이나
        운영 방해가 명백하면 먼저 정지한 뒤 알릴 수 있습니다. 이렇게 해지되면 무상{unit}은
        소멸하고 유상{unit}은 환불정책에 따라 처리합니다.
      </P>

      <H>제8조 (해지 · 탈퇴)</H>
      <List>
        <li>
          회원은 언제든지 탈퇴할 수 있습니다. 탈퇴하면 계정과 리딩 기록은 삭제되며 되살릴 수
          없으니, 남기고 싶은 해석은 미리 옮겨 두세요.
        </li>
        <li>
          무상{unit}은 탈퇴와 함께 소멸합니다. 유상{unit}은 환불정책에 따라 환불을 신청할 수
          있습니다.
        </li>
        <li>
          법령이 보관하도록 정한 결제·거래 기록은 그 기간 동안 보관합니다(개인정보처리방침 참조).
        </li>
      </List>

      <H>제9조 (콘텐츠의 권리)</H>
      <List>
        <li>서비스의 화면·그림·글·프로그램에 대한 권리는 회사에 있습니다.</li>
        <li>
          회원이 적은 질문은 회원의 것입니다. 회사는 서비스 제공과 품질 개선을 위한 범위에서만
          이용합니다.
        </li>
        <li>
          받은 해석은 개인적으로 자유롭게 쓰고 공유할 수 있습니다. 다만 되팔거나 같은 종류의
          서비스를 만드는 데 쓸 수는 없습니다.
        </li>
      </List>

      <H>제10조 (면책과 분쟁)</H>
      <List>
        <li>
          <strong className="text-foreground">
            타로 리딩은 오락과 자기성찰을 위한 것이며, 사실을 예언하지 않습니다.
          </strong>{" "}
          해석은 의료·법률·투자 등 전문적인 판단을 대신하지 않습니다. 샨티의 답은 인공지능이 만든
          것이라 사실과 다를 수 있습니다.
        </li>
        <li>회원이 해석을 바탕으로 내린 결정과 그 결과에 대해 회사는 책임지지 않습니다.</li>
        <li>
          천재지변, 통신사·결제대행사·인공지능 제공사의 장애 등 회사가 어찌할 수 없는 사유로
          서비스가 멈춘 경우 그 범위에서 책임을 지지 않습니다. 다만 그 사이에 차감된 {unit}은
          되돌려 드립니다.
        </li>
        <li>
          불만이 있으면 먼저 {BUSINESS.email} 로 알려 주세요. 3영업일 안에 처리 경과를 알려
          드립니다. 협의가 되지 않으면 한국소비자원 또는 전자거래분쟁조정위원회에 조정을 신청할 수
          있습니다. 이 약관은 대한민국 법을 따릅니다.
        </li>
      </List>

      <H>부칙</H>
      <P>{effectiveDate(EFFECTIVE)}</P>
    </LegalPage>
  )
}
