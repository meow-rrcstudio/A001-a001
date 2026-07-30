// components/business-info.tsx
// 푸터에 접어 둔 사업자정보.
//
// ┌─ 왜 접어 두는가 ──────────────────────────────────────────────────
// │ 전자상거래법은 "이용자가 쉽게 볼 수 있는 곳"에 표시하라고 할 뿐,
// │ 항상 펼쳐 두라고 하지는 않습니다. 국내 대부분의 서비스가 푸터에
// │ "사업자정보"를 접어 두는 이유입니다 — 여섯 줄을 늘 펼쳐 두면
// │ 푸터가 그 정보로 뒤덮입니다.
// │
// │ ⚠️ 접어 두는 것과 감추는 것은 다릅니다. 클릭 한 번으로 열리고,
// │    검색엔진과 화면읽개도 <details> 안의 글을 읽습니다.
// │    자바스크립트 없이 열리므로 스크립트가 막혀도 볼 수 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// 값은 lib/business.ts 한 곳에서 옵니다. 아직 안 채운 항목은 그 줄이
// 통째로 빠집니다.
import { BUSINESS, businessLines } from "@/lib/business"

export function BusinessInfo({ className = "" }: { className?: string }) {
  const lines = businessLines()

  // ┌─ 언제 그리는가 ─────────────────────────────────────────────────
  // │ 상호와 등록번호가 둘 다 있어야 그립니다.
  // │
  // │ 등록번호 하나만 보고 그리면, 상호가 아직 안 들어왔을 때 푸터에
  // │ "사업자정보 › 사업자등록번호 674-...-..., 이메일 ..." 두 줄만 뜹니다.
  // │ 누구의 등록번호인지가 빠진 표기라 안 하느니만 못합니다.
  // │
  // │ ⚠️ 여기를 통과한다고 표시 의무를 지킨 것은 아닙니다. 주소·전화까지
  // │    있어야 합니다 — lib/business.ts 의 BUSINESS_INFO_READY 로 봅니다.
  // └──────────────────────────────────────────────────────────────────
  if (!BUSINESS.name.trim() || !BUSINESS.registrationNumber.trim()) return null

  return (
    <details className={`text-xs ${className}`}>
      <summary className="cursor-pointer list-none underline underline-offset-4 marker:hidden">
        사업자정보
      </summary>
      <dl className="mt-2 flex flex-col items-center gap-1 leading-relaxed">
        {lines.map((line) => (
          <div key={line.label} className="flex flex-wrap justify-center gap-x-1.5">
            <dt className="opacity-70">{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
