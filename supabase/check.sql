-- supabase/check.sql
-- "지금 이 프로젝트에 schema.sql 이 어디까지 반영돼 있나"를 봅니다.
--
-- 쓰는 법: Supabase → SQL Editor 에 통째로 붙여넣고 Run.
--
-- ⚠️ 읽기만 합니다. 표를 만들지도, 지우지도, 고치지도 않습니다.
--    마음 놓고 아무 때나 돌려도 됩니다.
--
-- ┌─ 왜 있는가 ───────────────────────────────────────────────────────
-- │ schema.sql 에 칸을 더해도, 이미 만들어진 프로젝트는 그 파일을 다시
-- │ 돌리기 전까지 옛 모양 그대로입니다. 그런데 어긋난 자리는 조용히
-- │ 망가집니다 — 예전에 rating 칸이 없어서 "타로점 하나 열기"만 통째로
-- │ 실패했고(목록은 그 칸을 안 읽어 멀쩡했습니다) 원인을 찾는 데 한참
-- │ 걸렸습니다. 눈으로 한 번에 확인할 자리가 필요합니다.
-- └──────────────────────────────────────────────────────────────────
--
-- ❌ 가 하나라도 보이면 supabase/schema.sql 을 통째로 다시 돌리면 됩니다.
--    여러 번 돌려도 괜찮게 써 두었습니다.
with 있어야_하는_것(구분, 이름, 있음) as (
  select '표', t, to_regclass('public.' || t) is not null
  from unnest(array['profiles','credit_entries','readings','reading_turns',
                    'user_memories','purchases']) as t

  union all
  select '뷰', 'credit_balance', to_regclass('public.credit_balance') is not null

  union all
  select '함수', f, exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = f)
  from unnest(array['spend_credit','handle_new_user']) as f

  -- 이게 없으면 가입해도 프로필이 안 생깁니다
  union all
  select '트리거', 'on_auth_user_created', exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal)

  -- 나중에 더한 칸들 — 어긋나기 제일 쉬운 자리입니다
  union all
  select '칸', c.tbl || '.' || c.col, exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = c.tbl and column_name = c.col)
  from (values
    ('readings','rating'), ('readings','followups_allowed'),
    ('readings','layout_key'), ('readings','positions'),
    ('readings','thread_digest'), ('readings','draw_signals'),
    ('reading_turns','rating'), ('reading_turns','cards')
  ) as c(tbl, col)

  -- ⚠️ 이게 꺼져 있으면 anon 키만으로 남의 기록이 다 보입니다
  union all
  select 'RLS', t, coalesce((
    select c.relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = t), false)
  from unnest(array['profiles','credit_entries','readings','reading_turns',
                    'user_memories','purchases']) as t

  -- ⚠️ 이게 빠지면 뷰가 "만든 사람" 권한으로 돌아 RLS 를 건너뜁니다 —
  --    로그인한 아무나 남의 잔액까지 다 보입니다
  union all
  select '뷰 권한', 'credit_balance = security_invoker', coalesce((
    select c.reloptions @> array['security_invoker=true'] from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'credit_balance'), false)
)
-- 빠진 것이 맨 위로 오게 정렬합니다
select 구분, 이름,
       case when 있음 then '✅ 있음' else '❌ 없음 — schema.sql 을 돌리세요' end as 상태
from 있어야_하는_것
order by 있음, 구분, 이름;
