// components/footer.tsx
// 시안(Site design.pdf)의 다크 브라운 푸터 밴드
export function Footer() {
  const year = new Date().getFullYear()

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
