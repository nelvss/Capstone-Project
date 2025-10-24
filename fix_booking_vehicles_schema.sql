-- Fix booking_vehicles table to accept custom booking IDs
-- The booking_id column in booking_vehicles should match the bookings table format

-- Step 1: Check current column type
-- You can run this to see the current structure:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'booking_vehicles' AND column_name = 'booking_id';

-- Step 2: Change booking_id column from UUID to VARCHAR to match bookings table
ALTER TABLE booking_vehicles ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 3: Ensure it's not null
ALTER TABLE booking_vehicles ALTER COLUMN booking_id SET NOT NULL;

-- Note: Now the booking_vehicles table can accept custom booking IDs like "25-034"
-- that match the format used in the main bookings table
