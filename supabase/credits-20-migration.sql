-- 1. Update the trigger function so new users get 20 credits
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
    20
  );
  return new;
end;
$$;

-- 2. Set default on the column so manual inserts also get 20
alter table public.profiles alter column credits_balance set default 20;

-- 3. Give existing profiles 20 credits (only if they have less)
update public.profiles
set credits_balance = 20
where credits_balance < 20 or credits_balance is null;
