// lib/runtime.ts
// 지금 이 화면이 "어디서" 열려 있는가.
//
// ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
// │ 같은 웹이 두 곳에서 열립니다 — 보통 브라우저와 앱인토스 미니앱.
// │ 토스 안에서는 달라져야 하는 것이 있습니다.
// │   · 광고를 띄우지 않습니다 (외부 광고 SDK 는 심사에서 걸립니다)
// │   · 전화 걸기·공유처럼 웹뷰가 막을 수 있는 길에 대비합니다
// │
// │ "어디서 열렸나"를 묻는 곳은 여기 하나여야 합니다. 화면마다 UA 를
// │ 뒤지기 시작하면 한 곳만 고쳐진 채 남습니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 아직 확인하지 못한 것이 있습니다 — 토스 웹뷰의 UA 에 무엇이 들어가는지
//    실기기로 보지 못했습니다(문서 사이트가 막혀 있었습니다). 그래서 UA 는
//    보조 수단이고, 확실한 길은 "우리가 정한 주소로 들어오게 하는 것"입니다:
//
//      intoss://{appName}  →  https://soulseoul.xyz/tarot/ask?in=toss
//
//    콘솔에서 미니앱 시작 주소를 이렇게 잡아두면 UA 를 몰라도 정확합니다.
//    한 번 들어오면 그 사실을 세션에 적어둬서, 화면을 옮겨 다녀도 유지됩니다.

/** 지금 화면이 열린 곳 */
export type Runtime = "web" | "toss"

/** 주소에 이 값이 붙어 들어오면 토스로 봅니다 */
export const TOSS_ENTRY_PARAM = "in"
export const TOSS_ENTRY_VALUE = "toss"

const STORAGE_KEY = "soulseoul.runtime"

/**
 * 브라우저에서 실행되는 감지 코드 — 문자열입니다.
 *
 * ⚠️ 왜 문자열인가: 이 코드는 React 가 붙기 전에, 광고 스크립트보다 먼저
 *    돌아야 합니다. 하이드레이션을 기다리면 그사이 광고가 이미 요청됩니다.
 *    그래서 layout 에 인라인으로 심습니다.
 *
 * 하는 일 셋:
 *   1. 토스에서 열렸는지 판단하고 세션에 기억합니다
 *   2. <html data-runtime="toss"> 를 답니다 (CSS 가 이걸 보고 광고를 숨김)
 *   3. 애드센스에 "광고 요청하지 마"를 미리 일러둡니다
 */
export const RUNTIME_DETECT_SCRIPT = `(function(){try{
var q=new URLSearchParams(location.search).get('${TOSS_ENTRY_PARAM}');
var s=null;try{s=sessionStorage.getItem('${STORAGE_KEY}')}catch(e){}
var ua=(navigator.userAgent||'').toLowerCase();
var toss = q==='${TOSS_ENTRY_VALUE}' || s==='toss' || ua.indexOf('toss')>-1;
if(toss){
  try{sessionStorage.setItem('${STORAGE_KEY}','toss')}catch(e){}
  document.documentElement.setAttribute('data-runtime','toss');
  // 애드센스는 이 값을 보고 광고 요청을 멈춥니다. 스크립트가 실행되기
  // 전에 세워둬야 합니다 — 뒤늦게 세우면 이미 한 번 요청한 뒤입니다.
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.pauseAdRequests = 1;
}
}catch(e){}})();`

/**
 * 지금 어디서 열렸는가 (브라우저에서만 의미가 있습니다).
 *
 * 서버에서 부르면 언제나 "web" 입니다 — 서버는 알 수 없고, 광고를 숨기는
 * 일은 화면에서 하면 됩니다.
 */
export function currentRuntime(): Runtime {
  if (typeof document === "undefined") return "web"
  return document.documentElement.getAttribute("data-runtime") === "toss" ? "toss" : "web"
}

/** 앱인토스 미니앱 안인가 */
export function isAppsInToss(): boolean {
  return currentRuntime() === "toss"
}
