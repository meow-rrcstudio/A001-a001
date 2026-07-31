import Link from "next/link"
import { allTarotCards } from "@/lib/tarot-cards"
import { TarotCardImage } from "@/components/tarot-card-image"
import { getAllSlugs } from "@/lib/notion"
import { PageHeader } from "@/components/page-header"
import { HEADER_SPACE } from "@/lib/layout"
import { PageBackground } from "@/components/page-background"
import { Footer } from "@/components/footer"
import { AdBand } from "@/components/ad-band"
// gemini 수정: Button 스타일 재사용을 위한 import
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ACTIVE_CHARACTER } from "@/lib/character"

export const revalidate = 3600

export default async function TarotListPage() {
  const publishedSlugs = await getAllSlugs()
  const publishedSet = new Set(publishedSlugs.map((s) => s.slug))

  return (
    <div className="flex min-h-screen flex-col">
      <PageBackground variant="aurora" />
      {/* 하단 여백은 광고 띠배너 래퍼(py-10)가 담당 — 40px 간격 유지 */}
      <main className={`relative z-10 mx-auto w-full max-w-site flex-1 px-6 sm:px-8 ${HEADER_SPACE}`}>
        <PageHeader backHref="/archive" />

        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Tarot</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            카드 한 장 한 장의 의미를 깊게 들여다보는 아카이브입니다.
          </p>

          <div className="mt-6 flex gap-4">
            <Link
              href="/archive"
              className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              → 글 목록으로 보기
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
          {allTarotCards.map((card) => {
            const isPublished = publishedSet.has(card.slug)

            // 비율은 저장된 카드 이미지(300x527)와 동일하게 — 다르면 잘리며 확대되어 보임.
            // 라인은 안쪽 border 가 아니라 바깥쪽 outline 으로 — 그림을 먹지 않음.
            // 카드 그림의 검정 외곽선에 맞춰 0.2px 블랙(헤어라인) · 라운드 6px
            const box =
              "group relative aspect-[300/527] overflow-hidden rounded-lg outline outline-[0.2px] outline-black bg-muted shadow-raised"

            const image = (
              <TarotCardImage
                src={card.imageUrl}
                alt={`${card.nameKo} (${card.nameEn})`}
                className={isPublished ? undefined : "opacity-40"}
              />
            )

            // ⚠️ 글이 없는 카드는 링크를 걸지 않습니다.
            //    예전에는 78장 모두에 링크가 걸려 있었고, 글이 없는 카드는
            //    흐리게만 그렸습니다. 그런데 흐린 것도 눌리기는 해서, 누르면
            //    "게시글을 찾을 수 없습니다"가 떴습니다 — 대부분의 카드가
            //    그랬습니다. 흐린 것은 "아직 없다"는 표시지 "눌러도 된다"는
            //    표시가 아닙니다.
            if (!isPublished) {
              return (
                <div
                  key={card.slug}
                  className={box}
                  title={`${card.nameKo} — 아직 글이 없어요`}
                  aria-label={`${card.nameKo} (${card.nameEn}) — 아직 글이 없어요`}
                >
                  {image}
                </div>
              )
            }

            return (
              <Link
                key={card.slug}
                href={`/blog/${card.slug}`}
                className={`${box} transition-transform hover:-translate-y-1`}
              >
                {image}
              </Link>
            )
          })}
        </div>
      </main>

      {/* 광고(카카오 애드핏) — 푸터 위, 본문(카드 그리드)과 같은 좌우 여백(px-6). 위아래 40px */}
      <div className="mx-auto w-full max-w-site px-6 py-10 sm:px-8">
        <AdBand adUnit="DAN-Cbt3AipfM4hs85GG" width={320} height={100} />
      </div>

      {/* gemini 수정: 기존 Floating 버튼 삭제 후 하단 고정 버튼 구현
          (이 버튼 컴포넌트는 asChild를 지원하지 않아, 같은 스타일을 Link에 직접 입힘) */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 px-6">
        {/* 이름은 캘리그라피(font-script), 뒤의 우리말은 본문 글꼴(SF Pro).
            이름은 lib/character.ts 한 곳에서 옵니다 — 캐릭터를 바꾸면
            이 버튼도 따라 바뀝니다.
            ⚠️ 캘리그라피는 같은 크기라도 훨씬 작아 보여서, 이름만 한 단계
               크게 잡아야 우리말과 눈높이가 맞습니다. */}
        <Link
          // 물어보러 가는 버튼이니 주제 고르는 화면으로 보냅니다.
          // 홈("/")으로 보내면 물어보려다 뒤로 간 것처럼 읽힙니다.
          href="/tarot/ask"
          className={cn(
            buttonVariants({ variant: "connect", size: "lg" }),
            "h-14 gap-0 rounded-full px-8 shadow-lg"
          )}
        >
          {/* 캘리그라피(Shadows Into Light)도 ā 를 제대로 그립니다 — 실제로
              찍어서 확인했습니다. 그래서 1순위 표기(name)를 씁니다.
              혹시 다른 글꼴로 바꿔 ā 가 깨지면 nameAscii 로 내리세요. */}
          <span className="font-script text-2xl leading-none">{ACTIVE_CHARACTER.name}</span>
          {/* connect 변형이 버튼 전체에 캘리그라피를 걸어두어서, 우리말은
              font-sans 로 되돌려야 합니다 (한글은 캘리그라피 글자가 없어
              그대로 두면 이상하게 대체됩니다) */}
          <span className="font-sans text-base font-medium leading-none">에게 물어보기</span>
        </Link>
      </div>

      <Footer variant="lime" />
    </div>
  )
}