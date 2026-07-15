// lib/format-date.ts
// ISO 날짜 문자열을 한국어 형식으로 변환하는 유틸 함수입니다.
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch {
    return dateString
  }
}
