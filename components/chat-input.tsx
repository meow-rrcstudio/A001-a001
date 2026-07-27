// components/chat-input.tsx
// 질문·면담에 함께 쓰는 입력 상자입니다. 두 화면이 같은 것을 보도록
// 여기 한 곳에만 둡니다 (진입 화면의 "무엇이든 물어보세요", 해석 화면의
// "Shānti-에게 응답하기").
//
// ┌─ 하는 일 ─────────────────────────────────────────────────────────
// │ · 글이 길어지면 상자가 함께 늘어납니다 (최대 MAX_LINES 줄, 그 뒤 스크롤)
// │ · 보내기 버튼이 상자 안 오른쪽 아래에 붙습니다
// │ · PC 는 엔터로 보내고 Shift+엔터로 줄바꿈, 모바일은 엔터가 줄바꿈이고
// │   보내기는 버튼으로 (모바일에서 엔터가 전송이면 줄을 못 바꿉니다)
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUp } from "lucide-react"
import { KEYBOARD_ONLY_INPUT_PROPS } from "@/lib/layout"

/** 이보다 길어지면 상자는 그만 자라고 안에서 스크롤됩니다 */
const MAX_LINES = 8

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  ariaLabel,
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  ariaLabel: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    setIsTouch(mql.matches)
    const listener = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])

  // 글자 수에 맞춰 높이를 다시 잽니다.
  // 한 번 auto 로 되돌려야 줄어들 때도 따라옵니다 (안 그러면 계속 커지기만 함).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const padding = el.offsetHeight - el.clientHeight + 24 // 테두리 + 위아래 여백
    const max = lineHeight * MAX_LINES + padding
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden"
  }, [value])

  const canSend = value.trim().length > 0 && !disabled

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return
    // 한글은 조합 중에도 엔터가 올라옵니다. 조합이 끝난 뒤에만 봅니다.
    if (e.nativeEvent.isComposing) return
    // 모바일에서 엔터는 줄바꿈입니다 — 보내기는 버튼으로.
    if (isTouch || e.shiftKey) return
    e.preventDefault()
    if (canSend) onSubmit()
  }

  return (
    // ⚠️ <form> 으로 감싸지 않습니다. iOS 는 폼 안의 입력칸을 보면 키보드 위에
    //    자동완성 줄(암호·카드·연락처)을 얹습니다. lib/layout.ts 참고.
    <div
      className={`relative rounded-2xl bg-card shadow-raised transition-opacity focus-within:ring-2 focus-within:ring-accent/40 ${
        disabled ? "opacity-60" : ""
      } ${className}`}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        {...KEYBOARD_ONLY_INPUT_PROPS}
        // 오른쪽은 보내기 버튼 자리를 비웁니다.
        className="block max-h-[50dvh] w-full resize-none bg-transparent py-3.5 pl-5 pr-14 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={() => canSend && onSubmit()}
        disabled={!canSend}
        aria-label="보내기"
        className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
