// components/provider-marks.tsx
// 로그인 버튼에 들어가는 공급자 심볼.
//
// 그림 파일 대신 SVG 로 그려 넣습니다 — 크기를 바꿔도 흐려지지 않고,
// 색을 바꿔야 하는 카카오 심볼은 currentColor 를 따르게 할 수 있습니다.
//
// ⚠️ 공식 자산으로 바꾸고 싶으면 /public 에 파일을 넣고 여기만 갈아끼우세요.
//    쓰는 쪽(components/login-form.tsx)은 손대지 않아도 됩니다.

/** 카카오 말풍선. 검정 버튼 위에 얹으므로 흰색(currentColor)을 따릅니다. */
export function KakaoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {/* 둥근 말풍선 + 왼쪽 아래로 흐르는 꼬리 */}
      <path d="M12 3C6.9 3 2.75 6.3 2.75 10.37c0 2.6 1.72 4.88 4.3 6.18-.19.68-.68 2.47-.78 2.85-.13.48.18.47.37.34.15-.1 2.4-1.63 3.38-2.3.64.09 1.3.14 1.98.14 5.1 0 9.25-3.3 9.25-7.21C21.25 6.3 17.1 3 12 3Z" />
    </svg>
  )
}

/**
 * 구글 G — 네 가지 색이 정해져 있어 currentColor 를 쓰지 않습니다.
 * (구글은 로고 색을 바꾸는 것을 허용하지 않습니다)
 */
export function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.17 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
