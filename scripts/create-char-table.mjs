import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gpyduhbuauphjchcqvlb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweWR1aGJ1YXVwaGpjaGNxdmxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzA4MCwiZXhwIjoyMDg5Mzc5MDgwfQ.mtpynkTMZUcvVmpiaPiI7FTECTfGAzXTImefQjsQ4v4'
);

async function main() {
  // Try inserting into characters table directly
  const { data: insertData, error: insertError } = await supabase
    .from('characters')
    .insert({
      name: 'Arjun',
      description: 'Young Indian male, mid-20s, short black hair, confident smile, athletic build, wearing a casual blue shirt, bright natural lighting',
      seed: Math.floor(Math.random() * 1000000)
    })
    .select();

  console.log('Insert result:', JSON.stringify({ insertData, insertError }, null, 2));

  if (insertError && insertError.message?.includes('does not exist')) {
    console.log('\nTable does not exist. Trying to create via SQL...');
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS public.characters (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL,
        seed bigint NOT NULL,
        image_url text,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;`
    });
    console.log('SQL exec result:', JSON.stringify({ sqlError }, null, 2));
  }
}

main().catch(console.error);
