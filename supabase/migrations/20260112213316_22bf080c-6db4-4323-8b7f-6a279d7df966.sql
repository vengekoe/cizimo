-- Drop the insecure policies that allow anyone to write
DROP POLICY IF EXISTS "Anyone can delete book images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update book images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload book images" ON storage.objects;

-- Create secure write policies that require authentication and owner verification

-- Allow authenticated users to upload images only to their own folder (user_id/filename pattern)
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);