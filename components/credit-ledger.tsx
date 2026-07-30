// components/credit-ledger.tsx
// 크레딧이 어디로 갔는지 보여주는 목록.
//
// 잔액은 이 줄들을 더한 값입니다. 그러니 줄을 보여주면 셈이 맞는지
// 본인이 확인할 수 있습니다 — 돈이 걸린 값은 "믿어달라"가 아니라
// 보여주는 쪽이 맞습니다.
//
// ⚠️ 타로점 한 판에 딸린 줄은 그 판으로 이어집니다. "이 장은 어디에
//    썼지?" 를 눌러서 바로 확인할 수 있어야 합니다.
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
  purchase: "구매",
  reading: "타로점 한 판",
  extend: "이어묻기 연장",
  refund: "되돌려받음",
  grant: "얹어드림",
}

function formatDay(at: string) {
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`
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

  if (!ready || !entries || entries.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="font-myeongjo text-xl font-bold text-black">
        {CREDIT_UNIT.one}이 어디로 갔나
      </h2>
      <p className="mt-1.5 text-sm text-black/60">
        받은 것과 쓴 것을 그대로 적어둡니다. 셈이 맞지 않으면 알려주세요.
      </p>

      <ul className="mt-4 border-t border-black/15">
        {entries.map((entry, i) => {
          const 들어옴 = entry.delta > 0
          const label = REASON_LABEL[entry.reason] ?? entry.reason
          return (
            <li key={`${entry.at}-${i}`} className="border-b border-black/10">
              <div className="flex items-center gap-3 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-black">{label}</span>
                  <span className="mt-0.5 block text-xs text-black/50">{formatDay(entry.at)}</span>
                </span>

                {/* 타로점에 딸린 줄이면 그 판으로 갑니다.
                    되돌려받은 줄에도 붙습니다 — "왜 되돌려줬지?"를
                    확인하려면 그 판을 봐야 합니다. */}
                {entry.readingId && (
                  <Link
                    href={`/my/${entry.readingId}`}
                    className="shrink-0 text-xs text-black/50 underline underline-offset-2"
                  >
                    이 판 보기
                  </Link>
                )}

                <span
                  className={`shrink-0 text-[15px] font-semibold tabular-nums ${
                    들어옴 ? "text-black" : "text-black/60"
                  }`}
                >
                  {들어옴 ? "+" : ""}
                  {entry.delta}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
