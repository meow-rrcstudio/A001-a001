// components/page-header.tsx
"use client"

import Link from "next/link"
import { ArrowLeft, Share } from "lucide-react"

export function PageHeader({
  backHref,
  showShare = false,
  className = "",
}: {
  backHref: string
  showShare?: boolean
  className?: string
}) {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href })
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 무시
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Link
        href={backHref}
        className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="뒤로"
      >
        <ArrowLeft className="h-7 w-7" />
      </Link>

      {showShare && (
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex w-fit shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="공유"
        >
          <Share className="h-7 w-7" />
        </button>
      )}
    </div>
  )
}