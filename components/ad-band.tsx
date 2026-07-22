// components/ad-band.tsx
// 광고 띠배너 — 부모 폭을 가득 채우는 띠 위에 광고를 가운데 배치합니다.
//
// 애드핏 광고 자체(320×50, 320×100)는 규정상 크기를 바꿀 수 없으므로,
// 광고 좌우의 남는 공간을 띠 배경색으로 채워 "늘어나는 띠배너"처럼 보이게 합니다.
// 높이는 광고 최대 높이로 고정되고, 노출할 광고가 없으면(NO-AD) 0으로 접힙니다.
//
// · 띠 배경색: 흰색 — 애드핏 광고 소재 대부분이 흰 바탕이라 광고가 자연스럽게
//   이어져 보입니다. (광고 안의 실제 색을 읽어오는 건 보안상 불가능)
// · 띠의 폭: 부모를 따라갑니다. 본문 여백에 맞추려면 본문과 같은
//   컨테이너(max-w·px)로 감싸서 쓰세요. 홈 최상단처럼 전체 폭도 가능.
import { AdFit } from "@/components/adfit"

export function AdBand({
  adUnit,
  width,
  height,
  className,
}: {
  adUnit: string
  width: number
  height: number
  className?: string
}) {
  return (
    <div className={`flex w-full justify-center overflow-hidden bg-white ${className ?? ""}`}>
      <AdFit adUnit={adUnit} width={width} height={height} />
    </div>
  )
}
