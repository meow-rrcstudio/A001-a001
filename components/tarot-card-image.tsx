// components/tarot-card-image.tsx
"use client"

import { useState } from "react"
import Image from "next/image"

export function TarotCardImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20 p-2 text-center text-xs text-muted-foreground">
        {alt}
      </div>
    )
  }

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      fill
      sizes="(max-width: 768px) 33vw, 220px"
      className={`object-cover transition-opacity group-hover:opacity-80 ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  )
}