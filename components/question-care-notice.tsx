// components/question-care-notice.tsx
// 조심해서 다뤄야 하는 물음일 때 화면 위쪽에 얹히는 얇은 카드.
//
// ┌─ 왜 화면에 내미는가 ──────────────────────────────────────────────
// │ 프롬프트에 "위험하면 응급기관을 안내하라"고 적어두는 것만으로는
// │ 모자랍니다. 모델이 그 말을 할지 안 할지는 그때그때 다르고, 번호를
// │ 지어낼 수도 있습니다. 사람 목숨이 걸린 자리에서 "아마 말하겠지"에
// │ 기댈 수는 없습니다. 그래서 우리가 직접, 카드보다 먼저 내밉니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 왜 상자가 아니라 얹히는 카드인가 (2026-08 시안) ─────────────────
// │ 예전에는 흐름 안에 큰 상자로 놓였습니다. 그러면 카드를 뽑으려는
// │ 사람 앞을 가로막고, 안내를 읽은 뒤에도 계속 자리를 차지합니다.
// │ 그래서 반투명 카드로 얹고 닫을 수 있게 했습니다.
// │
// │ 대신 닫아도 "그 판 동안만" 닫힙니다 — 새 물음을 던지면 다시 나옵니다
// │ (app/tarot/ask/page.tsx 의 clearCareDismissed).
// │
// │ ⚠️ 뽑기 화면에만 두지 않습니다. 사람이 오래 머무는 자리는 결과와
// │    면담 화면이라, 거기서는 헤더 아래에 붙어 따라옵니다(sticky).
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 거절 상자가 아닙니다. 타로는 그대로 이어집니다 — 다만 무엇을 보는
//    자리인지를 먼저 일러줍니다 (lib/question-safety.ts).
"use client"

import { useState } from "react"
import type { QuestionAudit } from "@/lib/question-safety"
import { useAppsInToss } from "@/lib/use-runtime"

/**
 * 닫아둔 것을 기억하는 자리.
 *
 * ⚠️ sessionStorage 입니다. 판을 넘어 남으면 다음에 위기 물음을 던진
 *    사람에게 연락처가 안 보입니다. 탭을 닫으면 함께 지워집니다.
 */
const DISMISS_KEY = "question-care-dismissed"

/** 닫아뒀는지 읽어옵니다. 서버에서 그릴 때는 언제나 "안 닫았다"입니다 */
function readDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return !!sessionStorage.getItem(DISMISS_KEY)
  } catch {
    return false
  }
}

/** 새 판이 시작될 때 부릅니다 — 지난 판에서 닫아둔 것을 잊습니다 */
export function clearCareDismissed() {
  try {
    sessionStorage.removeItem(DISMISS_KEY)
  } catch {
    // 사파리 시크릿 모드 등에서 막힐 수 있습니다. 못 지우면 안내가 한 판
    // 더 보이는 것뿐이라 그냥 넘어갑니다.
  }
}

export function QuestionCareNotice({
  audit,
  /**
   * 결과·면담 화면처럼 글이 흐르는 자리에서는 헤더 아래에 붙어 따라옵니다.
   * 뽑기 화면처럼 한 화면에 못 박힌 자리에서는 그냥 흐름 안에 놓입니다.
   */
  sticky = false,
  className = "",
}: {
  audit?: QuestionAudit | null
  sticky?: boolean
  className?: string
}) {
  // ⚠️ 웹뷰(앱인토스 미니앱) 안에서는 tel: 이 막힐 수 있습니다. 막히면
  //    눌러도 아무 일이 일어나지 않는데, 하필 이 자리는 사람 목숨이 걸린
  //    곳입니다. 그래서 미니앱에서는 "전화 걸기" 대신 번호를 복사할 수
  //    있게 내밉니다 — 눌렀는데 아무 일도 안 나는 것보다 낫습니다.
  const inToss = useAppsInToss()
  const [copied, setCopied] = useState<string | null>(null)
  // ⚠️ 첫 렌더에서 바로 읽습니다. 그린 뒤에 읽으면 닫아둔 안내가 한 번
  //    깜빡이고 사라집니다. 이 화면은 사용자가 물음을 던진 뒤에야 그려지는
  //    자리(클라이언트 상태)라, 서버가 그린 HTML 과 어긋날 일이 없습니다.
  const [dismissed, setDismissed] = useState(readDismissed)

  if (!audit || audit.level === "normal" || !audit.notice || dismissed) return null

  const hasResources = !!audit.resources && audit.resources.length > 0

  function close() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // 못 남기면 다음 화면에서 다시 보입니다. 닫히기는 하므로 그대로 둡니다.
    }
  }

  async function copyTel(tel: string) {
    try {
      await navigator.clipboard.writeText(tel)
      setCopied(tel)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // 복사도 막힌 환경입니다. 번호는 화면에 그대로 보이므로 눈으로
      // 읽어 걸 수 있습니다 — 아무 말도 하지 않는 것보다 낫습니다.
      setCopied(null)
    }
  }

  return (
    <div
      className={`${
        // 헤더(76)가 떠 있으므로 그 아래에 붙습니다. 글은 이 카드 밑으로
        // 흘러 지나가고, 반투명·블러라 가려도 읽힙니다.
        sticky ? "sticky top-[76px] z-30" : ""
      } mx-auto w-full max-w-[328px] ${className}`}
    >
      <div
        // 시안(26_선행) 그대로입니다 — 패딩 16/8, 사이 10, 모서리 8,
        // 테두리 #E2EBD7, 바탕 rgba(246,255,234,0.80), 블러 2.
        className="relative flex w-full flex-col items-center gap-2.5 rounded-lg border border-[#E2EBD7] bg-[rgba(246,255,234,0.80)] px-2 py-4 backdrop-blur-[2px]"
      >
        {/* 제목 — 명조 14/18 굵게, 가운데 */}
        <p className="text-center font-myeongjo text-[14px] font-bold leading-[18px] text-[#000]">
          {audit.notice}
        </p>

        {/* 연락처. 번호는 우리가 적어둔 것이고 모델이 만지지 않습니다.
            한 줄에 둘씩, 좁은 화면에서는 알아서 접힙니다. */}
        {hasResources && (
          <ul className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-1">
            {audit.resources?.map((resource) => (
              <li key={resource.tel}>
                {inToss ? (
                  <button
                    type="button"
                    onClick={() => void copyTel(resource.tel)}
                    className="text-[12px] font-normal leading-[18px] text-[#424242] underline underline-offset-2"
                  >
                    {resource.label} {resource.tel}
                    {copied === resource.tel ? " (복사했다냥)" : ""}
                  </button>
                ) : (
                  <a
                    href={`tel:${resource.tel.replace(/-/g, "")}`}
                    className="text-[12px] font-normal leading-[18px] text-[#424242] underline underline-offset-2"
                  >
                    {resource.label} {resource.tel}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 거절 대신 권함 — 이렇게 물으면 카드가 더 잘 답한다는 안내입니다.
            ⚠️ 연락처가 있는 자리(위기)에는 붙이지 않습니다. 그 카드는 번호를
               한눈에 보여주는 것이 할 일이라, 줄이 늘면 번호가 밀립니다
               (시안 26_선행도 제목과 번호뿐입니다). */}
        {!hasResources && audit.suggestion && (
          <p className="text-center text-[12px] font-normal leading-[18px] text-[#424242]">
            이렇게 물어도 좋다냥 — “{audit.suggestion}”
          </p>
        )}

        {/* 닫기 — 시안의 14×14 짜리입니다. 누르기 좋게 손 닿는 자리는
            넉넉히 잡고(패딩), 보이는 그림만 14 로 둡니다. */}
        <button
          type="button"
          onClick={close}
          aria-label="안내 닫기"
          className="absolute right-1 top-2.5 p-1.5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.16602 1.91797L11.8392 11.5912"
              stroke="#141414"
              strokeWidth="1.4"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
            <path
              d="M11.8398 1.92188L2.16664 11.5951"
              stroke="#141414"
              strokeWidth="1.4"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
