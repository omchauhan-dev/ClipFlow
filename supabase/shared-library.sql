-- Shared library table for community inspiration images
CREATE TABLE IF NOT EXISTS shared_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  r2_key TEXT,
  name TEXT NOT NULL,
  prompt TEXT DEFAULT '',
  category TEXT DEFAULT 'inspiration',
  tags TEXT[] DEFAULT '{}',
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shared_library ENABLE ROW LEVEL SECURITY;

-- Policies: everyone can read, only owner can delete
CREATE POLICY "Anyone can view shared library"
  ON shared_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON shared_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON shared_library FOR DELETE
  USING (auth.uid() = user_id);

-- Index for pagination and filtering
CREATE INDEX idx_shared_library_created_at ON shared_library(created_at DESC);
CREATE INDEX idx_shared_library_category ON shared_library(category);
CREATE INDEX idx_shared_library_user_id ON shared_library(user_id);
