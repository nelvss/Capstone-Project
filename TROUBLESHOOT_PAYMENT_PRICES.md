# Troubleshooting: Payment Prices Not Showing in Dashboard

## Problem
You added a CSV file containing booking prices to the payments table, but the dashboard is not displaying these prices.

## Root Cause Analysis

The dashboard fetches booking data from the API endpoint `/api/bookings`, which:
1. Queries all bookings from the `bookings` table
2. Fetches payment data from the `payments` table
3. Maps `total_booking_amount` from payments to each booking
4. Returns the combined data

## Possible Issues

### 1. CSV Import Issues
- **Booking ID Mismatch**: The `booking_id` in your CSV must exactly match the `booking_id` in the bookings table
- **Column Name Mismatch**: The CSV column must be named `total_booking_amount` (not `price`, `amount`, etc.)
- **Data Type Issue**: The amount should be a number, not a string with currency symbols

### 2. Data Not Committed to Database
- The CSV import might have failed silently
- Transaction might not have been committed

### 3. Browser Cache
- The dashboard might be showing cached data
- Hard refresh needed (Ctrl+F5 or Cmd+Shift+R)

## Solution Steps

### Step 1: Verify CSV Import
Run this query in your Supabase SQL editor:

```sql
-- Check if payment records exist
SELECT 
    p.booking_id,
    p.total_booking_amount,
    p.payment_date,
    b.customer_first_name,
    b.customer_last_name
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
ORDER BY p.payment_date DESC
LIMIT 20;
```

**Expected Result**: You should see rows with `total_booking_amount` values

### Step 2: Check Booking IDs Match
Run this query to find bookings without payments:

```sql
-- Find bookings without payment records
SELECT 
    b.booking_id,
    b.customer_first_name,
    b.customer_last_name,
    b.arrival_date,
    b.status
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE p.booking_id IS NULL
AND b.status != 'cancelled'
ORDER BY b.arrival_date DESC;
```

**If you see results**: These bookings don't have payment records. You need to add them.

### Step 3: Manually Insert Test Payment
Test if the system works by manually inserting one payment:

```sql
-- Insert a test payment for a specific booking
-- Replace '24-2048' with an actual booking_id from your bookings table
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
    '24-2048',  -- Replace with actual booking_id
    'Cash',
    5000.00,    -- Total amount
    5000.00,    -- Paid amount
    0.00,       -- Remaining balance
    'Full Payment',
    NOW()
)
ON CONFLICT (booking_id) DO UPDATE SET
    total_booking_amount = EXCLUDED.total_booking_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_balance = EXCLUDED.remaining_balance,
    payment_date = EXCLUDED.payment_date;
```

After running this, refresh the dashboard (Ctrl+F5) and check if the price appears.

### Step 4: Bulk Import from CSV (Correct Format)

If you need to import from CSV, use this SQL template:

```sql
-- First, create a temporary table to hold CSV data
CREATE TEMP TABLE temp_payments (
    booking_id TEXT,
    total_booking_amount NUMERIC
);

-- Then, in Supabase dashboard:
-- 1. Go to Table Editor
-- 2. Select temp_payments table
-- 3. Click "Insert" > "Import from CSV"
-- 4. Upload your CSV file (must have columns: booking_id, total_booking_amount)

-- After CSV import, move data to payments table
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
    booking_id,
    'Cash' as payment_method,
    total_booking_amount,
    total_booking_amount as paid_amount,
    0.00 as remaining_balance,
    'Full Payment' as payment_option,
    NOW() as payment_date
FROM temp_payments
ON CONFLICT (booking_id) DO UPDATE SET
    total_booking_amount = EXCLUDED.total_booking_amount,
    paid_amount = EXCLUDED.paid_amount,
    payment_date = EXCLUDED.payment_date;

-- Clean up
DROP TABLE temp_payments;
```

### Step 5: Clear Browser Cache
1. Open the dashboard in your browser
2. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
3. Clear "Cached images and files"
4. Or do a hard refresh: `Ctrl+F5` or `Cmd+Shift+R`

### Step 6: Check API Response
1. Open the dashboard
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Refresh the page
5. Find the request to `/api/bookings`
6. Click on it and view the Response
7. Look for `total_booking_amount` in the response

**Example of what you should see:**
```json
{
  "success": true,
  "bookings": [
    {
      "booking_id": "24-2048",
      "customer_first_name": "Launce",
      "customer_last_name": "Goaks",
      "total_booking_amount": 5000.00,
      ...
    }
  ]
}
```

## Alternative: Use the Payment Form

Instead of CSV import, you can use the built-in "Record Payment" functionality:

1. Go to the Payment page in the owner dashboard
2. Click "Record Payment" button
3. Fill in the form with:
   - Booking ID
   - Payment Method
   - Total Amount
   - Upload receipt (optional)
4. Submit the form

This ensures all data is properly validated and stored.

## CSV File Format Requirements

Your CSV file should look like this:

```csv
booking_id,total_booking_amount
24-2048,5000.00
24-2045,4500.00
24-2046,6000.00
```

**Important:**
- No currency symbols (₱, $, etc.)
- Use decimal notation (5000.00, not "5,000")
- Booking IDs must match exactly (case-sensitive)
- No extra columns unless specified in the SQL

## Still Not Working?

If prices still don't appear after following all steps:

1. **Check Server Logs**: Look at the terminal running the Express server for any errors
2. **Check Supabase Logs**: Go to Supabase Dashboard > Logs to see database errors
3. **Verify API URL**: Make sure the dashboard is connecting to the right API
   ```javascript
   // In dashboard.js, check this line:
   const API_URL = (window.API_URL && window.API_URL.length > 0)
     ? window.API_URL
     : 'https://api.otgpuertogaleratravel.com';
   ```

## Quick Fix Script

If you want to quickly populate all bookings with a default price, run this:

```sql
-- This inserts payment records for all bookings that don't have one
-- Using a default price of 5000.00
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
    5000.00 as total_booking_amount,
    0.00 as paid_amount,
    5000.00 as remaining_balance,
    'Pending Payment' as payment_option,
    NOW() as payment_date
FROM bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.booking_id = b.booking_id
)
AND b.status != 'cancelled';
```

After running this, refresh the dashboard with Ctrl+F5.

## Contact Information
If the issue persists, check:
- Database connection is working
- API server is running
- No CORS errors in browser console
