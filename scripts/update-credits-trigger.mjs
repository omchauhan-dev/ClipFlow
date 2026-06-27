import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gpyduhbuauphjchcqvlb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweWR1aGJ1YXVwaGpjaGNxdmxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzA4MCwiZXhwIjoyMDg5Mzc5MDgwfQ.mtpynkTMZUcvVmpiaPiI7FTECTfGAzXTImefQjsQ4v4'
);

const sql = `
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

alter table public.profiles alter column credits_balance set default 20;
`;

async function main() {
  // Try management API
  const resp = await fetch('https://api.supabase.com/v1/projects/gpyduhbuauphjchcqvlb/database/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  console.log('Status:', resp.status);
  if (resp.ok) {
    console.log('Trigger function updated successfully');
  } else {
    const txt = await resp.text();
    console.log('Error:', txt.slice(0, 500));
  }
}

main().catch(console.error);
