-- supabase/schema.sql
-- Soul Seoul 데이터 구조.
--
-- 쓰는 법: Supabase 프로젝트를 만든 뒤 SQL Editor 에 이 파일을 통째로
-- 붙여넣고 실행합니다. 여러 번 실행해도 괜찮게 써 두었습니다.
--
-- 지금 브라우저(localStorage)에 있는 것들이 여기로 옮겨옵니다.
--   lib/reading-entitlement.ts  →  credit_entries
--   lib/reading-archive.ts      →  readings · reading_turns
--
-- ┌─ 왜 이렇게 나눴는지 ──────────────────────────────────────────────
-- │ · 크레딧을 "남은 장수" 숫자 하나로 두지 않습니다. 오간 내역을 한 줄씩
-- │   쌓고 합계를 냅니다. 숫자 하나만 두면 "왜 줄었지?"를 나중에 밝힐
-- │   길이 없고, 결제 취소·환불도 손으로 고쳐야 합니다.
-- │ · 대화는 리딩과 따로 둡니다. 한 판에 수십 줄이 붙는데 매번 통째로
-- │   다시 쓰면 낭비이고, 마디마다 좋아요/싫어요를 달아야 합니다.
-- └──────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════
-- 1. 회원
-- ═══════════════════════════════════════════════════════════════════
-- 로그인 자체(카카오·구글·이메일)는 Supabase 의 auth.users 가 맡습니다.
-- 우리가 따로 들고 있어야 하는 것만 여기 둡니다.
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  display_name text,
  -- 가입 크레딧을 이미 받았는지. 탈퇴·재가입으로 계속 받아가는 걸 막습니다.
  welcomed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 가입하면 프로필을 자동으로 만들어 줍니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- 2. 크레딧 — 잔액이 아니라 내역
-- ═══════════════════════════════════════════════════════════════════
-- delta 가 + 면 들어온 것(가입 선물·구매·환불), - 면 쓴 것(타로점).
-- 잔액은 이 줄들을 더해서 냅니다.
create table if not exists public.credit_entries (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  delta       integer not null check (delta <> 0),
  -- welcome  가입 선물
  -- purchase 구매
  -- reading  타로점 한 판 시작
  -- extend   한 장 더 써서 이어묻기
  -- refund   환불·취소
  -- grant    운영자가 손으로 얹어줌 (사과·이벤트)
  reason      text not null check (
    reason in ('welcome','purchase','reading','extend','refund','grant')
  ),
  reading_id  uuid,
  purchase_id uuid,
  -- 같은 일로 두 번 깎이지 않게 하는 열쇠.
  -- 예: 'reading:<uuid>' — 새로고침으로 두 번 눌러도 한 번만 들어갑니다.
  idempotency_key text unique,
  created_at  timestamptz not null default now()
);

create index if not exists credit_entries_user_idx
  on public.credit_entries (user_id, created_at desc);

-- 남은 장수. 화면은 이걸 봅니다.
--
-- ⚠️ security_invoker 를 빠뜨리면 안 됩니다.
--    뷰는 기본적으로 "만든 사람"의 권한으로 돕니다. 그러면 credit_entries
--    에 걸어둔 RLS 를 건너뛰어서, 로그인한 아무나 남의 잔액까지 다 볼 수
--    있습니다. 이 옵션을 켜야 "보는 사람"의 권한으로 돌아 본인 것만
--    보입니다. (PostgreSQL 15 이상)
create or replace view public.credit_balance
  with (security_invoker = true)
  as
  select user_id, coalesce(sum(delta), 0)::integer as credits
  from public.credit_entries
  group by user_id;

-- ═══════════════════════════════════════════════════════════════════
-- 3. 타로점 한 판
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.readings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  question     text not null,
  topic_label  text,
  -- 샨티가 고른 배열. 다시 열었을 때 그때 모양 그대로 놓기 위해 남깁니다.
  layout_key   text,
  positions    text[],
  -- [{ name, reversed, imageUrl }]
  cards        jsonb not null default '[]'::jsonb,
  -- { title, summary, keywords, sections }
  result       jsonb,
  -- 이 판에 허락된 이어묻기 횟수. 한 장 더 쓸 때마다 늘어납니다.
  followups_allowed integer not null default 20,
  -- 해석 자체에 대한 좋아요 1 / 싫어요 -1.
  -- 이어지는 대화의 평가는 reading_turns.rating 에 따로 남습니다.
  rating       smallint check (rating in (-1, 1)),
  created_at   timestamptz not null default now()
);

create index if not exists readings_user_idx
  on public.readings (user_id, created_at desc);

-- 해석을 받은 뒤 오간 말
create table if not exists public.reading_turns (
  id         bigserial primary key,
  reading_id uuid not null references public.readings on delete cascade,
  role       text not null check (role in ('user','shanti')),
  body       text not null,
  -- 이 마디에서 더 뽑은 카드 (있을 때만)
  cards      jsonb,
  -- 좋아요 1 / 싫어요 -1. 답변 품질을 고치는 데 쓸 유일한 단서라
  -- 화면의 따봉을 반드시 여기로 이어야 합니다.
  rating     smallint check (rating in (-1, 1)),
  created_at timestamptz not null default now()
);

create index if not exists reading_turns_reading_idx
  on public.reading_turns (reading_id, id);

-- ═══════════════════════════════════════════════════════════════════
-- 4. 결제 (토스페이먼츠)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete restrict,
  -- lib/credit-packs.ts 의 CreditPack.key
  pack_key      text not null,
  credits       integer not null check (credits > 0),
  amount_krw    integer not null check (amount_krw > 0),
  -- pending  결제창을 띄운 상태
  -- paid     승인 완료 (이때 credit_entries 에 + 한 줄이 들어갑니다)
  -- failed   실패·이탈
  -- canceled 취소·환불
  status        text not null default 'pending'
                check (status in ('pending','paid','failed','canceled')),
  provider      text not null default 'toss',
  -- 우리가 만들어 토스에 넘기는 주문번호
  order_id      text not null unique,
  -- 토스가 돌려주는 결제 열쇠 (취소·조회에 씁니다)
  payment_key   text,
  -- 카드 / 카카오페이 / 토스페이 …
  method        text,
  failure_reason text,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create index if not exists purchases_user_idx
  on public.purchases (user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- 5. 권한 — 남의 것을 못 보게
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️ RLS 를 켜지 않으면 anon 키만 있으면 남의 기록이 다 보입니다.
--    켜는 것을 잊지 마세요.
alter table public.profiles       enable row level security;
alter table public.credit_entries enable row level security;
alter table public.readings       enable row level security;
alter table public.reading_turns  enable row level security;
alter table public.purchases      enable row level security;

drop policy if exists "본인 프로필만" on public.profiles;
create policy "본인 프로필만" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 크레딧 내역은 "보기"만 됩니다. 넣고 빼는 건 서버(서비스 키)만 합니다 —
-- 브라우저가 직접 넣을 수 있으면 크레딧을 스스로 충전할 수 있습니다.
drop policy if exists "본인 크레딧 보기" on public.credit_entries;
create policy "본인 크레딧 보기" on public.credit_entries
  for select using (auth.uid() = user_id);

drop policy if exists "본인 타로점만" on public.readings;
create policy "본인 타로점만" on public.readings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "본인 대화만" on public.reading_turns;
create policy "본인 대화만" on public.reading_turns
  for all using (
    exists (select 1 from public.readings r
            where r.id = reading_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.readings r
            where r.id = reading_id and r.user_id = auth.uid())
  );

-- 결제도 보기만. 상태를 바꾸는 건 서버가 토스 승인을 확인한 뒤에만 합니다.
drop policy if exists "본인 결제 보기" on public.purchases;
create policy "본인 결제 보기" on public.purchases
  for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 6. 크레딧 쓰기 — 잔액 확인과 차감을 한 번에
-- ═══════════════════════════════════════════════════════════════════
-- 확인하고 나서 따로 깎으면, 그 사이에 두 번 눌린 요청이 둘 다 통과할 수
-- 있습니다(한 장으로 두 판). 한 덩어리로 묶어 둡니다.
--
-- 여기의 security definer 는 일부러 그런 것입니다. credit_entries 는 넣기가
-- 막혀 있어서(보기만 허용), 이 함수만 예외로 넣을 수 있어야 합니다.
-- 대신 이 함수는 -1 밖에 못 넣습니다 — 충전은 결제 확인을 거친 서버만 합니다.
create or replace function public.spend_credit(
  p_user_id uuid,
  p_reason  text,
  p_reading_id uuid default null,
  p_key     text default null
)
returns integer            -- 쓰고 난 잔액. 모자라면 -1
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
begin
  -- 이 회원에 대해서만 순서를 세웁니다. 같은 사람의 요청 둘이 동시에
  -- 들어와도 하나가 끝날 때까지 다른 하나가 기다립니다 (다른 회원은
  -- 서로 안 기다립니다).
  --
  -- ⚠️ 여기서 "select sum(...) ... for update" 를 쓰면 안 됩니다.
  --    PostgreSQL 은 합계를 내는 조회에 잠금을 걸지 못해
  --    "FOR UPDATE is not allowed with aggregate functions" 로 죽습니다.
  --    만들 때는 통과하고 처음 불릴 때 터지므로 찾기 어렵습니다.
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

  -- 같은 열쇠로 이미 깎은 요청이면 아무 줄도 안 들어갑니다.
  -- 그때 v_balance - 1 을 돌려주면 깎지도 않고 깎았다고 말하는 셈입니다.
  if not found then
    return v_balance;
  end if;

  return v_balance - 1;
end;
$$;
