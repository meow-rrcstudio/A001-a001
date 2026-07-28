// components/ui/settings-list.tsx
// 설정 화면의 그룹과 행 — 이름 + (값) + 쉐브론.
//
// 설정 페이지가 전부 이 컴포넌트를 쓰므로, 행 모양을 바꾸면 모든 설정이
// 함께 바뀝니다. 목록 행(RowList)과 달리 "설정을 고치러 들어가는" 성격이라
// 화살표가 ↗(새 곳으로 감)가 아니라 ›(안으로 들어감)입니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 그룹 라벨 : text-sm text-muted-foreground (그룹 상자 위)
// │ · 그룹 상자 : bg-muted rounded-xl
// │ · 행 높이   : py-4 · 이름 text-base font-semibold
// │ · 값 표기   : 행 오른쪽 작은 글씨 (예: 결제 → "999 플랜")
// │ · 강조 배너 : accent 를 주면 행 아래 라임 배너가 붙습니다 (업그레이드 유도)
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface SettingsItem {
  label: string
  href: string
  /** 행 오른쪽에 붙는 현재 값 (예: "999 플랜") */
  value?: string
  /** 행 아래에 붙는 라임 강조 배너 (예: "Max 플랜으로 업그레이드") */
  accent?: { label: string; href: string }
}

export function SettingsGroup({
  label,
  items,
}: {
  /** 그룹 이름 (예: "계정"). 없으면 라벨 없이 상자만 그립니다 */
  label?: string
  items: SettingsItem[]
}) {
  return (
    <section className="mt-6">
      {label && <h2 className="mb-2 font-sans text-sm text-muted-foreground">{label}</h2>}

      <div className="overflow-hidden rounded-xl bg-muted">
        {items.map((item, i) => (
          <div key={item.label} className={i > 0 ? "border-t border-border" : ""}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-black/5"
            >
              <span className="flex-1 text-base font-semibold text-foreground">{item.label}</span>
              {item.value && (
                <span className="text-sm font-medium text-muted-foreground">{item.value}</span>
              )}
              <ChevronRight className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
            </Link>

            {item.accent && (
              <Link
                href={item.accent.href}
                className="mx-5 mb-3 block rounded-lg bg-brand-lime-soft py-2.5 text-center text-sm font-semibold text-accent transition-opacity hover:opacity-80"
              >
                {item.accent.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
