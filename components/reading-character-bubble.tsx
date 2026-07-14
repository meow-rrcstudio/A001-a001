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
}: {
  message: string
  character?: CharacterProfile
  promptText?: string
  onHeightChange?: (height: number) => void
}) {
  const [copied, setCopied] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bubbleRef.current || !onHeightChange) return
    const el = bubbleRef.current
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height)
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

  return (
    <div
      ref={bubbleRef}
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-3xl px-6 pb-6 transition-[height] duration-300 ease-out sm:px-8"
    >
      <div className="rounded-[20px] border border-white bg-[rgba(250,249,245,0.7)] px-4 pb-4 pt-2 shadow-lg backdrop-blur-[7px]">
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
