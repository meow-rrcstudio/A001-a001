// app/api/account/delete/route.ts
// 회원탈퇴 — 계정과 개인 기록을 지웁니다.
//
// ┌─ 무엇을 지우고 무엇을 남기는가 ───────────────────────────────────
// │ 지웁니다 : 계정(auth.users) · 프로필 · 리딩 기록 · 이어서 나눈 대화
// │            · 별조각 내역 · 샨티가 기억하던 것
// │ 남깁니다 : 결제 기록(purchases) — 전자상거래법 제6조가 5년간
// │            보관하라고 정한 항목입니다. 다만 user_id 는 비워지고
// │            buyer_email 만 남아, 더 이상 살아 있는 계정을 가리키지
// │            않습니다 (supabase/migrations/001-account-deletion.sql).
// │
// │ 개인정보처리방침·약관에 적힌 말과 같습니다. 문서와 코드가 어긋나면
// │ 문서 쪽이 거짓말이 됩니다.
// └──────────────────────────────────────────────────────────────────
//
// ⚠️ 되돌릴 수 없습니다. 유예 기간을 두지 않기로 했으므로 (즉시 삭제),
//    화면에서 반드시 한 번 더 묻고 부릅니다 (components/withdraw-dialog.tsx).
//
// ⚠️ 지우는 순서가 중요합니다. 계정을 먼저 지우면 cascade 가 나머지를
//    함께 데려가지만, 무엇이 지워졌는지 셀 수 없고 한 곳이 실패해도
//    알 길이 없습니다. 개인 기록을 먼저 지우고 계정을 마지막에 지웁니다.
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/guard"
import { rateKey, rateLimit } from "@/lib/server/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const user = guard.value

  if (!user) {
    return NextResponse.json(
      { error: "로그인한 뒤에 이용할 수 있습니다.", kind: "auth" },
      { status: 401 },
    )
  }

  // 실수로 여러 번 눌리는 것을 막습니다. 탈퇴는 한 번이면 됩니다.
  const limited = rateLimit(rateKey("account-delete", user.id, request), 5, 60 * 60_000)
  if (limited) return limited

  const admin = getSupabaseAdmin()
  if (!admin) {
    console.error("[account/delete] 관리자 열쇠가 없어 지울 수 없습니다.")
    return NextResponse.json(
      { error: "지금은 탈퇴를 처리할 수 없습니다. 잠시 뒤 다시 시도해 주세요.", kind: "server" },
      { status: 503 },
    )
  }

  // ── 1) 결제 기록에 "누가 냈는지"를 박아 둡니다 ──────────────────────
  // 계정이 지워지면 user_id 가 비워지므로(set null), 그 전에 이메일을
  // 옮겨 적어야 법이 요구하는 기록이 온전해집니다.
  //
  // ⚠️ 실패해도 탈퇴를 멈추지 않습니다. 다만 로그에는 남깁니다 —
  //    보관 의무가 걸린 자리라 조용히 넘어가면 안 됩니다.
  if (user.email) {
    const { error } = await admin
      .from("purchases")
      .update({ buyer_email: user.email })
      .eq("user_id", user.id)
      .is("buyer_email", null)
    if (error) {
      console.error("[account/delete] 결제 기록에 이메일을 못 남겼습니다:", error.message)
    }
  }

  // ── 2) 개인 기록을 지웁니다 ─────────────────────────────────────────
  // reading_turns 는 readings 를 따라 cascade 로 함께 지워집니다.
  //
  // 한 표가 실패해도 나머지는 계속 지웁니다. 절반만 지워진 상태로 두는
  // 것보다, 지울 수 있는 만큼 지우고 계정을 없애는 편이 낫습니다 —
  // 남은 줄은 계정이 사라지면 cascade 가 데려갑니다.
  for (const table of ["readings", "user_memories", "credit_entries", "profiles"] as const) {
    const column = table === "profiles" ? "id" : "user_id"
    const { error } = await admin.from(table).delete().eq(column, user.id)
    if (error) {
      console.error(`[account/delete] ${table} 를 못 지웠습니다:`, error.message)
    }
  }

  // ── 3) 계정을 지웁니다 ──────────────────────────────────────────────
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error("[account/delete] 계정을 못 지웠습니다:", deleteError.message)

    // 결제 기록이 계정을 붙잡고 있는 경우입니다. 표 고치기를 아직
    // 실행하지 않은 배포에서 이렇게 됩니다.
    // (supabase/migrations/001-account-deletion.sql)
    const heldByPurchase = /violates foreign key|purchases/i.test(deleteError.message)
    if (heldByPurchase) {
      console.error(
        "[account/delete] purchases 가 계정을 붙잡고 있습니다. " +
          "supabase/migrations/001-account-deletion.sql 을 실행하세요.",
      )
    }

    return NextResponse.json(
      {
        error: "탈퇴를 마치지 못했습니다. 잠시 뒤 다시 시도하거나 고객센터로 알려주세요.",
        kind: "server",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
