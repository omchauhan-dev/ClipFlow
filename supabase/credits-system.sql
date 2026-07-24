-- =====================================================
-- ClipFlow Credits System — run once in Supabase SQL Editor
-- =====================================================
-- Single source of truth: profiles.credits_balance (integer)

-- 1. PROFILES TABLE (safe to re-run)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  plan text default 'free',
  credits_balance integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles alter column credits_balance set default 50;

-- 2. PAYMENTS TABLE (idempotency ledger for purchases)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  payment_id text unique,
  amount integer,
  kind text,
  created_at timestamptz default now()
);

-- 3. AUTO-CREATE PROFILE ON SIGNUP (50 free credits)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, credits_balance)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    50
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. DEDUCT_CREDITS RPC (atomic with row-level lock)
-- Returns new balance or raises exception
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  select credits_balance into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'profile_not_found';
  end if;

  if v_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  update public.profiles
  set credits_balance = credits_balance - p_amount,
      updated_at = now()
  where id = p_user_id
  returning credits_balance into v_balance;

  return v_balance;
end;
$$;

-- 5. ADD_CREDITS RPC (idempotent via payments.payment_id)
-- Returns new balance
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_payment_id text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_payment_id is not null then
    if exists (select 1 from public.payments where payment_id = p_payment_id) then
      select credits_balance into v_balance from public.profiles where id = p_user_id;
      return coalesce(v_balance, 0);
    end if;
    insert into public.payments (user_id, payment_id, amount, kind)
    values (p_user_id, p_payment_id, p_amount, 'purchase');
  end if;

  update public.profiles
  set credits_balance = coalesce(credits_balance, 0) + p_amount,
      updated_at = now()
  where id = p_user_id
  returning credits_balance into v_balance;

  return v_balance;
end;
$$;

-- 6. BACKFILL: give 50 credits to existing profiles with less
update public.profiles
set credits_balance = 50
where credits_balance < 50 or credits_balance is null;

-- 7. BACKFILL: create profiles for auth users missing them
insert into public.profiles (id, email, name, credits_balance, created_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  50,
  u.created_at
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
