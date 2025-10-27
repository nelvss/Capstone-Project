-- Fix Supabase Storage RLS policies for receipts bucket
-- Run this in Supabase SQL Editor

-- First, check current policies
SELECT * FROM storage.buckets WHERE name = 'receipts';

-- Option 1: Make bucket fully public (no RLS)
-- This allows anyone to upload and view receipts
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE name = 'receipts';

-- Option 2: Add policies to allow authenticated uploads
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Create policy for INSERT (upload)
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'receipts');

-- Create policy for SELECT (view/download)
CREATE POLICY "Allow public view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Create policy for DELETE (optional, for cleanup)
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'receipts');

-- Verify changes
SELECT 
    id, 
    name, 
    public, 
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'receipts';

-- Check policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%receipts%';

