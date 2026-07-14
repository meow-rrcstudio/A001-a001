//배경 그라데이션 정의 
// components/aurora-background.tsx
// components/aurora-background.tsx
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-20 left-1/4 h-64 w-64 animate-[drift-a_22s_ease-in-out_infinite] rounded-full bg-accent/30 blur-3xl sm:-top-40 sm:h-[36rem] sm:w-[36rem] sm:blur-[100px]" />
      <div className="absolute top-1/3 -right-16 h-56 w-56 animate-[drift-b_28s_ease-in-out_infinite] rounded-full bg-primary/25 blur-3xl sm:-right-32 sm:h-[30rem] sm:w-[30rem] sm:blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-52 w-52 animate-[drift-c_25s_ease-in-out_infinite] rounded-full bg-chart-2/20 blur-3xl sm:h-[28rem] sm:w-[28rem] sm:blur-[110px]" />
    </div>
  )
}