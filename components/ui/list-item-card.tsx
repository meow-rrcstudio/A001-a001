// components/ui/list-item-card.tsx
// 목록 한 줄 — 제목 + 설명 + 출처 + 화살표.
//
// 홈의 카테고리 줄이 이걸 씁니다. 다른 목록에서도 같은 모양이 필요하면
// 여기를 가져다 쓰세요. 치수는 시안 사양 그대로입니다.
//
// ┌─ 시안 사양 ───────────────────────────────────────────────────────
// │ 바깥      가로 배치 · 상하좌우 24px · 사이 4px · 배경 없음
// │           글 영역이 늘어나고 화살표는 오른쪽 끝, 세로 가운데
// │ 글 영역   세로 배치 · 사이 4px
// │   제목      Nanum Myeongjo Bold 22px / 행간 130%
// │   설명      SF Pro Regular 14px / 행간 120%
// │   출처      SF Pro Regular 10px / 행간 100% · -출처- 형태
// │ 화살표    20×20 칸 안에 arrow-up-right
// └──────────────────────────────────────────────────────────────────
//
// 색은 전부 currentColor 를 따릅니다. 바깥에서 text-* 하나만 바꾸면
// 글자와 화살표가 함께 바뀌어, 다크모드나 반전 상태를 만들기 쉽습니다.
import { ArrowUpRight } from "lucide-react"

export function ListItemCard({
  title,
  description,
  source,
  /** 오른쪽→왼쪽으로 읽는 글(히브리어 등)이면 "rtl" */
  dir,
  className = "",
}: {
  title: string
  description: string
  /** 하이픈으로 감싸 보여줍니다. 없으면 그 줄이 생략됩니다 */
  source?: string
  dir?: "rtl" | "auto"
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1 p-6 ${className}`}>
      {/* 글 영역 — 남는 폭을 다 가져갑니다 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-myeongjo text-[22px] font-bold leading-[1.3]">{title}</p>

        <p dir={dir ?? "auto"} className="line-clamp-2 text-sm leading-[1.2]">
          {description}
        </p>

        {source && (
          <p dir={dir ?? "auto"} className="flex text-[10px] leading-none">
            <span aria-hidden="true">-</span>
            {source}
            <span aria-hidden="true">-</span>
          </p>
        )}
      </div>

      {/* 화살표 — 20×20 칸, 세로 가운데 */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <ArrowUpRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </span>
    </div>
  )
}
