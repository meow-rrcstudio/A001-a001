// components/footer.tsx
// 사이트 공용 푸터. 두 가지 버전을 케이스에 따라 골라 씁니다.
//
// · variant="dark"  (기본) : 다크 브라운 밴드 — Site design.pdf 홈 하단
//   사용 예) 홈처럼 화면을 묵직하게 마무리하고 싶은 페이지
// · variant="light"        : 크림 배경 위 가운데 정렬 — blog-post-list 시안
//   사용 예) 목록·본문처럼 가볍게 끝나는 페이지
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 다크 밴드 배경   : bg-foreground (글자색과 같은 다크 브라운)
// │ · 위아래 여백      : py-10 (40px)
// │ · URL 자간         : tracking-[0.25em] — 숫자를 줄이면 좁아짐
// │ · 카피라이트 흐림  : 다크 text-background/70 · 라이트 text-muted-foreground
// └──────────────────────────────────────────────────────────────────
export function Footer({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const year = new Date().getFullYear()

  if (variant === "light") {
    return (
      <footer className="mt-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-10 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-foreground">
            <span aria-hidden="true">✳</span>
            www.soulseoul.xyz
            <span aria-hidden="true">✳</span>
          </p>
          <p className="text-xs text-muted-foreground">
            © {year} Soul Seoul Shānti Archive. All Rights Reserved.
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="mt-16 bg-foreground text-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1.5 px-4 py-10 text-center sm:px-6">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em]">
          <span aria-hidden="true">✳</span>
          www.soulseoul.xyz
          <span aria-hidden="true">✳</span>
        </p>
        <p className="text-xs text-background/70">
          © {year} Soul Seoul Shānti Archive. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}
