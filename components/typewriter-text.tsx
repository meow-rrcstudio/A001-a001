// components/typewriter-text.tsx
"use client"

import { useEffect, useState } from "react"

export function TypewriterText({ text, speed = 28 }: { text: string; speed?: number }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return <span>{text.slice(0, visibleCount)}</span>
}