-- ========================================
-- FIX: Payment Prices Not Showing in Dashboard
-- ========================================
-- This script diagnoses and fixes the issue where CSV-imported
-- payment prices are not displaying in the dashboard.

-- STEP 1: Check Current State
-- ========================================

-- 1.1: Count bookings without payments
SELECT 
    COUNT(*) as bookings_without_payments,
    'These bookings need payment records' as description
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE p.booking_id IS NULL
AND b.status != 'cancelled';

-- 1.2: List bookings without payments (first 10)
SELECT 
    b.booking_id,
    b.customer_first_name || ' ' || b.customer_last_name as customer_name,
    b.arrival_date,
    b.status,
    'NO PAYMENT RECORD' as issue
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE p.booking_id IS NULL
AND b.status != 'cancelled'
ORDER BY b.arrival_date DESC
LIMIT 10;

-- 1.3: Check existing payment records
SELECT 
    p.booking_id,
    p.total_booking_amount,
    p.paid_amount,
    p.remaining_balance,
    p.payment_date,
    b.customer_first_name || ' ' || b.customer_last_name as customer_name
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
ORDER BY p.payment_date DESC
LIMIT 10;

-- 1.4: Check for NULL or zero amounts in payments
SELECT 
    COUNT(*) as payments_with_zero_amount,
    'These payment records have zero or null amounts' as description
FROM payments
WHERE total_booking_amount IS NULL OR total_booking_amount = 0;


-- STEP 2: Fix NULL or Zero Amounts
-- ========================================
-- If you imported CSV but amounts are NULL or 0, this will help identify them

SELECT 
    p.booking_id,
    p.total_booking_amount,
    b.customer_first_name || ' ' || b.customer_last_name as customer_name,
    'Amount is NULL or ZERO - needs update' as issue
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
WHERE p.total_booking_amount IS NULL OR p.total_booking_amount = 0
ORDER BY p.payment_date DESC;


-- STEP 3: Create Payment Records for Bookings Without Them
-- ========================================
-- CAUTION: This will create payment records with 0 amount for all bookings
-- that don't have payment records. You'll need to update the amounts later.

-- Uncomment the lines below to run this insert:

/*
INSERT INTO payments (
    booking_id,
    payment_method,
    total_booking_amount,
    paid_amount,
    remaining_balance,
    payment_option,
    payment_date
)
SELECT 
    b.booking_id,
    'Cash' as payment_method,
    0.00 as total_booking_amount,  -- You need to update these amounts
    0.00 as paid_amount,
    0.00 as remaining_balance,
    'Pending Payment' as payment_option,
    NOW() as payment_date
FROM bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.booking_id = b.booking_id
)
AND b.status != 'cancelled'
RETURNING booking_id, total_booking_amount;
*/


-- STEP 4: Import from CSV - Create Temporary Table
-- ========================================
-- Use this if you have a CSV file with booking_id and amounts

-- 4.1: Create temporary table for CSV import
CREATE TEMP TABLE IF NOT EXISTS temp_payment_import (
    booking_id TEXT PRIMARY KEY,
    total_booking_amount NUMERIC(10,2) NOT NULL
);

-- 4.2: After creating the table above:
-- In Supabase Dashboard:
-- 1. Go to Table Editor
-- 2. Find temp_payment_import table
-- 3. Click Insert > Import from CSV
-- 4. Upload your CSV file with columns: booking_id, total_booking_amount

-- 4.3: After CSV import, run this to check the imported data:
SELECT * FROM temp_payment_import LIMIT 10;

-- 4.4: Validate booking IDs exist
SELECT 
    t.booking_id,
    t.total_booking_amount,
    CASE 
        WHEN b.booking_id IS NULL THEN '❌ BOOKING NOT FOUND'
        ELSE '✅ Valid'
    END as validation_status
FROM temp_payment_import t
LEFT JOIN bookings b ON t.booking_id = b.booking_id;

-- 4.5: Move valid data from temp table to payments table
-- Uncomment to execute:

/*
INSERT INTO payments (
    booking_id,
    payment_method,
    total_booking_amount,
    paid_amount,
    remaining_balance,
    payment_option,
    payment_date
)
SELECT 
    t.booking_id,
    'Cash' as payment_method,
    t.total_booking_amount,
    t.total_booking_amount as paid_amount,  -- Assuming full payment
    0.00 as remaining_balance,              -- Assuming no balance
    'Full Payment' as payment_option,
    NOW() as payment_date
FROM temp_payment_import t
INNER JOIN bookings b ON t.booking_id = b.booking_id  -- Only valid booking IDs
ON CONFLICT (booking_id) DO UPDATE SET
    total_booking_amount = EXCLUDED.total_booking_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_balance = EXCLUDED.remaining_balance,
    payment_date = EXCLUDED.payment_date;
*/

-- 4.6: Clean up temporary table
-- DROP TABLE IF EXISTS temp_payment_import;


-- STEP 5: Manually Update Specific Booking Prices
-- ========================================
-- If you know the specific booking IDs and amounts, update them directly:

-- Example: Update booking 24-2048 with price 5000
/*
INSERT INTO payments (
    booking_id,
    payment_method,
    total_booking_amount,
    paid_amount,
    remaining_balance,
    payment_option,
    payment_date
)
VALUES (
    '24-2048',      -- Replace with actual booking_id
    'Cash',
    5000.00,        -- Total amount
    5000.00,        -- Paid amount
    0.00,           -- Remaining balance
    'Full Payment',
    NOW()
)
ON CONFLICT (booking_id) DO UPDATE SET
    total_booking_amount = EXCLUDED.total_booking_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_balance = EXCLUDED.remaining_balance,
    payment_date = NOW();
*/

-- Copy and modify the above for each booking


-- STEP 6: Verify the Fix
-- ========================================

-- 6.1: Count how many bookings now have payments
SELECT 
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT p.booking_id) as bookings_with_payments,
    COUNT(DISTINCT b.booking_id) - COUNT(DISTINCT p.booking_id) as bookings_without_payments
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.status != 'cancelled';

-- 6.2: Check the amounts are correctly set
SELECT 
    b.booking_id,
    b.customer_first_name || ' ' || b.customer_last_name as customer_name,
    p.total_booking_amount,
    p.payment_date,
    CASE 
        WHEN p.total_booking_amount IS NULL THEN '❌ NO PAYMENT'
        WHEN p.total_booking_amount = 0 THEN '⚠️ ZERO AMOUNT'
        ELSE '✅ HAS AMOUNT'
    END as status
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.status != 'cancelled'
ORDER BY b.arrival_date DESC
LIMIT 20;


-- STEP 7: Test API Response
-- ========================================
-- This simulates what the API returns

SELECT 
    b.booking_id,
    b.customer_first_name,
    b.customer_last_name,
    b.customer_email,
    b.arrival_date,
    b.departure_date,
    b.status,
    b.booking_type,
    b.booking_preferences,
    h.name as hotel_name,
    p.total_booking_amount,
    p.payment_date
FROM bookings b
LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.status = 'confirmed'
ORDER BY b.arrival_date DESC
LIMIT 5;


-- ========================================
-- QUICK FIX: For Testing/Demo
-- ========================================
-- If you just want to see prices show up quickly for testing,
-- uncomment this to set all bookings to 5000.00

/*
INSERT INTO payments (
    booking_id,
    payment_method,
    total_booking_amount,
    paid_amount,
    remaining_balance,
    payment_option,
    payment_date
)
SELECT 
    b.booking_id,
    'Cash',
    5000.00,
    5000.00,
    0.00,
    'Full Payment',
    NOW()
FROM bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.booking_id = b.booking_id
)
AND b.status IN ('pending', 'confirmed')
ON CONFLICT (booking_id) DO UPDATE SET
    total_booking_amount = 5000.00,
    paid_amount = 5000.00,
    remaining_balance = 0.00,
    payment_date = NOW();
*/


-- ========================================
-- NOTES
-- ========================================
-- 1. Always backup your data before running UPDATE/INSERT statements
-- 2. Test queries with LIMIT first before running on all records
-- 3. After running any fix, refresh the dashboard with Ctrl+F5 (hard refresh)
-- 4. Check browser console (F12) for any API errors
-- 5. Check the Network tab to see the actual API response

-- ========================================
-- DEBUGGING TIPS
-- ========================================
-- If prices still don't show:
-- 1. Check that API server is running (npm start)
-- 2. Check API URL in dashboard.js matches your server
-- 3. Clear browser cache completely
-- 4. Check Supabase connection is working
-- 5. Look for errors in browser console and server logs
