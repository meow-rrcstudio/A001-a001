// app/refund/page.tsx
// 환불정책 — 이용약관 제8조가 가리키는 문서입니다.
//
// ┌─ 왜 약관에서 떼어 두는가 ─────────────────────────────────────────
// │ 전자상거래법은 청약철회 조건을 "구매하기 전에" 알 수 있게 하라고
// │ 합니다. 약관 제8조 안에 묻어 두면 사는 사람이 결코 읽지 않습니다.
// │ 그래서 따로 한 장으로 두고, 구매 화면에서 바로 링크합니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 정책을 바꾸고 싶을 때 ───────────────────────────────────────────
// │ · 지금은 미사용분을 기간과 무관하게 전액 돌려줍니다. 결제대행
// │   수수료를 빼고 싶다면 제3조의 문장을 고치세요. 다만 결제 후 7일
// │   안의 청약철회는 법이 비용 청구를 막고 있어 언제나 전액입니다.
// │ · "무상부터 차감"(제4조)은 지금 코드가 아니라 사람이 지키는
// │   규칙입니다. 환불은 이메일로 받아 손으로 처리하고, credit_entries
// │   의 reason 으로 유상(purchase)과 무상(welcome·grant)을 가릅니다.
// │   나중에 환불을 화면에서 처리하게 되면 이 계산을 서버로 옮기고,
// │   그때 제4조 문장과 코드가 같은 말을 하는지 확인하세요.
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import Link from "next/link"
import { H, LegalPage, List, P, effectiveDate } from "@/components/legal"
import {
  CREDIT_PACKS,
  CREDIT_UNIT,
  countCredits,
  countCreditsWith,
  formatKrw,
  pricePerCredit,
} from "@/lib/credit-packs"
import { WELCOME_CREDITS } from "@/lib/credit-rules"
import { BUSINESS } from "@/lib/business"

export const metadata: Metadata = {
  title: "환불정책",
  description: `SoulSeoul ${CREDIT_UNIT.one} 구매의 청약철회·환불 기준입니다.`,
}

const EFFECTIVE = "2026년 8월 6일"

const linkClass = "text-primary underline underline-offset-4"

/**
 * 제4조의 계산 예시.
 *
 * 값을 손으로 적지 않고 가격표에서 셉니다 — 값이 바뀌면 이 문단도 따라옵니다.
 * 제일 큰 묶음을 예로 듭니다(할인이 걸려 있어 단가 계산이 보여야 하는 쪽입니다).
 */
function RefundExample() {
  const pack = CREDIT_PACKS[CREDIT_PACKS.length - 1]
  const unitPrice = pricePerCredit(pack)

  // 무상분을 다 쓰고 유상분까지 조금 쓴 상황이라야 제4조가 하는 말이 보입니다.
  const used = WELCOME_CREDITS + 3
  const paidUsed = used - WELCOME_CREDITS
  const paidLeft = pack.credits - paidUsed

  return (
    <P>
      예를 들어 무상 {countCredits(WELCOME_CREDITS)}를 받은 회원이 {countCredits(pack.credits)}{" "}
      묶음을 {formatKrw(pack.priceKrw)}에 사고 {countCreditsWith(used, "을를")} 썼다면, 그중{" "}
      {countCredits(WELCOME_CREDITS)}는 무상분에서 빠지므로 유상분은{" "}
      {countCredits(paidUsed)}만 쓴 것이 됩니다. 남은 유상 {countCredits(paidLeft)} ×{" "}
      {formatKrw(unitPrice)} = {formatKrw(paidLeft * unitPrice)}을 돌려드립니다.
    </P>
  )
}

export default function RefundPage() {
  const unit = CREDIT_UNIT.one

  return (
    <LegalPage
      title="환불정책"
      lead={
        <>
          {unit} 구매를 취소하거나 환불받는 기준입니다. 이 정책은{" "}
          <Link href="/terms" className={linkClass}>
            이용약관
          </Link>
          의 일부이며, 전자상거래 등에서의 소비자보호에 관한 법률을 따릅니다.
        </>
      }
    >
      <H>제1조 (한눈에)</H>
      <List>
        <li>
          <strong className="text-foreground">쓰지 않은 {unit}은 돌려드립니다.</strong> 기간과
          상관없이, 낸 금액 그대로입니다.
        </li>
        <li>
          <strong className="text-foreground">이미 쓴 {unit}은 돌려드리지 않습니다.</strong> 해석이
          이미 나갔기 때문입니다.
        </li>
        <li>
          <strong className="text-foreground">
            해석을 받지 못했다면 쓴 것으로 치지 않습니다.
          </strong>{" "}
          그 {unit}은 자동으로 되돌아갑니다.
        </li>
      </List>

      <H>제2조 (청약철회)</H>
      <List>
        <li>
          결제일로부터 7일 안에는 이유를 밝히지 않고 청약을 철회할 수 있습니다. 이때 회사는 어떤
          비용도 청구하지 않습니다.
        </li>
        <li>
          다만 {unit}은 구매 즉시 쓸 수 있는 디지털 콘텐츠이므로, 같은 법 제17조 제2항에 따라{" "}
          <strong className="text-foreground">이미 사용한 {unit}에 대해서는</strong> 청약철회가
          제한됩니다.
        </li>
        <li>
          묶음으로 산 뒤 일부만 썼다면, 쓰지 않고 남은 만큼은 그대로 철회할 수 있습니다.
        </li>
      </List>

      <H>제3조 (7일이 지난 뒤)</H>
      <P>
        7일이 지난 뒤에도 쓰지 않고 남은 유상 {unit}은 유효기간(결제일로부터 5년) 안에서 언제든
        환불을 신청할 수 있습니다. 회사는 결제대행 수수료를 이유로 금액을 깎지 않습니다.
      </P>

      <H>제4조 (환불 금액을 세는 법)</H>
      <P>
        가입 축하나 이벤트로 받은 무상 {unit}은 환불 대상이 아닙니다. 어느 쪽이 먼저 쓰였는지를
        따져야 하는데, 회사는 언제나{" "}
        <strong className="text-foreground">무상 {unit}이 먼저 쓰인 것으로 봅니다.</strong> 회원에게
        유리한 쪽이기 때문입니다.
      </P>
      <List>
        <li>쓴 개수를 먼저 무상 {unit}에서 뺍니다.</li>
        <li>무상분을 다 쓰고도 남은 사용분만 유상 {unit}에서 뺍니다.</li>
        <li>
          남은 유상 {unit} × 실제로 낸 단가 = 환불 금액입니다. 단가는 묶음 할인을 적용한 뒤의
          금액입니다.
        </li>
      </List>
      {/* ⚠️ 예시의 숫자를 손으로 적지 않습니다. 가격표(lib/credit-packs.ts)와
          가입 선물(lib/credit-rules.ts)에서 그때그때 셉니다.

          손으로 적었더니 실제로 어긋났습니다 — 값을 888원 체계로 내린 뒤에도
          이 문단만 옛 값(5개 8,000원 · 단가 1,600원)으로 남아 있었습니다.
          환불 기준을 적은 문서가 파는 값과 다른 말을 하고 있던 셈입니다. */}
      <RefundExample />

      <H>제5조 (회사 잘못으로 받지 못한 경우)</H>
      <List>
        <li>
          해석이 나오지 않았거나 도중에 끊겼다면, 차감된 {unit}은 신청하지 않아도 자동으로
          되돌아갑니다. 되돌아간 내역은{" "}
          <Link href="/my/credits" className={linkClass}>
            {unit} 화면
          </Link>
          에서 확인할 수 있습니다.
        </li>
        <li>
          자동 복구가 되지 않았다면 알려 주세요. 확인 후 복구하거나, 원하시면 환불해 드립니다.
        </li>
        <li>
          서비스 장애로 상당 기간 이용하지 못한 경우에는 그 기간에 대응하는 {unit}을 얹어 드리거나
          환불합니다.
        </li>
      </List>

      <H>제6조 (신청과 처리)</H>
      <List>
        <li>
          환불은 {BUSINESS.email} 로 신청합니다. 가입한 이메일 주소와 결제일을 함께 적어 주세요.
        </li>
        <li>신청을 받은 날부터 3영업일 안에 처리하고 결과를 알려 드립니다.</li>
        <li>
          환불은 결제한 수단으로 되돌립니다. 카드 결제 취소는 카드사 사정에 따라 영업일 기준 3~5일
          더 걸릴 수 있습니다.
        </li>
        <li>환불이 끝나면 그만큼의 {unit}은 차감됩니다.</li>
      </List>

      <H>제7조 (환불이 어려운 경우)</H>
      <List>
        <li>이미 사용한 {unit} (제2조)</li>
        <li>무상으로 받은 {unit}</li>
        <li>
          이용약관 제9조를 어겨 이용이 정지된 경우의 무상 {unit}. 이때에도 유상 {unit}은 이 정책에
          따라 환불합니다.
        </li>
      </List>

      <H>제8조 (분쟁)</H>
      <P>
        처리 결과에 동의하기 어려우면 한국소비자원(1372) 또는 전자거래분쟁조정위원회에 조정을
        신청할 수 있습니다.
      </P>

      <H>부칙</H>
      <P>{effectiveDate(EFFECTIVE)}</P>
    </LegalPage>
  )
}
