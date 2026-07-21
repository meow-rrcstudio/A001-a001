"use client"

// components/adfit.tsx
// 카카오 애드핏(Kakao AdFit) 광고 컴포넌트
//
// 애드핏은 <ins class="kakao_ad_area"> 태그가 DOM 에 먼저 존재한 뒤
// ba.min.js 스크립트가 실행되어야 정상적으로 광고를 채워줍니다.
// React/Next.js(SPA)에서는 라우트 전환 시 스크립트가 다시 실행되지 않으면
// 광고가 노출되지 않으므로, 마운트 시점에 ins + script 를 직접 주입합니다.
//
// 주의: data-ad-unit / data-ad-width / data-ad-height 값은
// 애드핏 가이드에 따라 절대 임의로 변경하면 안 됩니다.

import { useEffect, useRef, useState } from "react"

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
  // ins 태그를 담을 컨테이너
  const containerRef = useRef<HTMLDivElement>(null)
  // NO-AD(노출할 광고 없음) 여부 → 빈 박스 높이만 접음(요소 자체는 유지)
  const [noAd, setNoAd] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 콜백 함수명을 광고단위별로 고유하게 만들어 충돌을 방지합니다.
    const callbackName = `adfitOnFail_${adUnit.replace(/[^a-zA-Z0-9]/g, "")}`

    // NO-AD 콜백: 광고가 없으면 영역을 숨깁니다.
    ;(window as unknown as Record<string, unknown>)[callbackName] = () => {
      setNoAd(true)
    }

    // ins 태그 생성
    const ins = document.createElement("ins")
    ins.className = "kakao_ad_area"
    ins.style.display = "none"
    ins.setAttribute("data-ad-unit", adUnit)
    ins.setAttribute("data-ad-width", String(width))
    ins.setAttribute("data-ad-height", String(height))
    ins.setAttribute("data-ad-onfail", callbackName)

    // 광고 로딩 스크립트 생성 (비동기)
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true
    script.charset = "utf-8"
    script.src = "https://t1.kakaocdn.net/kas/static/ba.min.js"

    container.appendChild(ins)
    container.appendChild(script)

    // 언마운트 시 정리 (라우트 전환 시 중복 방지)
    return () => {
      container.innerHTML = ""
      delete (window as unknown as Record<string, unknown>)[callbackName]
    }
  }, [adUnit, width, height])

  // NO-AD 라도 <ins class="kakao_ad_area"> 는 DOM 에 그대로 둡니다.
  // (요소를 제거하면 애드핏 심사 크롤러가 "광고 미설치"로 판단합니다.)
  // 광고가 없을 때는 높이만 0 으로 접어 빈 박스가 보이지 않게 합니다.
  return (
    <div
      ref={containerRef}
      className={className}
      // 광고 로딩 전 레이아웃 시프트(CLS)를 막기 위해 최대 크기를 확보합니다.
      // NO-AD 시에는 minHeight 를 0 으로 접습니다.
      style={{ minHeight: noAd ? 0 : height, maxWidth: width, width: "100%" }}
      aria-label="광고"
    />
  )
}
