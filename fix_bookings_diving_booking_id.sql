-- Fix bookings_diving table to accept custom booking IDs
-- The booking_id column in bookings_diving should match the bookings table format

-- Step 1: Check current column type
-- You can run this to see the current structure:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings_diving' AND column_name = 'booking_id';

-- Step 2: Change booking_id column from UUID to VARCHAR to match bookings table
ALTER TABLE bookings_diving ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 3: Ensure it's not null
ALTER TABLE bookings_diving ALTER COLUMN booking_id SET NOT NULL;

-- Note: Now the bookings_diving table can accept custom booking IDs like "25-026"
-- that match the format used in the main bookings table
