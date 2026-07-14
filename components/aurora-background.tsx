// components/aurora-background.tsx
// 크림 배경 위에 은은하게 번지는 웜톤 그라데이션 (시안의 종이 질감 느낌)
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-20 left-1/4 h-64 w-64 animate-[drift-a_22s_ease-in-out_infinite] rounded-full bg-primary/8 blur-3xl sm:-top-40 sm:h-[36rem] sm:w-[36rem] sm:blur-[100px]" />
      <div className="absolute top-1/3 -right-16 h-56 w-56 animate-[drift-b_28s_ease-in-out_infinite] rounded-full bg-[oklch(0.8_0.08_80)]/15 blur-3xl sm:-right-32 sm:h-[30rem] sm:w-[30rem] sm:blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-52 w-52 animate-[drift-c_25s_ease-in-out_infinite] rounded-full bg-primary/6 blur-3xl sm:h-[28rem] sm:w-[28rem] sm:blur-[110px]" />
    </div>
  )
}
