-- =====================================================
-- FIX PAYMENTS TABLE RELATIONSHIP
-- =====================================================
-- Run this SQL to ensure the payments table has the correct foreign key relationship

-- First, check if payments table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
);

-- If payments table exists but relationship is missing, add it:
DO $$ 
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_payments_booking_id'
    ) THEN
        ALTER TABLE payments
        ADD CONSTRAINT fk_payments_booking_id 
        FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint fk_payments_booking_id added';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_payments_booking_id already exists';
    END IF;
END $$;

-- Verify the relationship was created
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

-- Refresh PostgREST schema cache
-- This tells PostgREST to reload the schema information
NOTIFY pgrst, 'reload schema';

