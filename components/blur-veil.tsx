// components/blur-veil.tsx
// 흐림 장막 — 위층(헤더·말풍선·입력창) 뒤로 지나가는 내용을 덮습니다.
//
// ┌─ 왜 한 겹으로는 안 되는가 ────────────────────────────────────────
// │ backdrop-blur 를 걸어둔 네모 한 장은 가장자리에서 흐림이 뚝 끊깁니다.
// │ 흐린 쪽과 또렷한 쪽 사이에 자를 대고 그은 듯한 선이 생깁니다 —
// │ 덮으려던 것보다 그 선이 더 눈에 띕니다.
// │
// │ 그래서 흐림이 다른 판을 여러 겹 겹치고, 겹마다 사라지는 지점을
// │ 달리 둡니다. 진한 흐림은 일찍 사라지고 옅은 흐림은 끝까지 남아서,
// │ 흐림의 세기 자체가 서서히 옅어집니다. 경계가 없습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ mask-image 는 -webkit- 접두사를 함께 적어야 합니다. 사파리가 아직
//    접두사 없는 이름을 안 봅니다 — 빠뜨리면 아이폰에서 장막이 화면을
//    통째로 덮어 그 아래가 안 보입니다.
"use client"

/** 겹마다 (흐림 정도, 어디까지 남는지 %) */
const LAYERS = [
  { blur: 16, until: 34 },
  { blur: 7, until: 67 },
  { blur: 2.5, until: 100 },
] as const

export function BlurVeil({
  /** 화면 어느 쪽에 붙는가 — 흐림이 그쪽에서 가장 진합니다 */
  side,
  /** 장막 높이(px). 덮을 것(헤더+말풍선 / 입력창)보다 넉넉히 잡으세요 */
  height,
  /**
   * 흐림 위에 얹는 옅은 색 (시안 실측).
   *
   * ⚠️ 흐리기만 해서는 모자랍니다. 흐려진 칩은 여전히 대비가 남아 있어서
   *    말풍선 글자와 겹쳐 읽히고, 특히 검정 주제 칩이 뒤로 지나갈 때
   *    글자가 얼룩덜룩해집니다. 아주 옅은 색을 한 겹 얹으면 그 대비가
   *    가라앉습니다.
   *
   * ⚠️ 제일 진한 곳도 40% 입니다. 그 이상 올리면 "뒤에 뭔가 지나간다"는
   *    깊이감이 사라지고 그냥 막힌 벽이 됩니다 (시안 메모: "살짝 뒤에
   *    뎁스 — 칩이나 내용들이 보임").
   *
   * ⚠️ 이 색은 **말풍선·입력창보다 뒤**에 깔립니다. 장막은 z-20 이고
   *    위층은 z-30 이라 그렇습니다. 앞으로 오면 말풍선이 탁해집니다.
   */
  tint = true,
}: {
  side: "top" | "bottom"
  height: number
  tint?: boolean
}) {
  // 위 장막은 위가 진하고 아래로 사라지고, 아래 장막은 그 반대입니다.
  const towards = side === "top" ? "to bottom" : "to top"
  // 색도 같은 방향입니다 — 화면 가장자리 쪽이 진합니다.
  const tintGradient = `linear-gradient(${towards}, rgba(197,195,187,0.40) 0%, rgba(197,195,187,0.00) 100%)`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-20"
      style={{ [side]: 0, height, background: tint ? tintGradient : undefined }}
    >
      {LAYERS.map((layer) => {
        // 절반쯤 지난 뒤부터 사라지기 시작합니다. 처음부터 옅어지게 하면
        // 정작 덮어야 할 자리(헤더 · 입력창 바로 뒤)가 먼저 얇아집니다.
        const fadeFrom = layer.until * 0.45
        const mask = `linear-gradient(${towards}, #000 0%, #000 ${fadeFrom}%, transparent ${layer.until}%)`
        return (
          <div
            key={layer.blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${layer.blur}px)`,
              WebkitBackdropFilter: `blur(${layer.blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
    </div>
  )
}
