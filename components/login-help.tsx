// components/login-help.tsx
// 로그인 화면의 물음표 — "왜 이렇게 물어보나요?"
//
// ┌─ 왜 두는가 ───────────────────────────────────────────────────────
// │ 로그인은 우리가 직접 하지 않고 Supabase 에 맡기고 있습니다. 그래서
// │ 인증 메일의 발신자와 링크 주소에 supabase.co 가 보입니다. 처음 보는
// │ 사람에게 그건 "여기 가입하면 정보가 어디로 새는 거 아냐"입니다.
// │
// │ 답답함도 마찬가지입니다 — 비밀번호가 틀렸는지 계정이 없는지 안
// │ 알려주고, 메일은 1분에 한 번만 나가고, 링크는 시간이 지나면 죽습니다.
// │ 하나하나 다 까닭이 있는데, 까닭을 말하지 않으면 그냥 못 만든
// │ 로그인입니다.
// │
// │ 그래서 숨기지 않고 적어 둡니다. 낯선 이름을 감추는 것보다 "그게
// │ 무엇이고 무엇을 맡기고 있는지" 말하는 편이 훨씬 안심됩니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 여기 적힌 숫자(1분·30분 같은 것)는 Supabase 대시보드 설정과 맞아야
//    합니다. 대시보드에서 값을 바꾸면 이 글도 함께 고치세요 —
//    Authentication → Rate Limits · Providers → Email.
//    그래서 아래에는 되도록 정확한 숫자 대신 "잠시"로 적었습니다.
//
// ⚠️ 개인정보 관련 문장은 /privacy 와 어긋나면 안 됩니다. 위탁 목록에
//    Supabase 가 "회원 인증, 데이터 보관"으로 적혀 있습니다 (제5조).
//    한쪽만 고치면 방침과 화면이 다른 말을 하게 됩니다.
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export function LoginHelp({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-brand-ink/70 underline underline-offset-4 hover:text-brand-ink ${className}`}
      >
        로그인이 왜 이렇게 물어보나요?
      </button>

      {open && <HelpSheet onClose={() => setOpen(false)} />}
    </>
  )
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // 열리면 닫기 단추로 초점을 옮깁니다. 화면읽개를 쓰는 분에게는 이게
  // "무언가 열렸다"는 유일한 신호입니다.
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Esc 로 닫기 + 뒤 화면이 따라 구르지 않게.
  //
  // ⚠️ 뒤 화면을 잠그지 않으면 손전화에서 이 판을 굴릴 때 뒤에 있는
  //    로그인 화면이 함께 움직여서, 닫았을 때 엉뚱한 자리에 가 있습니다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-help-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* 바깥을 눌러도 닫힙니다 */}
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* 시안과 같은 각진 흰 판. 길어질 수 있어 안에서 구릅니다. */}
      <div className="relative flex max-h-[85svh] w-full max-w-[480px] flex-col border border-brand-ink/70 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-brand-ink/15 px-5 py-4">
          <h2 id="login-help-title" className="text-[15px] font-semibold break-keep text-brand-ink">
            로그인이 왜 이렇게 물어보나요?
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 px-1 text-xs text-brand-ink/70 underline underline-offset-4 hover:text-brand-ink"
          >
            닫기
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5 text-[13px] leading-relaxed break-keep text-brand-ink/85">
          {/* 이것이 제일 앞입니다 — "정보가 새는 거 아냐"가 가장 무거운
              의심이고, 나머지는 불편일 뿐입니다. */}
          <Item q="인증 메일이 낯선 주소에서 와요. supabase 가 뭔가요?">
            저희가 <strong className="font-semibold text-brand-ink">회원 인증과 데이터 보관을 맡기고 있는 회사</strong>
            입니다. 로그인과 인증 메일이 그곳을 지나기 때문에 발신자나 링크 주소에{" "}
            <span className="whitespace-nowrap">supabase.co</span> 가 보일 수 있어요. 낯설지만
            정상입니다.
            <br />
            비밀번호는 저희도 원래 값을 볼 수 없는 형태로 저장되고, 어떤 정보를 얼마나 두는지는{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              개인정보처리방침
            </Link>
            에 전부 적어두었습니다.
            <Caution>
              반대로, <span className="whitespace-nowrap">supabase.co</span> 도{" "}
              <span className="whitespace-nowrap">soulseoul.xyz</span> 도 아닌 주소로 온 인증
              메일은 저희가 보낸 것이 아닙니다. 누르지 마세요.
            </Caution>
          </Item>

          <Item q="&ldquo;이메일이나 비밀번호가 맞지 않아요&rdquo; — 둘 중 뭔지 알려주면 안 되나요?">
            일부러 알려드리지 않습니다. 구분해서 말해 주면 아무 주소나 넣어보며{" "}
            <strong className="font-semibold text-brand-ink">누가 이 사이트에 가입했는지</strong>{" "}
            알아낼 수 있어요. 답답하시겠지만, 그 답답함이 다른 분의 이름을 가려 줍니다.
            <br />
            비밀번호가 기억나지 않으시면 <strong className="font-semibold text-brand-ink">
              비밀번호 찾기
            </strong>
            를 눌러주세요.
          </Item>

          <Item q="왜 인증 메일을 거치나요?">
            그 메일함이 정말 본인 것인지 확인하는 자리입니다. 이 자리가 없으면 남이 아무 주소로나
            계정을 만들 수 있고, 나중에 비밀번호를 잊었을 때 돌아올 길도 없어집니다.
          </Item>

          <Item q="메일이 안 와요">
            스팸함과 프로모션함을 봐주세요. 특히 네이버·다음 메일에서 자주 그리로 갑니다.
            거기에도 없으면 <strong className="font-semibold text-brand-ink">인증 메일 다시 받기</strong>
            를 눌러주세요.
          </Item>

          <Item q="메일을 너무 자주 보냈대요">
            한 주소로 메일이 몰려 나가지 않게 잠깐씩 막아둡니다. 남의 메일함을 저희 메일로 채우는
            데 쓰이면 안 되니까요. 잠시 뒤에 다시 누르시면 됩니다 — 몇 초 뒤에 눌러야 하는지는
            화면에 함께 적어드립니다.
          </Item>

          <Item q="링크가 만료됐대요. 시간을 늘릴 수 없나요?">
            인증 링크는 시간이 지나면 스스로 죽습니다. 메일함이 언젠가 남의 손에 들어가더라도 옛
            링크로는 들어올 수 없게 하려는 것이에요.
            <br />
            늘리는 방법은 없고, 필요도 없습니다 —{" "}
            <strong className="font-semibold text-brand-ink">인증 메일 다시 받기</strong>를 누르면
            새 링크가 갑니다. 새로 받는 것이 곧 연장입니다.
          </Item>

          <Item q="이 과정이 번거로우면">
            <strong className="font-semibold text-brand-ink">카카오나 구글로 계속하기</strong>를
            쓰시면 한 번에 끝납니다. 저희가 받는 것은 별명 정도이고, 비밀번호는 아예 주고받지
            않습니다.
          </Item>
        </div>
      </div>
    </div>
  )
}

function Item({ q, children }: { q: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-[13px] font-semibold text-brand-ink">{q}</h3>
      <p>{children}</p>
    </section>
  )
}

/** 조심할 것 — 문단 안에서 눈에 걸리게 */
function Caution({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-2 block border-l-2 border-brand-ink/30 pl-3 text-[12px] text-brand-ink/70">
      {children}
    </span>
  )
}
