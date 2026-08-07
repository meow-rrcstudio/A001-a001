// components/reading-character-bubble.tsx
// 샨티의 말풍선. 클립보드 API가 막힌 환경(iOS 사파리 등)을 위한
// 텍스트 선택 방식 폴백이 포함된 버전입니다.
"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, Check } from "lucide-react"
import { TypewriterText } from "@/components/typewriter-text"
import { CharacterAvatar } from "@/components/character-avatar"
import { ACTIVE_CHARACTER, type CharacterProfile } from "@/lib/character"

export function ReadingCharacterBubble({
  message,
  character = ACTIVE_CHARACTER,
  promptText,
  onHeightChange,
  placement = "bottom",
}: {
  message: string
  character?: CharacterProfile
  promptText?: string
  onHeightChange?: (height: number) => void
  /**
   * 말풍선 위치.
   * · "bottom" (기본) — 화면 하단 고정. 카드 뽑기 화면처럼 아래에 붙어 있어야 할 때
   * · "top"           — 상단바 바로 아래에 놓이는 흰 말풍선 (시안의 리딩 화면 구성).
   *                      아바타·이름 없이 글만 들어갑니다.
   */
  placement?: "top" | "bottom"
}) {
  const [copied, setCopied] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bubbleRef.current || !onHeightChange) return
    const el = bubbleRef.current
    // 여백까지 포함한 실제 차지 높이(테두리 상자)를 넘깁니다.
    // contentRect 는 안쪽 글 높이만이라, 이 값을 믿고 화면을 나누면
    // 말풍선 여백만큼 넘쳐 스크롤이 생깁니다.
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const border = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize
        onHeightChange(border?.blockSize ?? entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onHeightChange])

  async function handleCopy() {
    if (!promptText) return

    try {
      // 방법 1: 최신 Clipboard API 시도 (권한이 있을 경우)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(promptText)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          return
        } catch (clipboardError) {
          console.warn("Clipboard API blocked, falling back to text selection method:", clipboardError)
          // 방법 2로 폴백
        }
      }

      // 방법 2: 텍스트 선택 방식 (더 호환성 높음)
      const textArea = document.createElement("textarea")
      textArea.value = promptText
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()

      try {
        const successful = document.execCommand("copy")
        if (successful) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          console.warn("execCommand('copy') returned false")
        }
      } catch (execCommandError) {
        console.error("execCommand failed:", execCommandError)
      } finally {
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  // 상단 배치 — 시안의 리딩 화면. 흰 말풍선에 글만 들어갑니다.
  //
  // ⚠️ promptText 를 빠뜨리지 마세요. 무료 흐름은 카드를 다 뒤집고 나면
  //    여기에 뜨는 프롬프트를 복사해서 외부 AI 에 붙여넣는 것이 전부입니다.
  //    이 블록이 없으면 무료 사용자는 아무것도 할 수 없습니다.
  if (placement === "top") {
    return (
      // ┌─ 시안 실측 (2026-08 · Figma 가 뽑아준 CSS 그대로) ─────────────
      // │   padding        : 16px 8px
      // │   border-radius  : 8
      // │   border         : 1px solid #FFF
      // │   background     : rgba(255,255,255,0.70)
      // │   box-shadow     : 0 2px 8px 0 rgba(0,0,0,0.14)
      // │   backdrop-filter: blur(2px)
      // └────────────────────────────────────────────────────────────────
      //
      // ⚠️ 입력창(0.60 · blur 8)보다 조금 더 진하고 덜 흐립니다. 위쪽은
      //    라임 헤더가 뒤에 있어 많이 흐리면 색만 탁해지고, 아래쪽은 흰
      //    칩이 지나가서 더 흐려야 글자가 읽힙니다. 두 값을 맞추지 마세요.
      <div
        ref={bubbleRef}
        className="rounded-[8px] border border-white shadow-[0_2px_8px_0_rgba(0,0,0,0.14)]"
        style={{
          padding: "16px 8px",
          background: "rgba(255, 255, 255, 0.70)",
          WebkitBackdropFilter: "blur(2px)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-h-[1.5em] flex-1 text-[15px] leading-relaxed text-foreground">
            <TypewriterText text={message} />
          </p>
          {promptText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="프롬프트 복사"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={copied ? "복사되었습니다!" : "프롬프트를 클립보드에 복사"}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>

        {promptText && (
          <>
            {/* 클립보드가 막힌 환경(iOS 사파리 등)에서는 여기를 길게 눌러
                직접 선택해 복사합니다. 그래서 글이 다 보여야 합니다. */}
            <div className="mt-3 max-h-56 select-all overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {promptText}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "복사했어냥!" : "프롬프트 복사하기"}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={bubbleRef}
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-site px-6 pb-6 transition-[height] duration-300 ease-out sm:px-8"
    >
      <div className="rounded-[20px] border border-white bg-glass px-4 pb-4 pt-2 shadow-raised backdrop-blur-[var(--glass-blur)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CharacterAvatar size={44} character={character} />
            <span className="font-serif text-2xl leading-none text-black">{character.name}</span>
          </div>
          {promptText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="프롬프트 복사"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              title={copied ? "복사되었습니다!" : "프롬프트를 클립보드에 복사"}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>

        <p className="min-h-[1.5em] text-base leading-relaxed text-black">
          <TypewriterText text={message} />
        </p>

        {promptText && (
          <div className="mt-3 max-h-40 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-black/5 p-3 font-mono text-xs leading-relaxed text-black/70">
            {promptText}
          </div>
        )}
      </div>
    </div>
  )
}
