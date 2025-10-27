-- Fix receipt_image_url to allow NULL values
-- Run this in Supabase SQL Editor

ALTER TABLE payments 
ALTER COLUMN receipt_image_url DROP NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'receipt_image_url';

