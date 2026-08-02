// app/refund/page.tsx
// 환불정책 — 이용약관 제6조가 가리키는 문서입니다.
//
// ┌─ 왜 약관에서 떼어 두는가 ─────────────────────────────────────────
// │ 전자상거래법은 청약철회 조건을 "구매하기 전에" 알 수 있게 하라고
// │ 합니다. 약관 제6조 안에 묻어 두면 사는 사람이 결코 읽지 않습니다.
// │ 그래서 따로 한 장으로 두고, 구매 화면에서 바로 링크합니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 정책을 바꾸고 싶을 때 ───────────────────────────────────────────
// │ · 이미 쓴 몫은 낱개 값(refundUnitPrice)으로 쳐서 뺍니다 — 묶음 할인은
// │   여러 개를 한꺼번에 사는 조건이라 일부만 쓰고 무를 때는 회수합니다.
// │   셈은 lib/credit-packs.ts 의 refundAmount 한 곳에 있습니다. 결제대행
// │   수수료를 빼고 싶다면 제2조의 문장을 고치세요. 다만 결제 후 7일
// │   안의 청약철회는 법이 비용 청구를 막고 있어 언제나 전액입니다.
// │ · "무상부터 차감"(제3조)은 지금 코드가 아니라 사람이 지키는
// │   규칙입니다. 환불은 이메일로 받아 손으로 처리하고, credit_entries
// │   의 reason 으로 유상(purchase)과 무상(welcome·grant)을 가릅니다.
// │   나중에 환불을 화면에서 처리하게 되면 이 계산을 서버로 옮기고,
// │   그때 제3조 문장과 코드가 같은 말을 하는지 확인하세요.
// └──────────────────────────────────────────────────────────────────
import type { Metadata } from "next"
import { canonicalPath } from "@/lib/seo"
import Link from "next/link"
import { H, LegalPage, List, P, effectiveDate } from "@/components/legal"
import {
  CREDIT_PACKS,
  CREDIT_UNIT,
  countCredits,
  countCreditsWith,
  formatKrw,
  refundAmount,
  refundUnitPrice,
} from "@/lib/credit-packs"
import { PAID_CREDIT_VALID_MONTHS, WELCOME_CREDITS, validityLabel } from "@/lib/credit-rules"
import { BUSINESS } from "@/lib/business"

export const metadata: Metadata = {
  title: "환불정책",
  description: `SoulSeoul ${CREDIT_UNIT.one} 구매의 청약철회·환불 기준입니다.`,  alternates: { canonical: canonicalPath("/refund") },
}

const EFFECTIVE = "2026년 8월 6일"

const linkClass = "text-primary underline underline-offset-4"

/**
 * 제3조의 계산 예시.
 *
 * 값을 손으로 적지 않고 가격표에서 셉니다 — 값이 바뀌면 이 문단도 따라옵니다.
 * 제일 큰 묶음을 예로 듭니다(할인이 걸려 있어 단가 계산이 보여야 하는 쪽입니다).
 */
function RefundExample() {
  const pack = CREDIT_PACKS[CREDIT_PACKS.length - 1]
  const unitPrice = refundUnitPrice()

  // 무상분을 다 쓰고 유상분까지 조금 쓴 상황이라야 제3조가 하는 말이 보입니다.
  const used = WELCOME_CREDITS + 3
  const paidUsed = used - WELCOME_CREDITS

  // 묶음의 대부분을 쓴 경우 — 돌려드릴 것이 남지 않는다는 것을 보여줍니다.
  // 이 경우를 감추면 "0원"을 받은 사람이 속았다고 느낍니다.
  const heavyUsed = WELCOME_CREDITS + pack.credits - 2
  const heavyPaidUsed = heavyUsed - WELCOME_CREDITS

  return (
    <>
      <P>
        예를 들어 무상 {countCredits(WELCOME_CREDITS)}를 받은 회원이 {countCredits(pack.credits)}{" "}
        묶음을 {formatKrw(pack.priceKrw)}에 사고 {countCreditsWith(used, "을를")} 썼다면, 그중{" "}
        {countCredits(WELCOME_CREDITS)}는 무상분에서 빠지므로 유상분은{" "}
        {countCredits(paidUsed)}만 쓴 것이 됩니다. {formatKrw(pack.priceKrw)} − (
        {countCredits(paidUsed)} × {formatKrw(unitPrice)}) ={" "}
        {formatKrw(refundAmount(pack.priceKrw, paidUsed))}을 돌려드립니다.
      </P>
      <P>
        같은 회원이 {countCreditsWith(heavyUsed, "을를")} 썼다면 유상분은{" "}
        {countCredits(heavyPaidUsed)}입니다. {countCredits(heavyPaidUsed)} ×{" "}
        {formatKrw(unitPrice)} = {formatKrw(heavyPaidUsed * unitPrice)}이 되어 낸 금액을 넘어서므로,
        돌려드릴 금액은 {formatKrw(refundAmount(pack.priceKrw, heavyPaidUsed))}입니다.
      </P>
    </>
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
          <strong className="text-foreground">쓰지 않은 {unit}은 돌려드립니다.</strong> 하나도 쓰지
          않았다면 낸 금액 그대로입니다.
        </li>
        <li>
          <strong className="text-foreground">이미 쓴 {unit}은 돌려드리지 않습니다.</strong> 쓴
          만큼은 낱개 값({formatKrw(refundUnitPrice())})으로 쳐서 낸 금액에서 뺍니다(제3조).
        </li>
        <li>
          <strong className="text-foreground">해석을 받지 못했다면 쓴 것으로 치지 않습니다.</strong>{" "}
          그 {unit}은 자동으로 되돌아갑니다.
        </li>
      </List>

      <H>제2조 (언제까지 신청할 수 있나)</H>
      <List>
        <li>
          결제일로부터 7일 안에는 이유를 밝히지 않고 청약을 철회할 수 있습니다. 이때 회사는 어떤
          비용도 청구하지 않습니다.
        </li>
        <li>
          7일이 지난 뒤에도 쓰지 않고 남은 유상 {unit}은 유효기간(결제일로부터 {validityLabel(PAID_CREDIT_VALID_MONTHS)}) 안에서 언제든
          환불을 신청할 수 있습니다. 회사는 결제대행 수수료를 이유로 금액을 깎지 않습니다.
        </li>
        <li>
          다만 {unit}은 구매 즉시 쓸 수 있는 디지털 콘텐츠이므로, 전자상거래법 제17조 제2항에 따라{" "}
          <strong className="text-foreground">이미 사용한 {unit}에 대해서는</strong> 청약철회가
          제한됩니다.
        </li>
      </List>

      <H>제3조 (환불 금액을 세는 법)</H>
      <P>
        가입 축하나 이벤트로 받은 무상 {unit}은 환불 대상이 아닙니다. 어느 쪽이 먼저 쓰였는지는
        언제나{" "}
        <strong className="text-foreground">무상 {unit}이 먼저 쓰인 것으로 봅니다</strong> — 회원에게
        유리한 쪽이기 때문입니다.
      </P>
      <List>
        <li>쓴 개수를 먼저 무상 {unit}에서 빼고, 남은 사용분만 유상 {unit}에서 뺍니다.</li>
        <li>
          <strong className="text-foreground">
            낸 금액 − (쓴 유상 {unit} × {formatKrw(refundUnitPrice())}) = 환불 금액
          </strong>
          입니다.
        </li>
      </List>
      <P>
        이미 쓴 {unit}은 묶음 할인을 적용한 값이 아니라{" "}
        <strong className="text-foreground">낱개로 살 때의 값({formatKrw(refundUnitPrice())})</strong>
        으로 칩니다. 묶음 할인은 여러 개를 한꺼번에 사는 조건으로 드리는 것이라, 일부만 쓰고 무르는
        경우에는 실제로 낱개를 산 것과 같기 때문입니다. 이 셈으로 뺀 금액이 낸 금액을 넘어서면{" "}
        <strong className="text-foreground">환불 금액은 0원이 되며, 회사가 회원에게 더 청구하지는
        않습니다.</strong>
      </P>
      {/* ⚠️ 예시의 숫자를 손으로 적지 않습니다. 가격표(lib/credit-packs.ts)와
          가입 선물(lib/credit-rules.ts)에서 그때그때 셉니다.

          손으로 적었더니 실제로 어긋났습니다 — 값을 888원 체계로 내린 뒤에도
          이 문단만 옛 값(5개 8,000원 · 단가 1,600원)으로 남아 있었습니다.
          환불 기준을 적은 문서가 파는 값과 다른 말을 하고 있던 셈입니다. */}
      <RefundExample />

      <H>제4조 (회사 잘못으로 받지 못한 경우)</H>
      <List>
        <li>
          해석이 나오지 않았거나 도중에 끊겼다면, 차감된 {unit}은 신청하지 않아도 자동으로
          되돌아갑니다. 되돌아간 내역은{" "}
          <Link href="/my/credits" className={linkClass}>
            {unit} 화면
          </Link>
          에서 확인할 수 있습니다. 자동 복구가 되지 않았다면 알려 주세요.
        </li>
        <li>
          서비스 장애로 상당 기간 이용하지 못한 경우에는 그 기간에 대응하는 {unit}을 얹어 드리거나
          환불합니다.
        </li>
      </List>

      <H>제5조 (신청과 처리)</H>
      <List>
        <li>
          환불은 {BUSINESS.email} 로 신청합니다. 가입한 이메일 주소와 결제일을 함께 적어 주세요.
        </li>
        <li>
          신청을 받은 날부터 3영업일 안에 처리하고 결과를 알려 드립니다. 환불은 결제한 수단으로
          되돌리며, 카드 취소는 카드사 사정에 따라 영업일 기준 3~5일 더 걸릴 수 있습니다.
        </li>
        <li>환불이 끝나면 그만큼의 {unit}은 차감됩니다.</li>
        <li>
          처리 결과에 동의하기 어려우면 한국소비자원(1372) 또는 전자거래분쟁조정위원회에 조정을
          신청할 수 있습니다.
        </li>
      </List>

      <H>제6조 (환불이 어려운 경우)</H>
      <List>
        <li>이미 사용한 {unit} (제2조)</li>
        <li>무상으로 받은 {unit}</li>
        <li>
          이용약관 제7조를 어겨 이용이 정지된 경우의 무상 {unit}. 이때에도 유상 {unit}은 이 정책에
          따라 환불합니다.
        </li>
      </List>

      <H>부칙</H>
      <P>{effectiveDate(EFFECTIVE)}</P>
    </LegalPage>
  )
}
