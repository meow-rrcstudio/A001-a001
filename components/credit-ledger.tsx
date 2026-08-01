// components/credit-ledger.tsx
// 별조각이 어디로 갔는지 보여주는 목록 (나의 별조각 화면의 본문).
//
// 잔액은 이 줄들을 더한 값입니다. 그러니 줄을 보여주면 셈이 맞는지
// 본인이 확인할 수 있습니다 — 돈이 걸린 값은 "믿어달라"가 아니라
// 보여주는 쪽이 맞습니다.
//
// ⚠️ 타로점 한 판에 딸린 줄은 그 판으로 이어집니다. "이 장은 어디에
//    썼지?" 를 눌러서 바로 확인할 수 있어야 합니다. 갈 곳이 있는 줄에만
//    화살표(›)가 붙습니다 — 구매·가입 선물처럼 이어질 판이 없는 줄에
//    화살표를 달면, 눌러본 사람에게 아무 일도 일어나지 않습니다.
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { CREDIT_UNIT } from "@/lib/credit-packs"

export interface CreditEntry {
  delta: number
  reason: string
  readingId: string | null
  at: string
}

/** 내역에 적히는 사유를 사람 말로 */
const REASON_LABEL: Record<string, string> = {
  welcome: "가입 선물",
  purchase: `${CREDIT_UNIT.one} 구매`,
  reading: "타로점",
  extend: "이어묻기 연장",
  refund: "되돌려받음",
  grant: "얹어드림",
}

function formatDay(at: string) {
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ""
  const time = [d.getHours(), d.getMinutes()].map((n) => String(n).padStart(2, "0")).join(":")
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`
}

/** 한 줄의 속 — 링크로 감싸든 아니든 같은 모양이어야 합니다 */
function EntryBody({ entry }: { entry: CreditEntry }) {
  const 들어옴 = entry.delta > 0
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">
          {REASON_LABEL[entry.reason] ?? entry.reason}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{formatDay(entry.at)}</span>
      </span>

      <span className="shrink-0 text-lg font-bold tabular-nums text-accent">
        {들어옴 && "+"}
        {entry.delta}
      </span>
    </>
  )
}

export function CreditLedger() {
  const [entries, setEntries] = useState<CreditEntry[] | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch("/api/account/credits", { method: "POST" })
        const data = (await response.json()) as { entries: CreditEntry[] | null }
        if (alive) setEntries(data.entries)
      } catch {
        // 못 읽으면 목록을 아예 그리지 않습니다 (틀린 숫자보다 없는 게 낫습니다)
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (!ready) return null

  // 아직 아무 일도 없었으면 빈 상자 대신 한 줄로 말합니다.
  // (예전에는 통째로 그리지 않아서, 화면에 남은 개수만 덩그러니 있었습니다)
  if (!entries || entries.length === 0) {
    return (
      <p className="mt-10 text-center text-sm leading-relaxed text-muted-foreground">
        아직 오간 {CREDIT_UNIT.one}이 없어요.
      </p>
    )
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-muted">
      {entries.map((entry, i) => {
        const line = i > 0 ? "border-t border-border" : ""
        // 타로점에 딸린 줄이면 그 판으로 갑니다.
        // 되돌려받은 줄에도 붙습니다 — "왜 되돌려줬지?"를 확인하려면
        // 그 판을 봐야 합니다.
        return entry.readingId ? (
          <Link
            key={`${entry.at}-${i}`}
            href={`/my/${entry.readingId}`}
            className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-black/5 ${line}`}
          >
            <EntryBody entry={entry} />
            {/* 값(+3 · -1)과 같은 초록입니다 — 설정 목록의 검정 화살표와
                달리, 이건 왼쪽 이름이 아니라 오른쪽 값에 딸려 있습니다 */}
            <ChevronRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          </Link>
        ) : (
          <div key={`${entry.at}-${i}`} className={`flex items-center gap-3 px-5 py-4 ${line}`}>
            <EntryBody entry={entry} />
          </div>
        )
      })}
    </div>
  )
}
