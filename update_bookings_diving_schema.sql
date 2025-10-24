-- Add booking_type column to bookings_diving table
-- This tracks whether the diving experience came from "Package Only" or "Tour Only" booking flow

-- Step 1: Add the booking_type column
ALTER TABLE bookings_diving 
ADD COLUMN booking_type VARCHAR(20) NOT NULL DEFAULT 'package_only';

-- Step 2: Add CHECK constraint to ensure only valid values
ALTER TABLE bookings_diving 
ADD CONSTRAINT check_booking_type 
CHECK (booking_type IN ('package_only', 'tour_only'));

-- Step 3: Add comment to document the column purpose
COMMENT ON COLUMN bookings_diving.booking_type IS 'Indicates whether this diving booking came from Package Only or Tour Only booking flow';

-- Step 4: Optional - Update existing records if any exist
-- This will set all existing records to 'package_only' as the default
-- UPDATE bookings_diving SET booking_type = 'package_only' WHERE booking_type IS NULL;

-- Note: The column is now ready to accept 'package_only' or 'tour_only' values
-- The application will send this value when creating new diving bookings
