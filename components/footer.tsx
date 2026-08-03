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
import { BusinessInfo } from "@/components/business-info"
import { SITE, copyrightLine } from "@/lib/site"

/**
 * 푸터에 다는 문서 링크.
 *
 * 약관·개인정보·환불은 유료 판매를 하는 이상 "어느 페이지에서든 닿을 수
 * 있어야" 하는 것들이라 푸터에 둡니다. 한 줄이 길어져도 나누지 않습니다 —
 * 나누면 어느 줄에 무엇이 있는지 눈이 한 번 더 헤맵니다.
 */
const LINKS = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund", label: "환불정책" },
] as const

function FooterLinks({ hover }: { hover: string }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs">
      {LINKS.map((link, i) => (
        <span key={link.href} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">·</span>}
          <Link
            href={link.href}
            className={`underline underline-offset-4 transition-colors ${hover}`}
          >
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  )
}

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
    <div className="mx-auto flex max-w-site flex-col items-center gap-2 px-4 py-10 text-center sm:px-6" style={{ paddingTop: 0 }}>
      <p
        className={`inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] ${tone.url}`}
      >
        <span aria-hidden="true">{SITE.star}</span>
        {SITE.displayUrl}
        <span aria-hidden="true">{SITE.star}</span>
      </p>

      <p className={`text-xs leading-relaxed ${tone.sub}`}>{copyrightLine()}</p>

      <div className={tone.sub}>
        <FooterLinks hover={tone.hover} />
      </div>

      <BusinessInfo className={tone.sub} />
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
        <div className="mx-auto flex max-w-site flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <Wordmark className="h-8" />
          <p className="font-mono text-xs text-muted-foreground">{copyrightLine()}</p>
          <div className="text-muted-foreground">
            <FooterLinks hover="hover:text-foreground" />
          </div>
          <BusinessInfo className="text-muted-foreground" />
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
