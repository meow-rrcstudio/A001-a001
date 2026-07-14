// lib/character.ts
// 마스코트 캐릭터의 정체성을 "프로필" 형태로 관리합니다.
// 나중에 캐릭터를 여러 개 추가하고 싶으면, 이런 프로필 객체를 하나 더 만들면 됩니다.

export interface CharacterProfile {
  id: string
  name: string // 화면에 보이는 이름
  promptId: string // AI 프롬프트 안에서 쓰는 정식 표기
  eyeColors: {
    left: [string, string] // [중심색, 바깥색] 그라데이션
    right: [string, string]
  }
  noseColor: string
}

export const shantiProfile: CharacterProfile = {
  id: "shanti",
  name: "Shanti-",
  promptId: "Śhānti",
  eyeColors: {
    left: ["#c8f24d", "#7fd88a"],
    right: ["#f2b84d", "#e07a7a"],
  },
  noseColor: "#ff4fa3",
}

// 지금 사이트 전체에서 기본으로 쓰이는 캐릭터입니다.
// 나중에 다른 캐릭터로 완전히 교체하려면 이 한 줄만 바꾸면 돼요.
export const ACTIVE_CHARACTER: CharacterProfile = shantiProfile