-- =====================================================
-- FIX BOOKINGS TABLE - Add missing package_only_id column
-- =====================================================
-- Execute this in your Supabase SQL Editor to fix the booking creation error
-- Error: "Could not find the 'package_only_id' column of 'bookings' in the schema cache"

-- Step 1: Add package_only_id column to bookings table
-- This column stores the reference to the package selected in "Package Only" bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS package_only_id UUID;

-- Step 2: Add foreign key constraint (recommended for data integrity)
-- This ensures package_only_id references a valid package in the package_only table
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_package_only_id 
FOREIGN KEY (package_only_id) 
REFERENCES package_only(package_only_id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 3: Add index for better query performance
-- This improves lookup speed when filtering bookings by package
CREATE INDEX IF NOT EXISTS idx_bookings_package_only_id ON bookings(package_only_id);

-- Step 4: Add comment to document the column purpose
COMMENT ON COLUMN bookings.package_only_id IS 'Foreign key reference to package_only table for package bookings';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'package_only_id';

-- Check all columns in bookings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Verify foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'bookings'
    AND kcu.column_name = 'package_only_id';

-- =====================================================
-- FIX COMPLETE
-- =====================================================
-- After running this script:
-- 1. The bookings table will have the package_only_id column
-- 2. Foreign key constraint ensures data integrity
-- 3. Index improves query performance
-- 4. Try creating a booking again - it should work!
-- =====================================================
