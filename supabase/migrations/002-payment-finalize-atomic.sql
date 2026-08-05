-- 결제 완료 처리를 원자적으로 묶습니다.
-- 승인 API 서버가 크레딧 지급과 purchases paid 표시를 따로 실행하면
-- 중간 실패·동시 요청 때 돈/별조각/결제상태가 어긋날 수 있습니다.

alter table public.purchases
  add column if not exists buyer_email text;

comment on column public.purchases.buyer_email is
  '결제한 사람의 이메일 (탈퇴로 user_id 가 비어도 남는 기록). 전자상거래법 제6조 5년 보관.';

create unique index if not exists purchases_payment_key_unique
  on public.purchases (payment_key)
  where payment_key is not null;

create index if not exists purchases_pending_user_created_idx
  on public.purchases (user_id, created_at desc)
  where status = 'pending';

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
