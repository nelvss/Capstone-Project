-- Update booking_id column to remove gen_random_uuid() default
-- This allows the application to provide custom booking IDs like "25-000"

-- Step 1: Check current column type and constraints
-- You can run this to see the current structure:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings' AND column_name = 'booking_id';

-- Step 2: Remove the default value constraint
ALTER TABLE bookings ALTER COLUMN booking_id DROP DEFAULT;

-- Step 3: If the column is UUID type, change it to VARCHAR to accept custom IDs
-- (Uncomment the line below if your booking_id column is currently UUID type)
-- ALTER TABLE bookings ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 4: Make sure the column can accept custom values
-- (This should already be the case after removing the default)
ALTER TABLE bookings ALTER COLUMN booking_id SET NOT NULL;

-- Note: The booking_id column should now accept custom values
-- The application will generate booking IDs in the format "YY-XXX" (e.g., "25-000")
-- where YY is the current year and XXX is a sequential number

-- Step 5: Test the change by inserting a sample record (optional)
-- INSERT INTO bookings (booking_id, customer_first_name, customer_last_name, customer_email, customer_contact, booking_type, booking_preferences, arrival_date, departure_date, number_of_tourist, status) 
-- VALUES ('25-000', 'Test', 'User', 'test@example.com', '1234567890', 'package_only', 'Package Only: Package 1', '2025-01-01', '2025-01-02', 1, 'pending');
