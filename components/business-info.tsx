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
// 통째로 빠지고, 사업자등록번호가 비어 있으면 이 블록 자체가 그려지지
// 않습니다 (등록 전에 "사업자정보"라고 써 두면 그게 거짓말이 됩니다).
import { BUSINESS, businessLines } from "@/lib/business"

export function BusinessInfo({ className = "" }: { className?: string }) {
  const lines = businessLines()

  // 등록번호가 없으면 아직 사업자로 팔 수 있는 상태가 아닙니다.
  if (!BUSINESS.registrationNumber.trim()) return null

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
