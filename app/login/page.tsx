// app/login/page.tsx
// [목업] 로그인 · 회원가입 화면 — 클로드 로그인처럼 미니멀하게, Soul Seoul 크림 톤으로.
// 아직 실제 구글 로그인은 연결되지 않았고, 버튼을 누르면 상담소로 이동만 합니다(데모).
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* 브랜드 마크 */}
        <div className="mb-10 text-center">
          <span aria-hidden="true" className="font-serif text-3xl text-primary">
            ✳
          </span>
        </div>

        {/* 큰 헤드라인 — 얇은 세리프 이탤릭 */}
        <h1 className="text-center font-serif text-4xl italic leading-tight text-foreground">
          당신의 이야기를
          <br />
          펼쳐보세요
        </h1>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          카드가 건네는 조용한 대화, Soul Seoul
        </p>

        {/* 로그인 카드 */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <Link
            href="/counsel"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span aria-hidden="true" className="font-bold">
              G
            </span>
            Google로 계속하기
          </Link>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground/60">
            <span className="h-px flex-1 bg-border" />
            또는
            <span className="h-px flex-1 bg-border" />
          </div>

          <input
            type="email"
            placeholder="이메일을 입력하세요"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <Link
            href="/counsel"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            이메일로 계속하기
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
          계속하면{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}
