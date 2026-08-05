-- supabase/migrations/003-payment-hardening.sql
-- 실결제 개시(2026-08-21) 전 결제 표·함수 손보기.
-- 여러 번 실행해도 안전합니다.
--
-- ⚠️ 이 파일을 코드보다 "먼저" 실행하세요.
--    app/api/payments/confirm 이 아래 finalize_toss_purchase 를 부릅니다.
--    함수가 없는 DB 에 새 코드가 올라가면 모든 승인이 500 으로 떨어집니다.
--    되돌릴 때도 반대 순서입니다 (코드를 먼저 되돌리고 함수는 두세요).
--
-- 002 번은 개인정보 쪽(supabase/migrations/002-security-hardening.sql)이
-- 쓰고 있습니다. 결제는 003 입니다.

-- ═══════════════════════════════════════════════════════════════════
-- 1. 표에 없던 칸 — 환불 기록
-- ═══════════════════════════════════════════════════════════════════
-- 환불은 지금까지 토스 대시보드에서 손으로 했고, 우리 표에는 아무 자국도
-- 남지 않았습니다. 그러면 "환불했는데 별조각은 그대로"가 조용히 남습니다.
alter table public.purchases
  add column if not exists canceled_at timestamptz;

alter table public.purchases
  add column if not exists refund_krw integer;

comment on column public.purchases.refund_krw is
  '실제로 돌려준 금액. 쓴 몫을 낱개 값으로 친 뒤의 값 (app/refund 제4조).';

-- 같은 결제 열쇠가 두 줄에 붙지 못하게. (한 번의 결제는 한 주문에만)
create unique index if not exists purchases_payment_key_unique
  on public.purchases (payment_key)
  where payment_key is not null;

-- 미확정 주문을 사람이 훑을 때 쓰는 색인
create index if not exists purchases_pending_user_created_idx
  on public.purchases (user_id, created_at desc)
  where status = 'pending';

-- ═══════════════════════════════════════════════════════════════════
-- 2. 승인 마무리를 한 덩어리로
-- ═══════════════════════════════════════════════════════════════════
-- 별조각 지급과 purchases 의 paid 표시를 API 서버가 따로 실행하면, 그 사이에
-- 끊겼을 때 "돈은 받았는데 미지급" 또는 "지급은 됐는데 결제는 pending" 이
-- 됩니다. 함수 안에서 그 줄을 잠그고 둘을 같은 트랜잭션으로 묶습니다.
create or replace function public.finalize_toss_purchase(
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
--
--    security definer 함수는 만들면 PUBLIC 에게 실행 권한이 열립니다.
--    로그인한 사람이 브라우저의 anon 키로 이렇게 부를 수 있습니다.
--
--      rpc('finalize_toss_purchase', {
--        p_order_id: '내가 방금 만든 주문', p_user_id: '내 uuid', p_payment_key: 'aaa'
--      })
--
--    /api/payments/checkout 만 부르면 pending 주문은 얼마든지 만들 수
--    있으니, 토스에 한 푼도 내지 않고 별조각이 지급되고 주문이 paid 로
--    바뀝니다. 이 함수는 우리 서버(서비스 키)만 부를 수 있어야 합니다.
revoke all on function public.finalize_toss_purchase(text, uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.finalize_toss_purchase(text, uuid, text, text, timestamptz)
  to service_role;

-- ═══════════════════════════════════════════════════════════════════
-- 3. 환불 — 돈을 돌려줄 때 별조각도 함께 거둡니다
-- ═══════════════════════════════════════════════════════════════════
-- ┌─ 왜 필요한가 ─────────────────────────────────────────────────────
-- │ 지금은 토스 대시보드에서 돈만 돌려줍니다. 별조각은 계정에 그대로
-- │ 남습니다 — 열 장을 사고 환불받은 뒤에도 열 판을 볼 수 있습니다.
-- │ 사람이 손으로 credit_entries 를 고치는 것은 언젠가 반드시 빠집니다.
-- └──────────────────────────────────────────────────────────────────
--
-- 쓰는 법 (Supabase SQL Editor):
--   select * from public.refund_purchase('ss_ten_...', 6880, '고객 요청');
--
-- 돈을 먼저 토스에서 돌려주고, 그다음 이걸 실행하세요. 순서가 반대면
-- 별조각만 사라진 채 환불이 실패할 수 있습니다.
--
-- ⚠️ 거둘 수 있는 것은 "아직 남아 있는 만큼"입니다. 이미 써버린 것은
--    되돌릴 수 없으므로 잔액 아래로는 내려가지 않습니다 (잔액이 음수가
--    되면 그 사람은 다음에 산 별조각까지 못 씁니다). 쓴 몫은 돈 쪽에서
--    낱개 값으로 쳐서 빼는 것이 정책입니다 (app/refund 제4조).
create or replace function public.refund_purchase(
  p_order_id text,
  p_refund_krw integer,
  p_note text default null
)
returns table(ok boolean, credits_taken integer, balance_after integer, message text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_balance integer;
  v_take integer;
begin
  select * into v_purchase
  from public.purchases
  where order_id = p_order_id
  for update;

  if not found then
    return query select false, 0, 0, 'purchase_not_found';
    return;
  end if;

  if v_purchase.status = 'canceled' then
    select coalesce(sum(delta), 0) into v_balance
    from public.credit_entries where user_id = v_purchase.user_id;
    return query select true, 0, v_balance, 'already_refunded';
    return;
  end if;

  if v_purchase.status <> 'paid' then
    return query select false, 0, 0, 'purchase_not_paid';
    return;
  end if;

  -- 이 사람의 셈이 도중에 바뀌지 않도록 순서를 세웁니다
  -- (spend_credit 과 같은 열쇠라 서로 기다립니다).
  perform pg_advisory_xact_lock(hashtextextended(v_purchase.user_id::text, 0));

  select coalesce(sum(delta), 0) into v_balance
  from public.credit_entries where user_id = v_purchase.user_id;

  v_take := least(greatest(v_balance, 0), v_purchase.credits);

  if v_take > 0 then
    insert into public.credit_entries (user_id, delta, reason, purchase_id, idempotency_key)
    values (v_purchase.user_id, -v_take, 'refund', v_purchase.id, 'refund:' || v_purchase.order_id)
    on conflict (idempotency_key) do nothing;
  end if;

  update public.purchases
  set status = 'canceled',
      canceled_at = now(),
      refund_krw = p_refund_krw,
      failure_reason = coalesce(p_note, failure_reason)
  where id = v_purchase.id;

  select coalesce(sum(delta), 0) into v_balance
  from public.credit_entries where user_id = v_purchase.user_id;

  return query select true, v_take, v_balance, 'refunded';
end;
$$;

revoke all on function public.refund_purchase(text, integer, text) from public, anon, authenticated;
grant execute on function public.refund_purchase(text, integer, text) to service_role;

-- ═══════════════════════════════════════════════════════════════════
-- 4. 확인 — 실행한 뒤 이 셋이 다 맞아야 합니다
-- ═══════════════════════════════════════════════════════════════════
--
-- (1) 두 함수의 실행 권한이 service_role 에만 있는가
--     select p.proname, r.rolname
--       from pg_proc p
--       join pg_namespace n on n.oid = p.pronamespace
--       cross join lateral aclexplode(p.proacl) a
--       join pg_roles r on r.oid = a.grantee
--      where n.nspname = 'public'
--        and p.proname in ('finalize_toss_purchase','refund_purchase');
--     → service_role 만 나와야 합니다. anon·authenticated·PUBLIC 이 보이면
--       위의 revoke 가 안 돈 것입니다.
--
-- (2) 결제 열쇠가 겹치는 줄이 없는가 (색인이 안 만들어졌다면 여기서 걸립니다)
--     select payment_key, count(*) from public.purchases
--      where payment_key is not null group by 1 having count(*) > 1;
--
-- (3) 돈은 받았는데 별조각이 없는 줄이 있는가 (있으면 손으로 마무리)
--     select p.order_id, p.amount_krw, p.paid_at
--       from public.purchases p
--       left join public.credit_entries c
--         on c.idempotency_key = 'purchase:' || p.order_id
--      where p.status = 'paid' and c.id is null;
