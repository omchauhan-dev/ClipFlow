-- Razorpay payments support for ClipFlow
-- Run in the Supabase SQL editor.

-- 1. Ensure the credits table has the columns we rely on.
alter table public.credits
  add column if not exists plan text default 'free',
  add column if not exists balance numeric default 0,
  add column if not exists updated_at timestamptz default now();

-- 2. Payment ledger to make credit grants idempotent (verify + webhook may both fire).
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  payment_id text unique,          -- razorpay_payment_id (idempotency key)
  amount numeric,                  -- credits granted (USD balance)
  kind text,                       -- 'pack' | 'plan'
  created_at timestamptz default now()
);

-- 3. add_credits: grant balance once per payment_id.
--    Safe to call from both the verify route and the webhook.
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount numeric,
  p_payment_id text default null
) returns numeric
language plpgsql
as $$
declare
  v_balance numeric;
begin
  -- Idempotency: if we've already recorded this payment, do nothing.
  if p_payment_id is not null then
    if exists (select 1 from public.payments where payment_id = p_payment_id) then
      select balance into v_balance from public.credits where user_id = p_user_id;
      return coalesce(v_balance, 0);
    end if;
    insert into public.payments (user_id, payment_id, amount, kind)
    values (p_user_id, p_payment_id, p_amount, 'pack');
  end if;

  -- Upsert the credits row and add to balance.
  insert into public.credits (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id)
  do update set balance = coalesce(public.credits.balance, 0) + p_amount,
                updated_at = now()
  returning balance into v_balance;

  return v_balance;
end;
$$;
