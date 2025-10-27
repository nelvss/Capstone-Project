-- Test query to check if payments exist in the database
-- Run this in Supabase SQL Editor

-- Check if any payments exist
SELECT 
    payment_id,
    booking_id,
    payment_method,
    total_booking_amount,
    paid_amount,
    remaining_balance,
    receipt_image_url,
    payment_option,
    payment_date
FROM payments 
ORDER BY payment_date DESC 
LIMIT 10;

-- Check receipt image URLs
SELECT 
    payment_id,
    booking_id,
    CASE 
        WHEN receipt_image_url IS NULL OR receipt_image_url = '' THEN 'No receipt'
        WHEN receipt_image_url LIKE 'blob:%' THEN 'Local blob URL (invalid)'
        ELSE 'Valid URL'
    END as receipt_status,
    receipt_image_url
FROM payments 
ORDER BY payment_date DESC;

