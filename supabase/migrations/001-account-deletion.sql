-- supabase/migrations/001-account-deletion.sql
-- 회원탈퇴를 가능하게 하는 표 고치기.
--
-- ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
-- │ 약관 제11조와 개인정보처리방침은 "언제든지 탈퇴할 수 있고, 탈퇴하면
-- │ 계정과 리딩 기록을 지운다"고 약속합니다. 그런데 지금 표 구조로는
-- │ 그 약속을 지킬 수가 없습니다.
-- │
-- │   purchases.user_id → auth.users ON DELETE RESTRICT
-- │
-- │ restrict 는 "이 사람을 가리키는 결제 기록이 하나라도 있으면 사람을
-- │ 지우지 못한다"는 뜻입니다. 결제 기록을 지키려고 일부러 그렇게 둔
-- │ 것이고 그 판단은 옳습니다 — 전자상거래법 제6조는 대금 결제 기록을
-- │ 5년간 보관하라고 정합니다.
-- │
-- │ 문제는 그 탓에 "한 번이라도 결제한 사람은 영영 탈퇴할 수 없다"가
-- │ 된다는 것입니다. 두 요구가 부딪히는 자리입니다.
-- └──────────────────────────────────────────────────────────────────
--
-- ┌─ 어떻게 푸는가 ───────────────────────────────────────────────────
-- │ 결제 기록은 남기되, 그 줄이 더 이상 "사람"을 가리키지 않게 합니다.
-- │
-- │   1) 법이 요구하는 것(누가·언제·얼마·무엇을)은 결제 줄 자체에
-- │      박아 둡니다 — buyer_email 을 새로 답니다. 지금은 user_id 를
-- │      따라가야만 누구인지 알 수 있는데, 사람이 지워지면 그 길이
-- │      끊기기 때문입니다.
-- │   2) user_id 는 비울 수 있게 하고(null 허용), 사람이 지워지면
-- │      저절로 비워지게 합니다(set null).
-- │
-- │ 결과: 사람은 지워지고, 결제 기록은 "누가 얼마를 냈는지"를 지닌 채
-- │ 그대로 남습니다.
-- └──────────────────────────────────────────────────────────────────
--
-- ⚠️ 이 파일을 실행하기 전에는 회원탈퇴가 동작하지 않습니다.
--    (결제한 적 없는 사람은 지워지지만, 결제한 사람은 막힙니다)
--    Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
--    여러 번 실행해도 안전합니다.

-- ── 1) 산 사람이 누구였는지를 결제 줄에 박아 둡니다 ─────────────────
-- 사람이 지워진 뒤에도 "누가 냈는가"가 남아야 법이 요구하는 기록이 됩니다.
alter table public.purchases
  add column if not exists buyer_email text;

comment on column public.purchases.buyer_email is
  '결제한 사람의 이메일 (탈퇴로 user_id 가 비어도 남는 기록). 전자상거래법 제6조 5년 보관.';

-- 이미 쌓인 결제 줄에는 지금 계정에서 이메일을 옮겨 적습니다.
-- (이 값이 비어 있는 줄만 채웁니다 — 여러 번 실행해도 덮어쓰지 않습니다)
update public.purchases p
   set buyer_email = u.email
  from auth.users u
 where p.user_id = u.id
   and p.buyer_email is null;

-- ── 2) 사람이 지워지면 결제 줄의 user_id 만 비웁니다 ─────────────────
-- 줄 자체는 남습니다. 지우는 것이 아니라 연결만 끊는 것입니다.
alter table public.purchases
  alter column user_id drop not null;

alter table public.purchases
  drop constraint if exists purchases_user_id_fkey;

alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users on delete set null;

-- ── 확인 ────────────────────────────────────────────────────────────
-- 아래를 실행하면 'SET NULL' 이 나와야 합니다.
--
--   select rc.delete_rule
--     from information_schema.referential_constraints rc
--    where rc.constraint_name = 'purchases_user_id_fkey';
