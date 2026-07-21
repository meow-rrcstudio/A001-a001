"use client"

// components/adfit.tsx
// 카카오 애드핏(Kakao AdFit) 광고 컴포넌트
//
// [중요] 애드핏 심사 크롤러는 페이지의 "원본 HTML"에서
// <ins class="kakao_ad_area"> 태그가 있는지 확인합니다.
// 그래서 이 태그는 자바스크립트로 나중에 끼워넣지 않고,
// 서버 렌더링(SSR) 단계에서 HTML 안에 미리 그려지도록 JSX 로 직접 둡니다.
// (예전처럼 useEffect 안에서 document.createElement 로 만들면
//  자바스크립트를 실행하지 않는 크롤러는 광고를 "미설치"로 판정합니다.)
//
// 광고를 실제로 채워주는 스크립트(ba.min.js)만 마운트 시점에 불러옵니다.
// data-ad-unit / data-ad-width / data-ad-height 값은 애드핏 가이드에 따라
// 절대 임의로 변경하면 안 됩니다.

import { useEffect, useState } from "react"

interface AdFitProps {
  /** 애드핏에서 발급받은 광고단위 ID (예: DAN-xxxxxxxx) */
  adUnit: string
  /** 광고단위 가로 사이즈 (px) */
  width: number
  /** 광고단위 세로 사이즈 (px) */
  height: number
  /** 추가 클래스 (정렬 등) */
  className?: string
}

export function AdFit({ adUnit, width, height, className }: AdFitProps) {
  // NO-AD(노출할 광고 없음) 여부 → 빈 박스 높이만 접음(태그 자체는 유지)
  const [noAd, setNoAd] = useState(false)

  // onfail 콜백명을 광고단위별로 고유하게 만들어 충돌 방지
  const callbackName = `adfitOnFail_${adUnit.replace(/[^a-zA-Z0-9]/g, "")}`

  useEffect(() => {
    // NO-AD 콜백: 광고가 없으면 영역 높이만 접습니다(요소는 그대로 둠).
    ;(window as unknown as Record<string, unknown>)[callbackName] = () => {
      setNoAd(true)
    }

    // 광고 로딩 스크립트(ba.min.js). 이 스크립트가 페이지의 kakao_ad_area 를 찾아 채웁니다.
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true
    script.charset = "utf-8"
    script.src = "https://t1.kakaocdn.net/kas/static/ba.min.js"
    document.body.appendChild(script)

    return () => {
      script.remove()
      delete (window as unknown as Record<string, unknown>)[callbackName]
    }
    // adUnit 이 바뀌면(라우트 전환 등) 스크립트를 다시 불러 재실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adUnit])

  return (
    <div
      className={className}
      // 광고 로딩 전 레이아웃 시프트(CLS) 방지용 최소 높이. NO-AD 시 0 으로 접음.
      style={{ minHeight: noAd ? 0 : height, maxWidth: width, width: "100%" }}
      aria-label="광고"
    >
      {/* 심사 크롤러가 원본 HTML 에서 바로 감지할 수 있도록 SSR 로 그려지는 광고 태그 */}
      <ins
        className="kakao_ad_area"
        style={{ display: "none", width: "100%" }}
        data-ad-unit={adUnit}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
        data-ad-onfail={callbackName}
      />
    </div>
  )
}
