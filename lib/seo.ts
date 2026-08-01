// lib/seo.ts
// [단일 진실 소스] 검색엔진에 넘기는 값들 — 사이트 주소, 정규 주소(canonical),
// 구조화 데이터(JSON-LD).
//
// ┌─ 왜 한곳에 모으는가 ──────────────────────────────────────────────
// │ · 주소 문자열이 페이지마다 흩어져 있으면 도메인을 바꿀 때 반드시
// │   한두 군데를 빠뜨립니다. 빠뜨린 자리는 구글에 잘못된 주소로 갑니다.
// │ · canonical(정규 주소)은 "이 내용의 진짜 주소는 여기다"라고
// │   구글에 알려주는 표식입니다. 같은 글이 ?from=archive 처럼
// │   꼬리표만 다른 여러 주소로 열리면, 구글은 서로 다른 페이지가
// │   내용을 베낀 것으로 볼 수 있습니다 — 그러면 순위가 나뉩니다.
// │   canonical 하나로 표를 한 주소에 몰아줍니다.
// └──────────────────────────────────────────────────────────────────

import { SITE } from "@/lib/site"

/** 사이트의 진짜 주소. 끝의 빗금(/)은 떼어 둡니다 — 이어 붙일 때 //가 되지 않도록. */
export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://soulseoul.xyz").replace(
  /\/+$/,
  "",
)

/** 사이트 이름 — 구글이 검색결과에 굵게 쓰는 이름입니다. */
export const SITE_NAME = "SoulSeoul"

/**
 * 이 페이지의 정규 주소를 만듭니다.
 *
 * 페이지마다 `alternates: { canonical: canonicalPath("/tarot") }` 로 넣습니다.
 * ⚠️ app/layout.tsx(공용)에는 넣지 않습니다. 넣으면 모든 하위 페이지가
 *    "내 진짜 주소는 홈이다"라고 말하게 되어 하위 페이지가 통째로 색인에서 빠집니다.
 */
export function canonicalPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${clean === "/" ? "" : clean.replace(/\/+$/, "")}`
}

/**
 * 사이트 전체를 설명하는 구조화 데이터 (홈에만 넣습니다).
 *
 * WebSite  — 구글 검색결과에 사이트 이름을 제대로 띄우기 위한 표식
 * Organization — 브랜드('소울서울')를 하나의 주체로 묶는 표식
 */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: SITE_NAME,
        alternateName: ["소울서울", "Soulseoul Archive"],
        description: SITE.tagline,
        inLanguage: "ko-KR",
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: "소울서울",
        url: BASE_URL,
        logo: `${BASE_URL}/og-image.png`,
        description: SITE.tagline,
      },
    ],
  }
}

/**
 * 이동 경로(빵부스러기) 표식. 구글 검색결과에서 주소 대신
 * "SoulSeoul › Archive › 검의 5" 처럼 읽기 좋은 경로가 보이게 합니다.
 */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: canonicalPath(step.path),
    })),
  }
}

/** JSON-LD 를 <script> 로 박아 넣을 때 쓰는 공용 props. */
export function jsonLdScriptProps(data: unknown) {
  return {
    type: "application/ld+json" as const,
    // JSON.stringify 결과에 </script> 가 섞여 태그가 일찍 닫히는 것을 막습니다
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") },
  }
}
