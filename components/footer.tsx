// components/footer.tsx
// 블로그 하단에 표시되는 푸터입니다.
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
        <p>
          {`© ${year} Reading the Unknown Blog by `}
            <a
            href="mailto:aree.trip@gmail.com"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:opacity-80"
          >
            R Han
          </a>
          {`. All rights reserved.`}
        </p>
        <p>Powered by Next.js &amp; Notion API.</p>
      </div>
    </footer>
  )
}