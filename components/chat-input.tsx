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
//
// ┌─ 왜 textarea 가 아니라 contenteditable 인가 ──────────────────────
// │ 아이폰 사파리는 입력칸(input·textarea)을 보면 키보드 위에 줄을 하나
// │ 얹습니다 — 왼쪽에 자동완성(열쇠·카드·위치), 오른쪽에 키보드 닫기.
// │ 타로 질문을 적는 칸에는 채워 넣을 게 없으니 자리만 먹고, 입력창이
// │ 키보드에서 그만큼 떠 보입니다.
// │
// │ autocomplete="off" 같은 속성으로는 없어지지 않습니다 (해봤습니다).
// │ 사파리가 그 줄을 붙이는 대상은 "폼 컨트롤"이고, contenteditable 은
// │ 폼 컨트롤이 아니라서 아예 대상이 아닙니다. 그래서 상자 자체를
// │ 바꿨습니다.
// │
// │ ⚠️ 대신 조심할 것이 하나 있습니다. React 가 타이핑 도중 DOM 글자를
// │    다시 쓰면 한글 조합이 깨집니다 ("안녕" 이 "ㅇㅏㄴ녕" 처럼).
// │    그래서 이 상자는 React 가 값을 그리지 않습니다. 글자는 브라우저가
// │    쓰고, 우리는 읽기만 합니다. 바깥 값과 어긋났을 때만(보낸 뒤 비우기
// │    등) 한 번 맞춥니다.
// └──────────────────────────────────────────────────────────────────
"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp } from "lucide-react"

/** 이보다 길어지면 상자는 그만 자라고 안에서 스크롤됩니다 */
const MAX_LINES = 8
const LINE_HEIGHT = 28

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  ariaLabel,
  tone = "raised",
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  ariaLabel: string
  /** 배경 — 흰 상자(raised) 또는 회색으로 눌러둔 것(muted) */
  tone?: "raised" | "muted"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isTouch, setIsTouch] = useState(false)
  // 조합 중(한글을 만들고 있는 중)에는 바깥으로 값을 올리지 않습니다.
  const composing = useRef(false)

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    setIsTouch(mql.matches)
    const listener = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])

  // 바깥 값과 상자 안 글자가 어긋났을 때만 맞춥니다.
  // (보낸 뒤 비우기·바깥에서 채워 넣기. 타이핑 중에는 둘이 같아서 건드리지 않습니다)
  useEffect(() => {
    const el = ref.current
    if (!el || composing.current) return
    if (el.innerText.replace(/\n$/, "") !== value) el.innerText = value
  }, [value])

  const canSend = value.trim().length > 0 && !disabled

  function read() {
    const el = ref.current
    if (!el) return
    // contenteditable 은 마지막에 줄바꿈 하나를 덧붙이는 브라우저가 있습니다.
    onChange(el.innerText.replace(/\n$/, ""))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return
    // 한글은 조합 중에도 엔터가 올라옵니다. 조합이 끝난 뒤에만 봅니다.
    if (e.nativeEvent.isComposing || composing.current) return
    // 모바일에서 엔터는 줄바꿈입니다 — 보내기는 버튼으로.
    if (isTouch || e.shiftKey) return
    e.preventDefault()
    if (canSend) onSubmit()
  }

  // 붙여넣기는 글자만 받습니다. 서식이 딸려 들어오면 상자 안이 엉킵니다.
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  return (
    // ┌─ 시안 실측 (2026-08 · Figma 가 뽑아준 CSS 그대로) ───────────────
    // │   border-radius : 8
    // │   border        : 1px solid #FFF
    // │   background    : rgba(255,255,255,0.60)
    // │   box-shadow    : 0 2px 6px 0 rgba(0,0,0,0.20)
    // │   backdrop-filter: blur(8px)
    // │   padding       : 4 4 4 8   → 보내기 단추(38) + 위아래 4 = 높이 46
    // └──────────────────────────────────────────────────────────────────
    //
    // ⚠️ 반투명 + 뒤흐림입니다. 예전에는 회색으로 눌러 두었는데(bg-muted),
    //    시안은 **뒤가 비쳐 보이는 유리**입니다 — 뒤에 깔린 칩이 살짝
    //    들여다보여야 "이 위에 떠 있는 것"으로 읽힙니다.
    //
    // ⚠️ backdrop-filter 는 조상에 transform·filter·opacity<1 이 있으면
    //    통째로 안 먹습니다. 이 입력창을 감싼 쪽은 marginBottom 으로
    //    키보드를 따라 움직이는데(translate 가 아니라 margin 이라) 괜찮습니다.
    //    감싸는 방식을 바꿀 일이 생기면 여기 흐림이 먼저 죽습니다.
    <div
      className={`relative flex flex-col justify-center rounded-[8px] border border-white shadow-[0_2px_6px_0_rgba(0,0,0,0.20)] backdrop-blur-lg transition-opacity focus-within:ring-2 focus-within:ring-accent/40 ${
        disabled ? "opacity-60" : ""
      } ${className}`}
      style={{
        // Tailwind 의 bg-white/60 로도 되지만, 시안 값을 그대로 읽히게
        // 적어둡니다 (tone 에 따라 갈리지 않는 하나의 값입니다).
        background: "rgba(255, 255, 255, 0.60)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
        padding: "4px 4px 4px 8px",
      }}
    >
      <div
        ref={ref}
        // plaintext-only: 굵게·색 같은 서식이 아예 들어올 수 없습니다.
        contentEditable={disabled ? false : "plaintext-only"}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        tabIndex={0}
        data-placeholder={placeholder}
        enterKeyHint="send"
        onInput={read}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
          read()
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        // ⚠️ 위아래 여백을 상자(padding 4)가 아니라 글자 쪽에서 냅니다.
        //    상자에 넉넉히 주면 보내기 단추(38)가 상자보다 커져서 삐져
        //    나옵니다 — 시안은 4 + 38 + 4 = 46 입니다.
        //    한 줄일 때 글자 28 + 위아래 4 = 36, 여기에 상자 padding 8 과
        //    테두리 2 를 더해 **46** 입니다 (border-box).
        //
        // 오른쪽은 보내기 단추 자리를 비웁니다 (38 + 오른쪽 4 + 사이 4).
        className="chat-composer block max-h-[50dvh] w-full overflow-y-auto whitespace-pre-wrap break-words bg-transparent py-1 pl-0 pr-[46px] text-reading leading-[28px] text-foreground outline-none"
        style={{ maxHeight: LINE_HEIGHT * MAX_LINES + 28 }}
      />
      <button
        type="button"
        onClick={() => canSend && onSubmit()}
        disabled={!canSend}
        aria-label="보내기"
        // 시안: 38×38, 상자 바깥에서 오른쪽 4 · 아래 4.
        // ⚠️ absolute 의 기준은 테두리 **안쪽**이라, 4 를 주면 바깥에서는
        //    5 가 됩니다 (테두리 1px 만큼). 그래서 3 입니다.
        className="absolute bottom-[3px] right-[3px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
