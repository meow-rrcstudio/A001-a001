// lib/business.ts
// [단일 진실 소스] 사업자 정보 — 전자상거래법이 표시하라고 정한 항목들입니다.
//
// ┌─ 왜 이 파일이 필요한가 ───────────────────────────────────────────
// │ 크레딧을 돈 받고 팔기 시작하면 이 사이트는 "통신판매업자"가 됩니다.
// │ 전자상거래법 제10조는 상호·대표자·주소·연락처·사업자등록번호를
// │ 이용자가 쉽게 볼 수 있는 곳에 표시하라고 정합니다. 그래서 푸터에
// │ 붙였고, 값은 전부 여기 한 곳에서만 옵니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 채우는 법 ───────────────────────────────────────────────────────
// │ 아래 값을 사업자등록증·통신판매업 신고증에 적힌 그대로 옮겨 적으세요.
// │ 빈 칸("")으로 두면 그 줄은 화면에 아예 그려지지 않습니다 —
// │ 틀린 값을 보여주느니 없는 게 낫기 때문입니다.
// │
// │ ⚠️ 다만 "빈 칸이라 안 보인다"와 "표시 의무를 지켰다"는 다릅니다.
// │    유료 결제를 열기 전에 아래 required 항목은 모두 채워야 합니다.
// │    다 찼는지는 BUSINESS_INFO_READY 로 확인할 수 있습니다.
// │
// │ 통신판매업 신고번호는 사업자등록 뒤에 따로 신고해야 나옵니다
// │ (정부24 → 통신판매업 신고). 아직이면 비워 두세요.
// └──────────────────────────────────────────────────────────────────

// as const 를 붙이지 않습니다 — 지금 값이 빈 문자열이라, 붙이면 타입이
// 리터럴 ""로 굳어져 "이 조건은 언제나 거짓"처럼 잡히는 곳이 생깁니다.
export const BUSINESS: Record<
  | "name"
  | "ceo"
  | "address"
  | "registrationNumber"
  | "mailOrderNumber"
  | "phone"
  | "email"
  | "privacyOfficer",
  string
> = {
  /** 상호 — 사업자등록증의 "상호" 칸 그대로 */
  name: "소울서울",
  /** 대표자 이름 */
  ceo: "한아리",
  /** 사업장 주소 — 등록증에 적힌 소재지 */
  address: "서초대로 19길 10-20 3층",
  /** 사업자등록번호 — "000-00-00000" 모양 (검증식 통과 확인함) */
  registrationNumber: "674-54-01045",
  /** 통신판매업 신고번호 — "제0000-지역0000호" 모양. 신고 전이면 빈 칸 */
  mailOrderNumber: "",
  /**
   * 고객 문의 전화.
   *
   * 050 안심번호입니다 — 걸면 대표 번호로 연결되고, 거는 쪽에는 개인
   * 번호가 보이지 않습니다. 토스 신청서의 가맹점 전화번호와 같은 번호를
   * 씁니다 (사이트와 서류가 어긋나면 심사에서 확인 요청이 옵니다).
   */
  phone: "050-6617-3829",
  /** 고객 문의 이메일 */
  email: "aree.korea@gmail.com",
  /** 개인정보 보호책임자 이름 (보통 대표자와 같습니다) */
  privacyOfficer: "한아리",
}

/**
 * 결제를 열기 전에 반드시 채워야 하는 항목.
 *
 * 통신판매업 신고번호는 여기 넣지 않았습니다 — 신고가 접수 중일 수 있어서
 * 나머지가 다 찼는데 이것 하나로 "미완"이 되면 판단이 흐려집니다.
 * 다만 실제로 판매를 시작할 때는 이것도 있어야 합니다.
 */
const REQUIRED_FIELDS = [
  "name",
  "ceo",
  "address",
  "registrationNumber",
  "phone",
  "email",
] as const

/** 필수 항목이 다 찼는지 — 결제를 열어도 되는지 판단하는 데 씁니다 */
export const BUSINESS_INFO_READY = REQUIRED_FIELDS.every(
  (key) => BUSINESS[key].trim().length > 0,
)

/** 화면에 한 줄로 그릴 항목 — 값이 없는 것은 빠집니다 */
export interface BusinessLine {
  label: string
  value: string
}

/**
 * 푸터·약관에 그릴 줄 목록.
 *
 * 순서는 흔한 국내 표기 순서를 따랐습니다(상호 → 대표 → 주소 → 번호 → 연락처).
 * 값이 빈 항목은 걸러지므로, 아직 안 채운 상태에서도 화면이 깨지지 않습니다.
 */
export function businessLines(): BusinessLine[] {
  return [
    { label: "상호", value: BUSINESS.name },
    { label: "대표", value: BUSINESS.ceo },
    { label: "주소", value: BUSINESS.address },
    { label: "사업자등록번호", value: BUSINESS.registrationNumber },
    { label: "통신판매업신고번호", value: BUSINESS.mailOrderNumber },
    { label: "전화", value: BUSINESS.phone },
    { label: "이메일", value: BUSINESS.email },
  ].filter((line) => line.value.trim().length > 0)
}

/**
 * 사업자등록번호 진위확인 링크.
 *
 * 국세청이 운영하는 조회 화면입니다. 이용자가 "이 사업자가 진짜인지"
 * 확인할 수 있게 두는 것이 관례입니다 (의무는 아닙니다).
 */
export const BUSINESS_LOOKUP_URL =
  "https://www.ftc.go.kr/bizCommPop.do?wrkr_no=" +
  BUSINESS.registrationNumber.replace(/-/g, "")
