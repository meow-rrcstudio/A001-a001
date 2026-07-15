// components/ui/button.tsx
// 사이트 전체에서 쓰는 공용 버튼입니다. 여기서 고치면 모든 버튼이 함께 바뀝니다.
//
// ┌─ 디자인 조절 가이드 ──────────────────────────────────────────────
// │ Tailwind 값 읽는 법: 숫자 1칸 = 4px (예: px-2.5 = 좌우 패딩 10px)
// │
// │ [공통 모양 — 아래 첫 번째 긴 문자열에서 수정]
// │ · 모서리 둥글기 : rounded-lg → globals.css의 --radius(0.75rem=12px) 기준.
// │                   더 둥글게 = rounded-xl, 완전 알약 = rounded-full
// │ · 글자 크기     : text-sm (14px) → text-base(16px)로 키울 수 있음
// │ · 글자 굵기     : font-medium → font-semibold가 더 굵음
// │ · 테두리        : border border-transparent → 기본은 투명 테두리
// │                   (outline 종류만 아래 variant에서 색을 입힘)
// │
// │ [종류별 색 — variant 블록에서 수정]
// │ · default    : 포인트색 채움 (bg-primary + 흰 글자)
// │ · outline    : 테두리만 있는 버튼 (border-border + 배경색)
// │ · secondary  : 연한 회갈색 채움 (bg-secondary)
// │ · ghost      : 평소엔 투명, 올리면 살짝 배경
// │ · destructive: 삭제·경고용 붉은 톤
// │ · link       : 글자만 있는 링크 모양
// │
// │ [크기 — size 블록에서 수정]
// │ · default: 높이 h-8(32px), 좌우 패딩 px-2.5(10px)
// │ · sm     : 높이 h-7(28px) — 작은 버튼
// │ · lg     : 높이 h-9(36px) — 큰 버튼
// │ · icon   : 정사각형 size-8(32×32px) — 아이콘 전용
// │ 예) 모든 기본 버튼을 키우고 싶으면: default의 h-8 → h-9, px-2.5 → px-4
// └──────────────────────────────────────────────────────────────────
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
        // gemini 수정: 다크 브라운 배경(foreground)과 화이트 텍스트를 가진 원형 연결 버튼 스타일 추가
        connect: 'bg-foreground text-white hover:opacity-90 rounded-full h-16 px-8 text-lg font-serif shadow-xl transition-all duration-300',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }