-- =====================================================
-- REMOVE CREATED_AT COLUMNS FROM BOOKINGS AND VAN RENTAL TABLES
-- =====================================================
-- Execute this in your Supabase SQL Editor to remove created_at columns
-- This fixes the error: "column bookings.created_at does not exist"

-- Step 1: Remove created_at column from bookings table
ALTER TABLE bookings 
DROP COLUMN IF EXISTS created_at;

-- Step 2: Remove created_at column from bookings_van_rental table
ALTER TABLE bookings_van_rental 
DROP COLUMN IF EXISTS created_at;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the columns were removed from bookings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Verify the columns were removed from bookings_van_rental table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings_van_rental' 
ORDER BY ordinal_position;

-- =====================================================
-- REMOVAL COMPLETE
-- =====================================================
-- After running this script:
-- 1. The bookings table no longer has created_at column
-- 2. The bookings_van_rental table no longer has created_at column
-- 3. The API errors related to created_at should be resolved
-- =====================================================
