-- Run this in Supabase SQL Editor (https://app.supabase.com/project/gpyduhbuauphjchcqvlb/sql)
-- Creates the characters table and seeds a character

CREATE TABLE IF NOT EXISTS public.characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  seed bigint NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for now" ON public.characters
  FOR ALL USING (true) WITH CHECK (true);

-- Seed character: Arjun
INSERT INTO public.characters (name, description, seed)
VALUES (
  'Arjun',
  'Young Indian male, mid-20s, short black hair, confident smile, athletic build, wearing a casual blue shirt, bright natural lighting',
  738291
);
