-- deduct_credits RPC for batch-generate route
-- Deducts credits from profiles.credits_balance atomically
-- Returns the new balance, or errors if insufficient

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount numeric,
  p_model text default null,
  p_job_id text default null
) returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance numeric;
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
