import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const characters = [
  {
    name: 'Arjun',
    description: 'Young Indian male, mid-20s, short black hair, confident smile, athletic build, wearing a casual blue shirt, bright natural lighting',
    seed: 738291,
  },
];

async function seed() {
  for (const char of characters) {
    const { data, error } = await supabase
      .from('characters')
      .upsert(char, { onConflict: 'name' })
      .select();

    if (error) {
      console.error(`Failed to insert "${char.name}":`, error.message);
    } else {
      console.log(`Created character: ${data[0].name} (id: ${data[0].id})`);
    }
  }
}

seed().catch(console.error);
