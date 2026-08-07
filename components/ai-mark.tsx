// components/ai-mark.tsx
// AI 표 — 아리님이 올려주신 AI.svg 를 컴포넌트로 옮긴 것입니다.
//
// ⚠️ 색을 currentColor 로 바꾸지 않았습니다. 물음표(icon-question)와 다른
//    점입니다. 이 표는 옆 글씨를 따라가면 안 됩니다 — 회색 글씨 옆에서
//    회색이 되면 그냥 장식으로 보이고, "AI 가 지었다"는 표시가 눈에 안
//    들어옵니다. 법이 요구하는 것은 **알아볼 수 있는** 표시입니다.
//    파랑(#0088FF)은 시안이 정한 값이고 그대로 둡니다.
//
// ⚠️ 13×10 은 원본 크기입니다. 키우지 마세요 — 커지면 샨티의 분위기를
//    깨고, 작아지면 표시 구실을 못 합니다 (components/ai-badge.tsx 머리말).
export function AiMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="13"
      height="10"
      viewBox="0 0 13 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // 옆에 "샨티의 리딩" 이라는 글씨가 이미 있어서, 읽어주는 기계에는
      // 이 그림을 따로 알리지 않습니다 (같은 말을 두 번 하게 됩니다).
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <rect width="12.322" height="10" rx="2" fill="#0088FF" fillOpacity="0.12" />
      <path d="M8.09375 7.5V2.5H9.32201V7.5H8.09375Z" fill="#0088FF" />
      <path
        d="M4.09783 6.11957L3.68478 7.5H3L4.52174 2.5H5.94565L7.59748 7.5H6.30435L5.8913 6.11957H4.09783ZM5 3.1087L4.27174 5.53261H5.71739L5 3.1087Z"
        fill="#0088FF"
      />
    </svg>
  )
}
