// components/floating-reading-button.tsx
import Link from "next/link"
import { CharacterAvatar } from "@/components/character-avatar"
import { ACTIVE_CHARACTER } from "@/lib/character"

export function FloatingReadingButton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-6">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-full border border-white bg-glass py-2 pl-2 pr-6 shadow-raised backdrop-blur-[var(--glass-blur)] transition-transform hover:-translate-y-0.5"
      >
        <CharacterAvatar size={44} />
        <span className="font-serif text-lg text-black">Connect with {ACTIVE_CHARACTER.name}</span>
      </Link>
    </div>
  )
}