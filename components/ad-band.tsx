// components/ad-band.tsx
// 광고 띠배너 — 화면 전체 폭의 색 띠 위에 광고를 가운데 배치합니다.
//
// 애드핏 광고 자체(320×50, 320×100)는 규정상 크기를 바꿀 수 없으므로,
// 광고 좌우의 남는 공간을 띠 배경색으로 채워 "늘어나는 띠배너"처럼 보이게 합니다.
// 높이는 광고 최대 높이로 고정되고, 노출할 광고가 없으면(NO-AD) 0으로 접힙니다.
//
// · 띠 배경색: bg-secondary/50 — 더 진하게는 /70, 다른 색은 bg-card 등으로 교체
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
    <div className={`flex w-full justify-center overflow-hidden bg-secondary/50 ${className ?? ""}`}>
      <AdFit adUnit={adUnit} width={width} height={height} />
    </div>
  )
}
