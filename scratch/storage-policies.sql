-- Supabase Storage RLS Policies for "article-images" bucket
-- Run this in your Supabase SQL Editor to grant proper permissions.

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies for "article-images" to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to article-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to article-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to article-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from article-images" ON storage.objects;

-- 3. Create public read policy
CREATE POLICY "Allow public read access to article-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'article-images');

-- 4. Create authenticated insert (upload) policy
CREATE POLICY "Allow authenticated upload to article-images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

-- 5. Create authenticated update policy
CREATE POLICY "Allow authenticated update to article-images" ON storage.objects
    FOR UPDATE WITH CHECK (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

-- 6. Create authenticated delete policy
CREATE POLICY "Allow authenticated delete from article-images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'article-images' 
        AND auth.role() = 'authenticated'
    );

-- Output confirmation
SELECT 'Storage policies created successfully for bucket "article-images"' as status;
