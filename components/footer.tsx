// components/footer.tsx
// 사이트 공용 푸터. 4가지 버전을 페이지 케이스에 따라 골라 씁니다.
//
// · variant="light"          : 크림 배경 가운데 정렬 — 시안의 "홈" 하단
// · variant="lime"           : 라임 밴드 — 현재 기본값 (홈·Archive·MY·Tarot)
// · variant="dark"           : 다크 브라운 밴드 — 대비가 강한 밴드가 필요할 때 쓰는 예비
// · variant="minimal"        : 세리프 로고 + 한 줄 카피라이트 — 시안의 "블로그 본문" 하단
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 다크 밴드 배경   : bg-foreground (글자색과 같은 다크 브라운)
// │ · 위아래 여백      : py-10 (40px)
// │ · URL 글꼴         : font-mono + tracking-[0.15em] (시안의 타자기 느낌)
// │ · 카피라이트 흐림  : 다크 text-background/60 · 라이트 text-muted-foreground
// └──────────────────────────────────────────────────────────────────
import Link from "next/link"

// about·privacy statement 링크 — 모든 푸터 버전에 공통으로 들어갑니다 (애드센스 심사 요건)
function PrivacyLink({ className = "" }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Link
        href="/about"
        className={`text-xs underline underline-offset-4 transition-colors ${className}`}
      >
        about
      </Link>
      <Link
        href="/privacy"
        className={`text-xs underline underline-offset-4 transition-colors ${className}`}
      >
        privacy statement
      </Link>
    </span>
  )
}

export function Footer({
  variant = "dark",
}: {
  variant?: "dark" | "light" | "minimal" | "lime"
}) {
  const year = new Date().getFullYear()

  // 라임 밴드 — 시안(Site Redesign)의 기본 푸터입니다.
  // 글자는 --brand-ink(#333)로 둡니다. 라임 위 회색 글자는 대비가 부족해요.
  if (variant === "lime") {
    return (
      <footer className="mt-16 bg-brand-lime text-brand-ink">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5 px-4 py-10 text-center sm:px-6">
          <p className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
            <span aria-hidden="true">✳</span>
            www.soulseoul.xyz
            <span aria-hidden="true">✳</span>
          </p>
          <div className="text-sm leading-relaxed text-brand-ink/70">
            <p>© {year} Meow RRC Studio. Soul Seoul Archive.</p>
            <p>All Rights Reserved</p>
          </div>
          <PrivacyLink className="text-brand-ink/70 hover:text-brand-ink" />
        </div>
      </footer>
    )
  }

  // 블로그 본문용 — 세리프 로고 + 한 줄 카피라이트
  if (variant === "minimal") {
    return (
      <footer className="mt-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <p className="font-script text-3xl text-foreground">Soul Seoul</p>
          <p className="font-mono text-xs text-muted-foreground">
            © {year} Shānti Archive. All Rights Reserved.
          </p>
          <PrivacyLink className="text-muted-foreground/70 hover:text-foreground" />
        </div>
      </footer>
    )
  }

  // 홈용 — 크림 배경 위 가운데 정렬
  if (variant === "light") {
    return (
      <footer className="mt-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5 px-4 py-10 text-center sm:px-6">
          <p className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] text-foreground/80">
            <span aria-hidden="true">✳</span>
            www.soulseoul.xyz
            <span aria-hidden="true">✳</span>
          </p>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p>© {year} Soul Seoul Shānti Archive</p>
            <p>All Rights Reserved</p>
          </div>
          <PrivacyLink className="text-muted-foreground/70 hover:text-foreground" />
        </div>
      </footer>
    )
  }

  // 목록용 (기본) — 다크 브라운 밴드
  return (
    <footer className="mt-16 bg-foreground text-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5 px-4 py-10 text-center sm:px-6">
        <p className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
          <span aria-hidden="true">✳</span>
          www.soulseoul.xyz
          <span aria-hidden="true">✳</span>
        </p>
        <div className="text-sm leading-relaxed text-background/60">
          <p>© {year} Soul Seoul Shānti Archive</p>
          <p>All Rights Reserved</p>
        </div>
        <PrivacyLink className="text-background/50 hover:text-background" />
      </div>
    </footer>
  )
}
