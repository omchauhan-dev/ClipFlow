-- Create a public profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add credits_balance if the column doesn't exist yet
alter table public.profiles add column if not exists credits_balance integer default 20;

-- Auto-create a profile row when a new user signs up
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

-- Trigger the function on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sync credits_balance from the existing credits table for all profiles
update public.profiles p
set credits_balance = coalesce((
  select c.balance from public.credits c where c.user_id = p.id
  ), 20);

-- Backfill existing auth users who don't have a profile yet
insert into public.profiles (id, email, name, avatar_url, credits_balance, created_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  u.raw_user_meta_data ->> 'avatar_url',
  coalesce((select c.balance from public.credits c where c.user_id = u.id), 20),
  u.created_at
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
