-- Library images table for storing user-uploaded images
CREATE TABLE IF NOT EXISTS library_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE library_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own library images"
  ON library_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own library images"
  ON library_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library images"
  ON library_images FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for library uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('library-uploads', 'library-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow authenticated users to upload
CREATE POLICY "Authenticated users can upload library images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'library-uploads');

-- Storage policy: allow public read access
CREATE POLICY "Public read access for library uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'library-uploads');

-- Storage policy: allow users to delete their own uploads
CREATE POLICY "Users can delete their own library uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'library-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
