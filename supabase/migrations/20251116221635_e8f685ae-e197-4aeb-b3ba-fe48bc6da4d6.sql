-- Create storage bucket for book images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for book images bucket
CREATE POLICY "Anyone can view book images"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-images');

CREATE POLICY "Anyone can upload book images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-images');

CREATE POLICY "Anyone can update book images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'book-images');

CREATE POLICY "Anyone can delete book images"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-images');