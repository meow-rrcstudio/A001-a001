// lib/korean-josa.ts
// 앞말의 받침에 맞는 조사를 골라줍니다 — "별조각을" · "3개를" · "힘들다라".
//
// ┌─ 왜 따로 두는가 ──────────────────────────────────────────────────
// │ 한국어 조사는 앞말의 받침에 따라 갈립니다. 문장에 손으로 박아두면
// │ 앞말이 바뀌는 순간 "1개이 듭니다"·"힘들다이라"가 됩니다. 오류도 안
// │ 나고 빌드도 통과해서, 누가 읽다가 발견할 때까지 그대로 남습니다.
// │
// │ 별조각 이름을 바꾸다 실제로 환불·약관 화면이 그렇게 됐고, 사용자가
// │ 친 물음을 되읽는 자리(「"힘들다"이라...」)도 같은 일이었습니다.
// │ 두 자리가 같은 규칙을 쓰므로 한곳에 둡니다.
// └──────────────────────────────────────────────────────────────────
export type JosaPair = "을를" | "이가" | "은는" | "와과" | "으로로" | "이라라"

/**
 * [받침이 있을 때, 없을 때].
 *
 * ⚠️ 글자 수로 자르지 않습니다. "이라/라"·"으로/로"처럼 두 글자짜리가
 *    있어서, 앞 한 글자를 떼는 식으로 나누면 「"힘들다"라라」가 됩니다.
 *    (실제로 그렇게 나왔습니다)
 *
 * ⚠️ "와/과"는 다른 것들과 짝이 뒤집혀 있습니다 — 받침이 있으면 "과"
 *    입니다("책과"·"나와"). 이름 순서에 끌려 적으면 틀립니다.
 */
const PAIRS: Record<JosaPair, [withFinal: string, withoutFinal: string]> = {
  을를: ["을", "를"],
  이가: ["이", "가"],
  은는: ["은", "는"],
  와과: ["과", "와"],
  으로로: ["으로", "로"],
  이라라: ["이라", "라"],
}

/**
 * 앞말 뒤에 붙일 조사만 돌려줍니다.
 *
 * ⚠️ 따옴표·물음표로 끝나는 말이 흔합니다 — 사용자가 친 물음을 되읽을 때
 *    「"지금 이직해도 될까?"」처럼 감싸기 때문입니다. 마지막 글자를 그냥
 *    보면 한글이 아니라서 늘 받침 없는 쪽으로 떨어집니다. 뒤에 붙은
 *    부호를 걷어내고 진짜 마지막 글자를 봅니다.
 */
export function josaFor(word: string, pair: JosaPair): string {
  const bare = word.replace(/["'"'”’」』)\]\s?!.…~,]+$/u, "").trim()
  const last = bare.slice(-1)
  const code = last.charCodeAt(0)

  // 한글 음절이 아니면(숫자·영문·빈 값) 받침 없는 것으로 봅니다.
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const finalConsonant = isHangul ? (code - 0xac00) % 28 : 0

  const [withFinal, withoutFinal] = PAIRS[pair]

  // 8 = ㄹ. "별로"처럼 ㄹ 받침 뒤에도 "로"가 붙습니다 — 여기만 예외입니다.
  if (pair === "으로로") return finalConsonant === 0 || finalConsonant === 8 ? withoutFinal : withFinal

  return finalConsonant ? withFinal : withoutFinal
}

/** 앞말에 조사까지 붙여 돌려줍니다 — "별조각을" */
export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josaFor(word, pair)}`
}
