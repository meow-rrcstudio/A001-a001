// components/home-friends-grid.tsx
// 홈 아래쪽 "샨티와 친구들" — 아카이빙 배너 바로 다음 자리입니다.
//
// ┌─ 구조 ────────────────────────────────────────────────────────────
// │ 제목 줄 (가운데 정렬) + 2×2 격자
// │ 칸 하나 = 이름 + 픽셀 캐릭터 그림
// │ 좁은 화면은 이름 위 · 그림 아래, 넓은 화면은 이름 왼쪽 · 그림 오른쪽
// │
// │ 그림은 public/characters/*.svg (피그마에서 받은 도트 벡터)입니다.
// │ next/image 대신 <img> 를 쓰는 것은 도트가 흐려지지 않아야 하고,
// │ SVG 를 그대로 내보내는 것이 가장 또렷하기 때문입니다.
// └──────────────────────────────────────────────────────────────────

const FRIENDS = [
  { name: "샨티", src: "/characters/shanti.svg" },
  { name: "모루", src: "/characters/moru.svg" },
  { name: "포포", src: "/characters/popo.svg" },
  { name: "꼬리", src: "/characters/kkori.svg" },
] as const

export function HomeFriendsGrid() {
  return (
    <section aria-labelledby="home-friends-title" className="border-b border-black">
      {/* 제목 줄 — 아카이빙 검정 면 바로 아래에 붙습니다 */}
      <h2
        id="home-friends-title"
        className="border-b border-black px-6 py-4 text-center font-myeongjo text-lg font-bold text-black"
      >
        샨티와 친구들
      </h2>

      <div className="grid grid-cols-2">
        {FRIENDS.map((friend, i) => (
          <div
            key={friend.name}
            className={`flex min-w-0 flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
              i % 2 === 1 ? "border-l border-black" : ""
            } ${i > 1 ? "border-t border-black" : ""}`}
          >
            <p className="font-myeongjo text-xl font-bold leading-none text-black">
              {friend.name}
              <span aria-hidden="true">。</span>
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={friend.src}
              alt={`${friend.name} 캐릭터`}
              className="h-20 w-auto self-center sm:h-24 sm:self-auto"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
