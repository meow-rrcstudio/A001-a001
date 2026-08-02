// lib/contact.ts
// "메일로 문의하기" 링크를 만듭니다.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 환불정책은 "가입한 이메일 주소와 결제일을 함께 적어 주세요"라고
// │ 요구합니다. 그런데 화면에는 주소가 그냥 글자로만 적혀 있어서,
// │ 폰으로 보는 사람은 그것을 손으로 받아적어야 했습니다. 환불하려는
// │ 사람은 이미 마음이 상해 있는데 거기서 한 번 더 막힙니다.
// │
// │ 눌러서 메일 앱이 열리게 하고, 제목과 적을 거리까지 미리 채워 둡니다.
// │ 그러면 보내는 쪽은 빈칸만 메우면 되고, 받는 쪽(아리님)은 "결제일이
// │ 언제세요?" 하고 되묻는 왕복이 사라집니다.
// └──────────────────────────────────────────────────────────────────
import { BUSINESS } from "@/lib/business"

/**
 * mailto 주소를 만듭니다.
 *
 * ⚠️ 제목과 본문은 반드시 encodeURIComponent 를 거칩니다. 우리말과
 *    줄바꿈이 그대로 들어가면 메일 앱마다 다르게 깨집니다.
 */
export function mailtoHref(options?: { subject?: string; body?: string }): string {
  const params: string[] = []
  if (options?.subject) params.push(`subject=${encodeURIComponent(options.subject)}`)
  if (options?.body) params.push(`body=${encodeURIComponent(options.body)}`)
  return `mailto:${BUSINESS.email}${params.length ? `?${params.join("&")}` : ""}`
}

/**
 * 환불 신청용 — 정책 제5조가 요구하는 항목을 미리 적어 둡니다.
 *
 * ⚠️ 항목을 바꾸면 환불정책 제5조도 함께 보세요. 여기서 묻지 않는 것을
 *    정책이 요구하거나, 정책에 없는 것을 여기서 물으면 어긋납니다.
 */
export const REFUND_MAILTO = mailtoHref({
  subject: "[SoulSeoul] 환불 신청",
  body: [
    "아래를 채워서 보내주세요.",
    "",
    "· 가입한 이메일 주소 :",
    "· 결제일 :",
    "· 주문번호 (결제내역 화면에 있어요) :",
    "· 환불 사유 (안 적으셔도 됩니다) :",
    "",
    "─────────────────",
    "받은 날부터 3영업일 안에 처리하고 알려드릴게요.",
  ].join("\n"),
})

/** 일반 문의용 — 무엇을 적어야 할지 모르는 사람을 위한 최소한의 틀 */
export const CONTACT_MAILTO = mailtoHref({ subject: "[SoulSeoul] 문의" })
