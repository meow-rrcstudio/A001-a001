// components/floating-reading-button.tsx
import Link from "next/link"
import { CharacterAvatar } from "@/components/character-avatar"
import { ACTIVE_CHARACTER } from "@/lib/character"

export function FloatingReadingButton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-6">
      <Link
        href="/tarot/reading"
        className="flex items-center gap-3 rounded-full border border-white bg-[rgba(250,249,245,0.7)] py-2 pl-2 pr-6 shadow-lg backdrop-blur-[7px] transition-transform hover:-translate-y-0.5"
      >
        <CharacterAvatar size={44} />
        <span className="font-serif text-lg text-black">Connect with {ACTIVE_CHARACTER.name}</span>
      </Link>
    </div>
  )
}