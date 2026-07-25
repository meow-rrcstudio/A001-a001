// components/footer.tsx
// 사이트 공용 푸터.
//
// 내용(주소·저작권·링크)은 한 벌만 있고, variant 는 "색"만 바꿉니다.
// 그래서 문구를 고치려면 아래 FooterContent 나 lib/site.ts 한 곳만 고치면
// 모든 페이지의 푸터가 함께 바뀝니다.
//
// · variant="lime"    : 라임 밴드 — 기본값 (홈·Archive·MY·Tarot·로그인)
// · variant="light"   : 배경색 그대로 (밝은 페이지)
// · variant="dark"    : 어두운 밴드 (대비가 필요할 때)
// · variant="minimal" : 손글씨 로고 + 한 줄 (블로그 본문·about·privacy)
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 문구·주소·저작권 : lib/site.ts
// │ · 위아래 여백      : py-10 (40px)
// │ · 주소 글꼴        : font-mono + tracking-[0.15em] (시안의 타자기 느낌)
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"
import { Wordmark } from "@/components/brand-mark"
import { SITE, copyrightLine } from "@/lib/site"

type Tone = {
  /** 푸터 바깥 배경·기본 글자색 */
  band: string
  /** 주소 줄 색 */
  url: string
  /** 저작권·링크 색 */
  sub: string
  /** 링크에 마우스를 올렸을 때 색 */
  hover: string
}

/** 푸터 내용 한 벌 — 모든 variant 가 이걸 공유합니다. */
function FooterContent({ tone }: { tone: Tone }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-10 text-center sm:px-6">
      <p
        className={`inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] ${tone.url}`}
      >
        <span aria-hidden="true">{SITE.star}</span>
        {SITE.displayUrl}
        <span aria-hidden="true">{SITE.star}</span>
      </p>

      <p className={`text-xs leading-relaxed ${tone.sub}`}>{copyrightLine()}</p>

      <p className={`text-xs ${tone.sub}`}>
        <Link href="/about" className={`underline underline-offset-4 transition-colors ${tone.hover}`}>
          About
        </Link>
        <span className="px-1">and</span>
        <Link
          href="/privacy"
          className={`underline underline-offset-4 transition-colors ${tone.hover}`}
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}

const tones: Record<"lime" | "light" | "dark", { band: string; tone: Tone }> = {
  // 라임 위에서는 회색 글자가 대비가 부족해 --brand-ink 를 씁니다
  lime: {
    band: "bg-brand-lime text-brand-ink",
    tone: {
      band: "",
      url: "",
      sub: "text-brand-ink/70",
      hover: "hover:text-brand-ink",
    },
  },
  light: {
    band: "",
    tone: {
      band: "",
      url: "text-foreground/80",
      sub: "text-muted-foreground",
      hover: "hover:text-foreground",
    },
  },
  dark: {
    band: "bg-foreground text-background",
    tone: {
      band: "",
      url: "",
      sub: "text-background/60",
      hover: "hover:text-background",
    },
  },
}

export function Footer({
  variant = "lime",
}: {
  variant?: "dark" | "light" | "minimal" | "lime"
}) {
  // 블로그 본문용 — 워드마크 + 한 줄. 내용은 같은 소스를 씁니다.
  if (variant === "minimal") {
    return (
      <footer className="mt-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <Wordmark className="h-8" />
          <p className="font-mono text-xs text-muted-foreground">{copyrightLine()}</p>
          <p className="text-xs text-muted-foreground">
            <Link href="/about" className="underline underline-offset-4 hover:text-foreground">
              About
            </Link>
            <span className="px-1">and</span>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    )
  }

  const { band, tone } = tones[variant]
  return (
    <footer className={`mt-16 ${band}`}>
      <FooterContent tone={tone} />
    </footer>
  )
}
