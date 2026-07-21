// lib/counselors.ts
// [목업 데이터] 캐릭터별 타로 상담가 목록입니다. (아직 UI 목업 단계 — 실제 AI 연동 전)
// 상담가를 추가하려면 이 배열에 한 항목만 더 넣으면 됩니다.

export interface Counselor {
  id: string
  name: string //     상담가 이름
  badge: string //    이름 옆 작은 뱃지(한 줄 소개)
  persona: string //  성격 설명
  greeting: string // 목록에서 미리보기로 보이는 인사말
  emoji: string //    임시 아바타 (나중에 캐릭터 일러스트로 교체)
  accent: string //   아바타 배경색 (tailwind)
  status: "active" | "soon" // soon = 오픈 예정(잠김)
  free: boolean //    무료 체험 상담권으로 이용 가능 여부
}

export const counselors: Counselor[] = [
  {
    id: "shanti",
    name: "샨티",
    badge: "삼천 년을 산 사막의 고양이",
    persona: "다정하지만 꿰뚫어 본다. 두려움 없이, 흐름을 비춰주는 현자.",
    greeting: "야르. 크게 숨 한번 쉬고, 마음에 걸리는 걸 말해보라냥.",
    emoji: "😺",
    accent: "bg-[#efe6df]",
    status: "active",
    free: true,
  },
  {
    id: "noir",
    name: "느와르",
    badge: "냉소적인 검은 고양이",
    persona: "달콤한 위로는 없다. 네가 외면한 진실만 정확히 짚어준다.",
    greeting: "고민만 하다 시간 다 보낼 거야? 지금 네 흐름, 내가 짚어주지.",
    emoji: "🖤",
    accent: "bg-[#dcd7e0]",
    status: "active",
    free: true,
  },
  {
    id: "bori",
    name: "보리",
    badge: "해맑은 강아지",
    persona: "무조건 네 편! 근거 있는 응원으로 등을 힘껏 밀어준다.",
    greeting: "왔구나!! 오늘 카드 완전 좋아, 얼른 뽑아보자!!",
    emoji: "🐶",
    accent: "bg-[#f6ead0]",
    status: "active",
    free: true,
  },
  {
    id: "moa",
    name: "모아 요정",
    badge: "오픈 예정",
    persona: "운명의 카드를 고르는 중…",
    greeting: "운명의 카드를 고르고 있어… 조금만 기다려!",
    emoji: "🧚",
    accent: "bg-muted",
    status: "soon",
    free: false,
  },
  {
    id: "dam",
    name: "매화 너구리",
    badge: "오픈 예정",
    persona: "그대의 괘를 읽을 준비를 하고 있느니…",
    greeting: "그대의 괘를 읽을 준비를 하고 있느니라…",
    emoji: "🦝",
    accent: "bg-muted",
    status: "soon",
    free: false,
  },
]

export function getCounselor(id: string): Counselor | undefined {
  return counselors.find((c) => c.id === id)
}

// 화폐(크레딧) 표기 — 지금은 '별' 하나로 단순화 (필요하면 보조 화폐 추가 가능)
export const CREDIT_NAME = "별"
export const CREDIT_SYMBOL = "✦"
