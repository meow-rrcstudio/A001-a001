-- supabase/migrations/002-security-hardening.sql
-- 실서비스 오픈 전 개인정보/상담 데이터 보호 강화.
-- 여러 번 실행해도 안전합니다.

-- 1) 상담 기록은 브라우저에서 직접 쓰지 못하게 합니다.
-- 서버 API가 소유권, 크레딧, 이어묻기 횟수를 검증한 뒤 service_role 으로만 씁니다.
drop policy if exists "본인 타로점만" on public.readings;
drop policy if exists "본인 타로점 보기" on public.readings;
create policy "본인 타로점 보기" on public.readings
  for select using (auth.uid() = user_id);

drop policy if exists "본인 대화만" on public.reading_turns;
drop policy if exists "본인 대화 보기" on public.reading_turns;
create policy "본인 대화 보기" on public.reading_turns
  for select using (
    exists (select 1 from public.readings r
            where r.id = reading_id and r.user_id = auth.uid())
  );

-- 2) spend_credit RPC 를 직접 호출하더라도 남의 크레딧을 깎지 못하게 합니다.
create or replace function public.spend_credit(
  p_user_id uuid,
  p_reason  text,
  p_reading_id uuid default null,
  p_key     text default null
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if auth.uid() is null or auth.uid() <> p_user_id then
      raise exception 'not allowed to spend credits for another user'
        using errcode = '42501';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select coalesce(sum(delta), 0) into v_balance
  from public.credit_entries
  where user_id = p_user_id;

  if v_balance < 1 then
    return -1;
  end if;

  insert into public.credit_entries (user_id, delta, reason, reading_id, idempotency_key)
  values (p_user_id, -1, p_reason, p_reading_id, p_key)
  on conflict (idempotency_key) do nothing;

  if not found then
    return v_balance;
  end if;

  return v_balance - 1;
end;
$$;

revoke all on function public.spend_credit(uuid, text, uuid, text) from public;
grant execute on function public.spend_credit(uuid, text, uuid, text) to authenticated, service_role;

-- 3) 신규/기존 DB 모두에서 탈퇴 시 auth.users 삭제가 결제 FK 에 막히지 않게 합니다.
alter table public.purchases
  add column if not exists buyer_email text;

alter table public.purchases
  alter column user_id drop not null;

alter table public.purchases
  drop constraint if exists purchases_user_id_fkey;

alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users on delete set null;
