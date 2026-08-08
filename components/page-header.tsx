// components/page-header.tsx
// 사이트 공용 상단바. 화면 성격에 따라 세 가지 케이스가 있습니다.
//
// ┌─ 헤더 케이스 ─────────────────────────────────────────────────────
// │ variant="sub"     뒤로 + 더보기 — 대부분의 하위 화면
// │                   (아카이빙·타로 목록·글 상세·기록·설정·about·privacy)
// │ variant="reading" 뒤로 + 제목 + 더보기 — 타로를 보는 동안만
// │                   (질문 고르기 → 섞기 → 카드 뽑기 → 해석 → 대화)
// │ variant="home"    워드마크 + 햄버거 — 홈 전용
// │ variant="minimal" 뒤로만 — 로그인처럼 나갈 길만 필요한 화면
// │ variant="close"   닫기(×)만 — 볼일 하나만 보고 나가는 화면
// │                   (별조각 구매·사용내역·결제 확인)
// │
// │ ⚠️ "뒤로(←)"와 "닫기(×)"는 다른 말입니다. ← 는 "왔던 길을 되짚는다",
// │    × 는 "이 볼일을 접는다"입니다. 별조각 화면들은 설정에서 잠깐
// │    들렀다 나가는 자리라 ×가 맞습니다 — 결제를 마치고 ← 를 누르면
// │    방금 지나온 결제창으로 되돌아가는 것처럼 읽힙니다.
// │
// │ ⚠️ 공유 버튼은 글 상세(노션 글)에만 답니다. 목록 화면에서 "이 페이지를
// │    공유"는 뜻이 흐릿하고, 헤더가 버튼으로 붐빕니다.
// │
// │ ⚠️ 헤더 가운데는 기본적으로 제목 자리입니다. 다만 무엇을 물을지
// │    고르는 화면처럼 제목이 없는 자리에서는 centerCharacter 로 샨티를
// │    놓습니다 — 시안이 그렇고, "지금 샨티와 있다"가 읽힙니다.
// │    해석·대화 화면은 답변 옆에 샨티를 두므로(클로드가 로고를 두는
// │    자리) 헤더에는 제목만 둡니다. 둘을 함께 켜지 않습니다.
// │
// │ 홈을 뺀 세 케이스는 화면 위에서 16px 떨어진 자리에 "고정"됩니다.
// │ 스크롤해도 따라 내려오지 않고 그 자리에 그대로 있습니다.
// └──────────────────────────────────────────────────────────────────
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ · 좌우 여백   : 왼쪽 24 · 오른쪽 16
// │                오른쪽만 좁은 것은 오른쪽 끝에 놓이는 것이 "버튼"이기
// │                때문입니다. 버튼은 44px 짜리 손가락 자리라 안쪽에 이미
// │                여백을 품고 있어서, 바깥까지 24 를 주면 그림(햄버거·×)이
// │                왼쪽 워드마크보다 더 안쪽으로 들어가 보입니다.
// │                서랍 메뉴(components/site-menu.tsx)도 같은 값을 씁니다 —
// │                열고 닫을 때 오른쪽 끝이 어긋나지 않아야 합니다.
// │ · 고정 위치   : top-4 (16px) — 떠 있든 아니든 위 여백은 같습니다
// │ · 라임 스크림 : h-24 (96px) — 헤더 뒤에 깔려 아래로 투명해집니다
// │ · 버튼 크기   : h-11 w-11 (44px — 손가락 최소 터치 크기)
// │ · 본문 여백   : 헤더가 떠 있으므로 페이지는 HEADER_SPACE 만큼 위를 비웁니다
// └──────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Menu, MoreHorizontal, Share, X } from "lucide-react"
import { useAppsInToss } from "@/lib/use-runtime"
import { SiteMenu } from "@/components/site-menu"
import { Wordmark } from "@/components/brand-mark"
import { BlinkingShanti, SleepingShanti } from "@/components/pixel-sprite"
import { ACTIVE_CHARACTER } from "@/lib/character"

// 고정 헤더가 떠 있는 만큼 페이지 위쪽에 비워야 하는 높이 (홈은 필요 없습니다).
// 값은 lib/layout.ts 에 있습니다 — 서버 컴포넌트도 읽어야 하기 때문입니다.
// 여기서 다시 내보내면 서버 쪽에서 스텁이 잡히므로 다시 내보내지 않습니다.

// 라임 스크림 위에 뜨는 둥근 버튼 — 반투명 유리면 + 아래로 살짝 지는 그림자.
// 값은 globals.css 의 --glass / --elevation-raised 에서 옵니다.
const roundButton =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-glass text-brand-ink shadow-raised backdrop-blur-[var(--glass-blur)] transition-colors hover:bg-background"

export function PageHeader({
  backHref,
  showShare = false,
  title,
  /**
   * 가운데에 제목 대신 워드마크를 놓습니다 (로그인 화면).
   *
   * variant="home" 의 워드마크는 왼쪽에 있습니다 — 홈은 뒤로 갈 곳이
   * 없어서 그 자리가 비기 때문입니다. 로그인은 뒤로가 있어야 하므로
   * 워드마크가 가운데로 옵니다. 두 자리를 한 variant 로 묶으면
   * "홈이냐 아니냐"와 "워드마크가 어디냐"가 엉키므로 따로 둡니다.
   */
  centerMark = false,
  centerCharacter = false,
  characterAsleep = false,
  variant = "sub",
  /** 화면 위에 고정할지. 홈은 고정하지 않고 함께 스크롤됩니다. */
  fixed,
  /**
   * 이 화면의 배경.
   *
   * ┌─ 왜 헤더가 배경을 알아야 하는가 ───────────────────────────────
   * │ 스크림(헤더 뒤에 깔리는 띠)은 색 장식이 아닙니다. "본문이 고정
   * │ 헤더 밑을 지날 때도 버튼이 읽히게" 하는 장치입니다. 그래서 어느
   * │ 화면에서든 있어야 합니다.
   * │
   * │ 다만 크림 배경용 스크림에는 연라임 중간색이 있어서, 라임 배경에
   * │ 얹으면 "라임 → 밝은 연라임 → 다시 라임"이 되어 띠가 끝나는 자리에
   * │ 밝은 줄이 하나 생깁니다. 그래서 라임 화면은 중간색을 뺀 스크림을
   * │ 씁니다 (globals.css 의 --scrim-flat).
   * │
   * │ ⚠️ 예전에는 라임 화면에서 스크림을 아예 껐습니다. 밝은 줄은
   * │    없어지지만, 짙은 본문이 버튼 뒤로 그대로 지나가서 버튼이
   * │    안 읽힙니다 (크레딧 화면의 검정 묶음 줄에서 확인했습니다).
   * │    끄는 것이 아니라 바꿔 끼우는 것이 맞습니다.
   * │
   * │ scripts/check-header-scrim.mjs 가 화면마다 이 짝이 맞는지 봅니다.
   * └────────────────────────────────────────────────────────────────
   */
  surface = "cream",
  onBack,
  className = "",
}: {
  backHref?: string
  /**
   * 뒤로가기를 눌렀을 때 주소를 옮기는 대신 할 일.
   *
   * 화면 위에 덮어 띄운 것(면담 중 카드 고르기 등)에 씁니다. 그런 화면에서
   * 주소를 옮겨버리면 아래에 깔린 대화가 통째로 사라집니다 — 뒤로가기는
   * "이 덮개를 걷는다"여야 합니다.
   *
   * 주면 backHref 대신 이쪽이 쓰이고, 링크가 아니라 버튼으로 그려집니다.
   */
  onBack?: () => void
  showShare?: boolean
  /** 헤더 가운데에 놓을 제목. 길면 말줄임 (글 상세·타로 리딩) */
  title?: string
  centerMark?: boolean
  /** 가운데에 캐릭터(샨티)를 놓을지. 타로를 보는 화면에서 씁니다 */
  centerCharacter?: boolean
  /**
   * 가운데 샨티가 자고 있을지 (centerCharacter 일 때만).
   *
   * 온보딩 전용입니다. 다 답하면 false 로 바뀌고, 그 자리에서 눈을 뜹니다 —
   * 화면을 옮기지 않고 같은 자리에서 바뀌어야 "내가 깨웠다"가 됩니다.
   */
  characterAsleep?: boolean
  variant?: "sub" | "reading" | "home" | "minimal" | "close"
  fixed?: boolean
  surface?: "cream" | "lime"
  className?: string
}) {
  // 홈은 고정하지 않는 것이 기본입니다 (시안 기준)
  const isFixed = fixed ?? variant !== "home"
  // 떠 있지 않으면 스크림도 쓸 데가 없습니다 (본문이 헤더 밑을 지나지 않으니까요)
  const showScrim = isFixed
  const [menuOpen, setMenuOpen] = useState(false)

  // 눌렀는데 아무 일도 안 일어나는 것을 막습니다.
  // 웹뷰(앱인토스 미니앱)에서는 navigator.share 도 클립보드도 막힐 수
  // 있는데, 그때 조용히 실패하면 사용자는 버튼이 고장 났다고 여깁니다.
  const [shared, setShared] = useState<"copied" | "failed" | null>(null)
  // ⚠️ 앱인토스 미니앱에서는 공유 단추를 내지 않습니다. 서비스 오픈 정책
  //    4번이 "공유하기 링크가 자사 웹사이트로 랜딩되는 경우"를 제한합니다 —
  //    우리 공유는 soulseoul.xyz 주소를 건네는 것이라 그대로 걸립니다.
  const inToss = useAppsInToss()

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url })
        return
      } catch {
        // 취소했거나 웹뷰가 막은 경우 — 아래 복사로 이어갑니다
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared("copied")
    } catch {
      setShared("failed")
    }
    setTimeout(() => setShared(null), 2000)
  }

  return (
    <>
      {/* 라임 스크림 — 헤더 뒤에 깔려 위에서 아래로 투명해집니다.
          화면 폭에 정확히 맞추려고 fixed + inset-x-0 을 씁니다. */}
      {showScrim && (
        <div
          aria-hidden="true"
          // data-scrim: scripts/check-header-scrim.mjs 가 이 표식으로
          // "스크림이 깔렸는지"를 봅니다. 픽셀 밝기로 재면 헤더 아래를
          // 지나가는 본문까지 함께 잡혀서, 있는 그대로를 물어보게 했습니다.
          data-scrim={surface}
          className="pointer-events-none fixed inset-x-0 top-0 z-40"
          style={{
            height: "var(--scrim-height)",
            backgroundImage: surface === "lime" ? "var(--scrim-flat)" : "var(--scrim)",
          }}
        />
      )}

      <div
        className={`${
          isFixed ? "fixed inset-x-0 top-4 z-50" : "relative pt-4"
        } mx-auto w-full ${
          // 홈은 햄버거가 화면 오른쪽 끝에 붙습니다 — 아래 목록의 선과 검정 면이
          // 같은 끝까지 이어지므로(시안 "라인·면 연장"), 헤더만 가운데로
          // 좁혀지면 오른쪽 끝이 어긋나 보입니다.
          variant === "home" ? "" : "max-w-site"
        } pl-6 pr-4 ${className}`}
      >
        <div className="relative flex items-center justify-between gap-3">
          {/* 왼쪽 — 홈은 워드마크, 닫기형은 비움, 나머지는 뒤로가기 */}
          {variant === "close" ? (
            <span className="h-11 w-11" aria-hidden="true" />
          ) : variant === "home" ? (
            <Wordmark className="h-10" priority />
          ) : onBack ? (
            <button type="button" onClick={onBack} className={roundButton} aria-label="뒤로">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link href={backHref ?? "/"} className={roundButton} aria-label="뒤로">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          {/* 가운데 — 제목.
              양옆 버튼 폭에 상관없이 화면 한가운데 오도록 절대 위치로 놓습니다.
              좌우 여백은 "넓은 쪽"에 맞춰 양쪽 같은 값을 씁니다 — 한쪽만
              넓히면 글이 가운데에서 밀려나기 때문입니다.
                버튼 하나  44 + 사이 16 = 60
                버튼 둘    44 + 8 + 44 + 사이 16 = 112 (공유가 붙는 글 상세) */}
          {/* 가운데 워드마크 — 제목과 같은 자리를 씁니다.
              pointer-events-none: 뒤로·더보기 버튼 사이를 덮고 있어서,
              여기서 클릭을 먹으면 양옆 버튼 가장자리가 안 눌립니다. */}
          {centerMark && (
            <span className="pointer-events-none absolute inset-x-0 flex justify-center">
              <Wordmark className="h-8" priority />
            </span>
          )}

          {/* 캐릭터 표식 — 타로를 보는 동안 "지금 샨티와 있다"를 가리킵니다.
              워드마크(centerMark)와 같은 자리라 둘을 함께 켜지 않습니다. */}
          {centerCharacter && !centerMark && (
            <span className="pointer-events-none absolute inset-x-0 flex justify-center">
              {characterAsleep ? (
                <SleepingShanti className="h-7" title={`잠든 ${ACTIVE_CHARACTER.name}`} />
              ) : (
                <BlinkingShanti className="h-7" title={ACTIVE_CHARACTER.name} />
              )}
            </span>
          )}

          {title && (
            <p
              className={`pointer-events-none absolute inset-x-0 mx-auto max-w-site truncate text-center text-[15px] font-semibold text-brand-ink ${
                showShare ? "px-[112px]" : "px-[60px]"
              }`}
            >
              {title}
            </p>
          )}

          {/* 오른쪽 — 홈은 햄버거, 하위 화면은 (공유 +) 더보기,
              닫기형은 ×, 최소형은 없음.
              ⚠️ 닫기형에 더보기(⋯)를 함께 달지 않습니다. 나가는 길이 둘이면
                 어느 쪽이 "그만두기"인지 그 자리에서 판단해야 합니다. */}
          {variant === "minimal" ? (
            <span className="h-11 w-11" aria-hidden="true" />
          ) : variant === "close" ? (
            onBack ? (
              <button type="button" onClick={onBack} className={roundButton} aria-label="닫기">
                <X className="h-5 w-5" />
              </button>
            ) : (
              <Link href={backHref ?? "/"} className={roundButton} aria-label="닫기">
                <X className="h-5 w-5" />
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2">
              {showShare && !inToss && (
                <button type="button" onClick={handleShare} className={roundButton} aria-label="공유">
                  <Share className="h-5 w-5" />
                </button>
              )}
              {/* 공유가 어떻게 됐는지 한 줄. 웹뷰에서 공유·복사가 모두
                  막히면 아무 일도 안 일어난 것처럼 보이는데, 그때 버튼이
                  고장 난 줄 알게 됩니다. */}
              {shared && (
                <span
                  role="status"
                  className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-brand-ink px-3 py-1.5 text-xs font-medium text-white"
                >
                  {shared === "copied" ? "주소를 복사했어요" : "주소를 복사하지 못했어요"}
                </span>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="메뉴 열기"
                className={
                  variant === "home"
                    ? "inline-flex h-11 w-11 items-center justify-center text-brand-ink transition-opacity hover:opacity-70"
                    : roundButton
                }
              >
                {variant === "home" ? (
                  <Menu className="h-7 w-7" />
                ) : (
                  <MoreHorizontal className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
