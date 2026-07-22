// components/ad-band.tsx
// 광고 띠배너 — 부모 폭을 가득 채우는 띠 위에 광고를 가운데 배치합니다.
//
// 애드핏 광고 자체(320×50, 320×100)는 규정상 크기를 바꿀 수 없으므로,
// 광고 좌우의 남는 공간을 띠 배경색으로 채워 "늘어나는 띠배너"처럼 보이게 합니다.
// 높이는 광고 최대 높이로 고정되고, 노출할 광고가 없으면(NO-AD) 0으로 접힙니다.
//
// · 배경: 투명 — 광고가 페이지 배경 위에 그대로 떠 있어 "박스에 담긴" 느낌이
//   없습니다. 색 띠가 필요하면 className 으로 bg-* 를 넘겨 켤 수 있어요.
// · 광고 크기: 애드핏 규정상 광고를 늘리거나 변형하면 안 됩니다(승인 취소 사유).
// · 띠의 폭: 부모를 따라갑니다. 본문 여백에 맞추려면 본문과 같은
//   컨테이너(max-w·px)로 감싸서 쓰세요.
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
    <div className={`flex w-full justify-center overflow-hidden ${className ?? ""}`}>
      <AdFit adUnit={adUnit} width={width} height={height} />
    </div>
  )
}
