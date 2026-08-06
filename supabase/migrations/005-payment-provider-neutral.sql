-- supabase/migrations/005-payment-provider-neutral.sql
-- 결제 마무리 함수를 결제사와 무관한 이름으로.
-- 여러 번 실행해도 안전합니다.
--
-- ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
-- │ 003 에서 만든 finalize_toss_purchase 는 하는 일이 사실 토스와
-- │ 아무 상관이 없습니다 — 주문 줄을 잠그고, 별조각을 얹고, paid 로
-- │ 바꾸는 것뿐입니다. 카카오페이도 똑같이 그 일이 필요합니다.
-- │
-- │ 이름에 toss 가 박혀 있으면 카카오 결제를 "toss" 함수로 마무리하게
-- │ 되어, 나중에 읽는 사람이 반드시 헷갈립니다.
-- └──────────────────────────────────────────────────────────────────
--
-- ⚠️ 옛 이름(finalize_toss_purchase)은 지우지 않고 남겨둡니다.
--    이 SQL 을 먼저 돌리고 코드를 나중에 올리는 동안, 아직 옛 이름을
--    부르는 코드가 도는 시간이 있습니다. 그때 함수가 사라져 있으면
--    그 사이의 결제가 전부 실패합니다. 코드가 다 올라간 뒤 지우세요.
--
--   지울 때: drop function if exists public.finalize_toss_purchase(text, uuid, text, text, timestamptz);

create or replace function public.finalize_purchase(
  p_order_id text,
  p_user_id uuid,
  p_payment_key text,
  p_method text default null,
  p_paid_at timestamptz default now()
)
returns table(ok boolean, credits integer, message text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
begin
  select * into v_purchase
  from public.purchases
  where order_id = p_order_id
    and user_id = p_user_id
  for update;

  if not found then
    return query select false, 0, 'purchase_not_found';
    return;
  end if;

  if v_purchase.status = 'paid' then
    -- 같은 주문에 다른 결제가 붙으면 사람이 봐야 합니다.
    if v_purchase.payment_key is not null and v_purchase.payment_key <> p_payment_key then
      return query select false, v_purchase.credits, 'payment_key_mismatch';
      return;
    end if;

    return query select true, v_purchase.credits, 'already_paid';
    return;
  end if;

  if v_purchase.status <> 'pending' then
    return query select false, v_purchase.credits, 'purchase_not_pending';
    return;
  end if;

  insert into public.credit_entries (user_id, delta, reason, purchase_id, idempotency_key)
  values (v_purchase.user_id, v_purchase.credits, 'purchase', v_purchase.id, 'purchase:' || v_purchase.order_id)
  on conflict (idempotency_key) do nothing;

  update public.purchases
  set status = 'paid',
      payment_key = p_payment_key,
      method = p_method,
      paid_at = coalesce(p_paid_at, now()),
      failure_reason = null
  where id = v_purchase.id;

  return query select true, v_purchase.credits, 'paid';
end;
$$;

-- ⚠️⚠️ 이 두 줄이 없으면 결제 없이 별조각을 받을 수 있습니다.
--    security definer 함수는 만들면 PUBLIC 에게 실행 권한이 열립니다.
--    로그인한 사람이 브라우저의 anon 키로 자기 pending 주문에 대고
--    이 함수를 부르면, 한 푼도 내지 않고 별조각이 지급됩니다.
revoke all on function public.finalize_purchase(text, uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.finalize_purchase(text, uuid, text, text, timestamptz)
  to service_role;

-- ── 확인 ────────────────────────────────────────────────────────────
--   select p.proname, r.rolname
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     cross join lateral aclexplode(p.proacl) a
--     join pg_roles r on r.oid = a.grantee
--    where n.nspname = 'public' and p.proname = 'finalize_purchase';
--   → postgres(소유자) 와 service_role 만 나와야 합니다.
--     anon · authenticated 가 보이면 위 revoke 가 안 돈 것입니다.
