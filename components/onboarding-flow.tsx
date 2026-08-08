// components/onboarding-flow.tsx
// 샨티를 깨우는 화면. 세 번 묻고 별자리 하나를 돌려줍니다.
//
// ┌─ 다섯 자리 ───────────────────────────────────────────────────────
// │ 0  잠든 샨티        "별조각 모아서 샨티 깨우기"
// │ 1  마음이 머무는 것  키워드 36개 중 3~5개
// │ 2  마음이 움츠러드는 것 키워드 28개 중 3~5개
// │ 3  카드            메이저 아르카나 22장 중 1장
// │ 4  결과            별자리 이름 + 태그 셋
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 화면을 옮기지 않습니다(주소는 /onboarding 하나입니다). 헤더의 샨티가
//    자다가 눈을 뜨는 것이 이 화면의 이야기 전부인데, 페이지를 갈아끼우면
//    헤더도 함께 새로 그려져서 "같은 자리에서 깨어났다"가 사라집니다.
//
// ⚠️ 고른 즉시 다음으로 넘기지 않습니다. 다섯 개를 고르는 동안 넣었다
//    뺐다 하는 것이 정상이라, 마지막 하나를 누르는 순간 화면이 넘어가면
//    되돌릴 길이 없습니다. 넘어가는 것은 아래 버튼을 눌렀을 때뿐입니다.
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageBackground } from "@/components/page-background"
import { ReadingCharacterBubble } from "@/components/reading-character-bubble"
import { TarotCardImage } from "@/components/tarot-card-image"
import { StarPiece } from "@/components/star-piece"
import { HEADER_SPACE } from "@/lib/layout"
import { CHIP_GAP } from "@/lib/chip-styles"
import { cn } from "@/lib/utils"
import {
  DRAWN_KEYWORDS,
  EMPTY_ANSWERS,
  FEAR_KEYWORDS,
  ONBOARDING_CARDS,
  PICK_MAX,
  PICK_MIN,
  buildResult,
  type OnboardingAnswers,
} from "@/lib/onboarding"
import {
  claimOnboarding,
  finishOnboarding,
  loadOnboarding,
  saveOnboarding,
} from "@/lib/onboarding-store"

/** 결과를 보고 타로보기로 저절로 넘어가기까지 (초) */
const AUTO_MOVE_SECONDS = 10

/** 별조각 게이지 칸 수 = 물음 수 */
const STEPS = 3

// ═══════════════════════════════════════════════════════════════════
// 조각들
// ═══════════════════════════════════════════════════════════════════

/**
 * 별조각 게이지.
 *
 * ⚠️ 채운 것과 빈 것을 색으로만 가르지 않습니다. 라임은 크림 배경 위에서
 *    대비가 낮아, 색만으로는 몇 개를 모았는지 안 읽힙니다. 빈 칸은
 *    흐리게 + 작게 두어 모양으로도 갈리게 합니다.
 */
function StarGauge({ filled }: { filled: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="img"
      aria-label={`별조각 ${STEPS}개 중 ${filled}개`}
    >
      {Array.from({ length: STEPS }, (_, i) => (
        <StarPiece
          key={i}
          className={cn(
            "transition-all duration-500",
            i < filled ? "h-7 w-7 opacity-100" : "h-5 w-5 opacity-25 grayscale"
          )}
        />
      ))}
    </div>
  )
}

/**
 * 고르는 알약.
 *
 * 모양은 lib/chip-styles.ts 의 칩과 같은 치수를 따르되, 여기서는 "고른
 * 상태"가 있어야 해서 클래스를 따로 짭니다 — 그쪽 상수(TOPIC_CHIP·
 * ASK_CHIP)는 상태가 없는 알약이라 그대로 쓸 수 없습니다. 치수(높이
 * 37px·글자 15px·테두리 1px)는 그쪽과 맞춰 두었습니다.
 */
function PickChip({
  label,
  picked,
  disabled,
  onToggle,
}: {
  label: string
  picked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      // 이미 고른 것은 상한에 걸려도 눌립니다 — 안 그러면 다섯 개를 채운
      // 순간 무엇도 뺄 수 없게 됩니다 (넣었다 뺐다 하라고 만든 화면인데).
      disabled={disabled && !picked}
      aria-pressed={picked}
      className={cn(
        "rounded-full border px-5 py-1.5 text-[15px] leading-[23px] transition-colors",
        // 눌리는 자리를 44px 로 넓히는 덧판 (chip-styles.ts 의 CHIP_TOUCH 와 같은 값)
        "relative after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']",
        picked
          ? "border-brand-ink bg-brand-ink font-medium text-white"
          : "border-chip-line bg-chip text-foreground hover:bg-muted",
        disabled && !picked && "opacity-35"
      )}
    >
      {label}
    </button>
  )
}

/** 화면 아래에 붙는 버튼 한 개. 다섯 자리가 모두 이 자리를 씁니다 */
function BottomBar({
  label,
  hint,
  /**
   * 안내 글이 바뀔 때 소리로 읽어줄지.
   *
   * ⚠️ 카운트다운에는 끕니다. 켜두면 스크린리더가 1초마다 "9초 후…",
   *    "8초 후…"를 읽어서 결과를 들을 수 없습니다.
   */
  hintLive = true,
  disabled,
  onClick,
}: {
  label: string
  hint?: string
  hintLive?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      {/* 위쪽으로 흐려지는 띠 — 버튼 뒤로 칩이 지나가도 글자가 읽힙니다 */}
      <div
        aria-hidden="true"
        className="h-16 w-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,249,245,0) 0%, rgba(250,249,245,0.92) 70%, var(--background) 100%)",
        }}
      />
      <div className="pointer-events-auto bg-background pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-site px-6 sm:px-8">
          {hint && (
            <p
              className="mb-2 text-center text-xs text-muted-foreground"
              aria-live={hintLive ? "polite" : "off"}
            >
              {hint}
            </p>
          )}
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-medium transition-opacity",
              disabled
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-brand-ink text-white hover:opacity-90"
            )}
          >
            {label}
            {!disabled && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 화면
// ═══════════════════════════════════════════════════════════════════

export function OnboardingFlow() {
  const router = useRouter()
  // 저장해 둔 것을 읽기 전에는 그리지 않습니다(ready). 빈 화면을 먼저
  // 그렸다가 고른 것이 뒤늦게 채워지면 칩이 우르르 검게 바뀌어 화면이 튑니다.
  //
  // ⚠️ 셋을 한 덩어리로 둡니다. 따로 두면 이어하기를 되살릴 때 setState 가
  //    세 번 나가고, 그 사이에 "0단계인데 답은 차 있는" 중간 그림이 한 번
  //    그려집니다.
  const [state, setState] = useState<{ step: number; answers: OnboardingAnswers; ready: boolean }>({
    step: 0,
    answers: EMPTY_ANSWERS,
    ready: false,
  })
  const { step, answers, ready } = state
  const setStep = (next: number | ((prev: number) => number)) =>
    setState((prev) => ({
      ...prev,
      step: typeof next === "function" ? next(prev.step) : next,
    }))
  const setAnswers = (next: (prev: OnboardingAnswers) => OnboardingAnswers) =>
    setState((prev) => ({ ...prev, answers: next(prev.answers) }))

  const [left, setLeft] = useState(AUTO_MOVE_SECONDS)

  // ── 이어하기 ────────────────────────────────────────────────────
  useEffect(() => {
    const stored = loadOnboarding()
    setState({
      answers: stored.answers,
      // 결과까지 본 사람이 다시 들어오면 처음부터입니다. 결과 화면으로
      // 되돌려 놓으면 카운트다운이 다시 돌아 타로보기로 끌고 갑니다.
      step: stored.done ? 0 : stored.step,
      ready: true,
    })
  }, [])

  // ── 고르는 동안 남기기 ──────────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    saveOnboarding(answers, step)
  }, [answers, step, ready])

  const result = useMemo(() => buildResult(answers), [answers])

  // ⚠️ ?awakened=1 을 답니다. 문지기(middleware.ts)가 이걸 보면 쿠키를
  //    서버 쪽에서 찍고 주소를 깨끗하게 되돌립니다. 쿠키를 막아둔
  //    브라우저에서도 문 앞으로 되튕기지 않습니다.
  const goTarot = useCallback(() => {
    router.push("/tarot/ask?awakened=1")
  }, [router])

  // ── 결과에 닿으면: 남기고 · 옮기고 · 세기 ───────────────────────
  //
  // 로그인해 있으면 그 자리에서 계정으로 옮깁니다. 로그인 전이면 브라우저에
  // 남았다가 로그인하는 순간 옮겨집니다 (lib/use-account.ts).
  const moved = useRef(false)
  useEffect(() => {
    if (step !== 4) return
    finishOnboarding(answers)
    void claimOnboarding()

    // 남은 초를 여기서 되돌리지 않습니다 — 결과로 넘기는 버튼이 그걸 합니다.
    // 효과 안에서 setState 를 하면 들어오자마자 한 번 더 그려집니다.
    const timer = setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          clearInterval(timer)
          // 타이머가 두 번 겹쳐 도는 일이 없도록 한 번만 옮깁니다.
          if (!moved.current) {
            moved.current = true
            goTarot()
          }
          return 0
        }
        return n - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // answers 는 결과에 닿는 순간 이미 굳어 있습니다 — 넣으면 매초 다시 돕니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, goTarot])

  // ── 고르기 ──────────────────────────────────────────────────────
  const toggle = (field: "drawn" | "fears", label: string) => {
    setAnswers((prev) => {
      const list = prev[field]
      if (list.includes(label)) return { ...prev, [field]: list.filter((x) => x !== label) }
      if (list.length >= PICK_MAX) return prev
      return { ...prev, [field]: [...list, label] }
    })
  }

  const back = () => {
    if (step === 0) {
      router.push("/")
      return
    }
    setStep((s) => s - 1)
  }

  if (!ready) return null

  const picked = step === 1 ? answers.drawn : step === 2 ? answers.fears : []
  const enough = step === 3 ? answers.cardSlug !== null : picked.length >= PICK_MIN

  // 말풍선 — 고르기 시작하면 샨티가 반응합니다. 자리마다 다른 추임새라
  // 세 화면이 같은 그림으로 뭉개지지 않습니다.
  const bubble =
    step === 4
      ? `누가 나를 깨운거냥.. 오호라, ${result.combo?.name ?? "별조각"}의 기운을 가진 자로구냥.`
      : step === 0 || picked.length + (answers.cardSlug && step === 3 ? 1 : 0) === 0
        ? "…"
        : step === 1
          ? "흠냥.."
          : step === 2
            ? "그렇구냥.."
            : "오호.."

  return (
    <div className="flex min-h-screen flex-col">
      <PageBackground variant="aurora" />

      <PageHeader
        variant="reading"
        centerCharacter
        // 다 답한 순간 눈을 뜹니다. 같은 자리에서 바뀌어야 "내가 깨웠다"가 됩니다.
        characterAsleep={step < 4}
        onBack={back}
      />

      <main className={`relative z-10 mx-auto w-full max-w-site flex-1 px-6 sm:px-8 ${HEADER_SPACE}`}>
        <ReadingCharacterBubble message={bubble} placement="top" />

        {step > 0 && (
          <div className="mt-6">
            <StarGauge filled={step === 4 ? STEPS : step - 1} />
          </div>
        )}

        {/* ── 0. 잠든 샨티 ──────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-[17px] leading-relaxed text-foreground">
              지금은 {"샨티"}가 잠들어 있어요.
              <br />
              마음이 머무는 세 개의 조각을 모으면
              <br />
              샨티를 깨울 수 있어요.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              여기서 고른 것으로 샨티가 당신 결에 맞춰 말해요.
            </p>
          </div>
        )}

        {/* ── 1·2. 키워드 ───────────────────────────────────────── */}
        {(step === 1 || step === 2) && (
          <>
            <h1 className="mt-8 text-center text-[22px] font-semibold leading-relaxed text-foreground">
              {step === 1 ? (
                <>
                  먼저, 마음이 머무는
                  <br />
                  것을 골라주세요
                </>
              ) : (
                <>
                  이번엔, 마음이 움츠러드는
                  <br />
                  것을 골라주세요
                </>
              )}
            </h1>

            {/* 키워드가 바뀌면 통째로 갈리므로 key 를 자리로 둡니다 —
                살짝 떠오르는 것으로 "목록이 바뀌었다"가 읽힙니다. */}
            <div key={step} className={`mt-8 flex animate-in flex-wrap justify-center ${CHIP_GAP} fade-in duration-300`}>
              {(step === 1 ? DRAWN_KEYWORDS : FEAR_KEYWORDS).map((k) => (
                <PickChip
                  key={k.label}
                  label={k.label}
                  picked={picked.includes(k.label)}
                  disabled={picked.length >= PICK_MAX}
                  onToggle={() => toggle(step === 1 ? "drawn" : "fears", k.label)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── 3. 카드 ───────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <h1 className="mt-8 text-center text-[22px] font-semibold leading-relaxed text-foreground">
              마지막으로, 그림이 끌리는
              <br />
              카드를 골라주세요
            </h1>
            {/* ⚠️ 앞면입니다. 뒷면을 고르게 하면 정보가 없는 제비뽑기가 되고,
                바로 뒤에 오는 진짜 카드 뽑기와 하는 일이 겹칩니다. */}
            <div className="mt-8 grid grid-cols-4 gap-2.5">
              {ONBOARDING_CARDS.map((card) => {
                const chosen = answers.cardSlug === card.slug
                return (
                  <button
                    key={card.slug}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        // 고른 것을 다시 누르면 풀립니다 (칩과 같은 규칙입니다)
                        cardSlug: prev.cardSlug === card.slug ? null : card.slug,
                      }))
                    }
                    aria-pressed={chosen}
                    className={cn(
                      "group relative aspect-[2/3] overflow-hidden rounded-lg border transition-all",
                      chosen
                        ? "border-brand-ink ring-2 ring-brand-ink"
                        : "border-chip-line opacity-80 hover:opacity-100"
                    )}
                  >
                    {/* 이름은 읽어주기만 합니다 — 22칸에 글자를 얹으면 그림이
                        안 보이고, 이름을 읽고 고르면 그건 취향이 아니라 지식입니다. */}
                    <TarotCardImage src={card.imageUrl} alt={card.nameKo} />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── 4. 결과 ───────────────────────────────────────────── */}
        {step === 4 && (
          <div className="py-10">
            {/* ⚠️ 여기 담기는 것은 "보여주는 것"입니다. 샨티에게 넘어가는 것은
                이름이 아니라 재료입니다 (lib/onboarding.ts 의 answersToMemos).
                이름까지 넘기면 샨티가 사람을 규정하게 됩니다. */}
            <div className="rounded-2xl bg-card px-6 py-10 text-center shadow-raised">
              <p className="text-xs text-muted-foreground">오늘 당신의 마음 별조각은</p>
              <p className="mt-3 text-[26px] font-bold leading-tight text-foreground">
                {result.combo?.name}
              </p>
              {result.lines.length > 0 && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {result.lines.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {result.tags.map((tag) => (
                  <span
                    key={tag.code}
                    className="rounded-full bg-brand-ink px-4 py-1.5 text-[13px] font-medium text-white"
                  >
                    {tag.emoji} {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 아래 고정 버튼에 가리지 않도록 비워 둡니다 */}
        <div className="h-40" aria-hidden="true" />
      </main>

      {step === 0 && (
        <BottomBar label="별조각 모아서 샨티 깨우기" onClick={() => setStep(1)} />
      )}

      {(step === 1 || step === 2) && (
        <BottomBar
          label="다음"
          hint={
            picked.length < PICK_MIN
              ? `${PICK_MIN}개 이상 골라주세요 (${picked.length}/${PICK_MAX})`
              : `${picked.length}개 골랐어요 — 눌러서 뺄 수 있어요`
          }
          disabled={!enough}
          onClick={() => setStep((s) => s + 1)}
        />
      )}

      {step === 3 && (
        <BottomBar
          label="다음"
          hint={enough ? undefined : "한 장만 골라주세요"}
          disabled={!enough}
          onClick={() => {
            // 결과 화면의 카운트다운은 여기서 채워 보냅니다. 되돌아왔다가
            // 다시 들어오는 사람에게도 늘 10초부터입니다.
            setLeft(AUTO_MOVE_SECONDS)
            moved.current = false
            setStep(4)
          }}
        />
      )}

      {step === 4 && (
        <BottomBar
          label="바로 타로보러 가기"
          // 남은 초를 버튼 바로 위에 둡니다. 결과 카드 아래에 따로 적으면
          // 그 사이가 통째로 비고, "곧 넘어간다"와 "지금 넘어간다"가 화면
          // 양 끝으로 갈라져서 둘이 같은 이야기로 안 읽힙니다.
          hint={`${left}초 후 자동으로 타로보기 페이지로 이동합니다`}
          hintLive={false}
          onClick={() => {
            moved.current = true
            goTarot()
          }}
        />
      )}
    </div>
  )
}
