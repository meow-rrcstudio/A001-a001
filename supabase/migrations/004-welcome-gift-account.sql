-- supabase/migrations/004-welcome-gift-account.sql
-- 가입 선물을 "판"이 아니라 "계정"에 붙입니다.
-- 여러 번 실행해도 안전합니다.
--
-- ┌─ 무엇이 문제였나 ─────────────────────────────────────────────────
-- │ 가입 선물은 별조각 1장 + 이어묻기 3회입니다. 그런데 3회가 계정이
-- │ 아니라 "판 하나"에 박혀 있었습니다. 붙는 자리가 두 곳이었고
-- │ (새로 시작한 판 · 가입 전 맛보기 판 중 가장 최근 것), 그 판이
-- │ 아닌 데서 대화를 이어가려 하면 화면에 남는 길이 "별조각 한 장 더
-- │ 쓰고 이어서 묻기" 하나뿐이었습니다. 누르면 방금 받은 선물 별조각이
-- │ 그 자리에서 나갑니다 — "가입했는데 바로 한 장이 사라졌다"의 정체입니다.
-- │
-- │ 이제 3회는 계정에 얹힙니다. 어느 판에서 이어묻든 선물부터 쓰이고,
-- │ 다 쓴 뒤에야 별조각을 씁니다.
-- └──────────────────────────────────────────────────────────────────

-- ── 1) 계정이 들고 있는 선물 이어묻기 ────────────────────────────────
-- 기본값 0 입니다. 3 을 채우는 것은 가입 선물이 실제로 나갈 때뿐입니다
-- (app/api/account/route.ts). 기본을 3 으로 두면 이미 판에서 3회를 받아
-- 쓴 사람들에게 한 번 더 나갑니다.
alter table public.profiles
  add column if not exists welcome_followups_left integer not null default 0;

comment on column public.profiles.welcome_followups_left is
  '가입 선물로 남은 이어묻기 횟수. 어느 판에서든 이것부터 씁니다.';

-- ── 2) 선물을 이 판에 붙입니다 ───────────────────────────────────────
-- 남은 몫을 통째로 옮기고 계정 쪽은 0 으로 만듭니다. 줄을 잠그고 하므로
-- 두 창에서 동시에 눌러도 두 번 나가지 않습니다.
create or replace function public.claim_welcome_followups(
  p_user_id uuid,
  p_reading_id uuid
)
returns integer            -- 이 판에 붙인 횟수 (없으면 0)
language plpgsql
security definer set search_path = public
as $$
declare
  v_left integer;
begin
  select welcome_followups_left into v_left
  from public.profiles
  where id = p_user_id
  for update;

  if v_left is null or v_left <= 0 then
    return 0;
  end if;

  update public.profiles
  set welcome_followups_left = 0
  where id = p_user_id;

  update public.readings
  set followups_allowed = followups_allowed + v_left
  where id = p_reading_id
    and user_id = p_user_id;

  return v_left;
end;
$$;

revoke all on function public.claim_welcome_followups(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_welcome_followups(uuid, uuid) to service_role;

-- ── 3) 가입 → 탈퇴 → 재가입으로 선물을 계속 받아가는 것 ──────────────
-- ┌─ 왜 표를 따로 두는가 ─────────────────────────────────────────────
-- │ 지금은 profiles.welcomed_at 으로 "이미 줬다"를 표시합니다. 그런데
-- │ 탈퇴하면 계정과 함께 프로필도 지워집니다(cascade). 그래서 탈퇴하고
-- │ 다시 가입하면 선물이 처음부터 다시 나갑니다 — 몇 번이고요.
-- │
-- │ 표시가 사람과 함께 지워지지 않으려면 사람 밖에 있어야 합니다.
-- │ 다만 탈퇴한 사람의 이메일을 그대로 들고 있을 수는 없습니다. 그래서
-- │ 이메일 자체가 아니라 되돌릴 수 없는 지문(sha256)만 남깁니다 —
-- │ "이 지문에게 준 적이 있다"는 것만 알 수 있고, 그 지문으로 누구인지
-- │ 알아낼 수는 없습니다.
-- │
-- │ ⚠️ 재가입을 막지 않습니다. 30일 안에 다시 오면 가입은 되고 선물만
-- │    안 나갑니다. 가입 자체를 막으면 정말로 다시 오고 싶은 사람까지
-- │    문을 닫는 셈이라, 막을 것(공짜 반복)만 막습니다.
-- │
-- │ ⚠️ 개인정보처리방침에 이 항목이 적혀 있어야 합니다 (app/privacy).
-- └──────────────────────────────────────────────────────────────────
create table if not exists public.welcome_grants (
  -- lower(email) 의 sha256 (16진). 원본 이메일은 남기지 않습니다.
  email_hash text primary key,
  granted_at timestamptz not null default now()
);

comment on table public.welcome_grants is
  '가입 선물을 받은 적 있는 이메일의 지문. 탈퇴 후 재가입으로 선물을 반복 수령하는 것을 막습니다.';

-- 서버(서비스 키)만 봅니다. 정책을 하나도 만들지 않으면 그 밖의 모든
-- 접근이 막힙니다 — 이 표는 화면이 볼 일이 없습니다.
alter table public.welcome_grants enable row level security;

-- 오래된 지문은 지워도 됩니다 (아래 쿨다운이 지난 것). 지금은 사람이
-- 가끔 치우면 되고, 자동으로 지우고 싶으면 이 쿼리를 예약하세요.
--   delete from public.welcome_grants where granted_at < now() - interval '30 days';

-- ── 확인 ────────────────────────────────────────────────────────────
--   select welcome_followups_left from public.profiles where id = '<uuid>';
--   select count(*) from public.welcome_grants;
