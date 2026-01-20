/*
  # Create Storage Bucket for Photos

  1. Storage Setup
    - Create public 'photos' bucket for user uploads
    - Add RLS policies for photo access
    - Allow authenticated users to upload to their own folders
    - Make photos publicly viewable

  2. Security
    - Users can only upload to their own folder
    - All photos are publicly readable
    - Users can delete their own photos
*/

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - Users can upload own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
);

-- Storage policies - Users can view own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
);

-- Storage policies - Users can delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public photos are viewable by anyone (including anonymous users)
CREATE POLICY "Public photos are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');