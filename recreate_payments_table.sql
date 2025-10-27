-- =====================================================
-- RECREATE PAYMENTS TABLE
-- =====================================================
-- This script drops the existing payments table and creates a new one with the correct schema

-- Step 1: Drop the existing payments table if it exists (CASCADE removes all related constraints)
DROP TABLE IF EXISTS payments CASCADE;

-- Step 2: Create the payments table with the correct schema
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  total_booking_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL,
  remaining_balance DECIMAL(10, 2) NOT NULL,
  receipt_image_url TEXT,
  payment_option VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint to bookings table
  CONSTRAINT fk_payments_booking_id 
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(booking_id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Step 3: Create indexes for better query performance
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);

-- Step 4: Add comments to document column purposes
COMMENT ON TABLE payments IS 'Stores payment records linked to bookings';
COMMENT ON COLUMN payments.payment_id IS 'Primary key, auto-incrementing payment ID';
COMMENT ON COLUMN payments.booking_id IS 'Foreign key to bookings table';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment (Credit Card, Cash, Bank Transfer, etc.)';
COMMENT ON COLUMN payments.total_booking_amount IS 'Total amount for the booking';
COMMENT ON COLUMN payments.paid_amount IS 'Amount paid in this transaction';
COMMENT ON COLUMN payments.remaining_balance IS 'Remaining balance after payment';
COMMENT ON COLUMN payments.receipt_image_url IS 'URL to uploaded receipt image';
COMMENT ON COLUMN payments.payment_option IS 'Payment type (Full Payment, Partial Payment)';
COMMENT ON COLUMN payments.payment_date IS 'Date and time when payment was recorded';

-- Step 5: Verify the table was created successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Step 6: Verify the foreign key relationship
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
    AND tc.table_name = 'payments'
    AND kcu.column_name = 'booking_id';

-- Refresh PostgREST schema cache (if using Supabase REST API)
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Payments table created successfully!';
  RAISE NOTICE 'Foreign key relationship to bookings table established.';
  RAISE NOTICE 'All indexes and constraints have been added.';
END $$;

