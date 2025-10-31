# Van Rental Booking Debug Guide

## Problem
Van rental data is not being stored in the database when completing a booking.

## Changes Made
Added comprehensive logging throughout the booking flow to identify where the issue occurs.

## How to Test

### 1. Start the Server
Make sure your Express server is running:
```bash
cd my-express-web
node server.js
```

### 2. Open the Booking Form
1. Open your browser and go to the booking form
2. **Open Developer Console** (Press F12)
3. Go to the **Console** tab

### 3. Complete the Booking Process

#### Step 1: Fill Personal Information
- Fill in all required fields (name, email, contact, dates)
- Click "Next"

#### Step 2: Select Services including Van Rental
1. Select a package (if desired)
2. Select vehicles (if desired)
3. **IMPORTANT: Select Van Rental**
   - Choose "Destination" (Within or Outside Puerto Galera)
   - Select a "Place"
   - Select "Trip Type" (One Way or Round Trip)
   - Select "Number of Days"
4. Verify that "Van Rental Amount" shows a price
5. Click "Next"

#### Step 3: Review Summary
- Check if van rental information appears in the summary
- Click "Proceed to Payment"

#### Step 4: Submit Booking
- Fill payment information
- Click "Submit Booking"

### 4. Check Console Logs

#### In Browser Console, look for these logs:

**When page loads:**
```
✅ Loaded booking data: {...}
🚐 Van Rental Info: {
  vanDestination: "Within Puerto Galera",
  vanPlace: "Sabang Beach",
  vanTripType: "oneway",
  vanDays: "2",
  vanAmount: "₱4,000.00"
}
```

**When submitting booking:**
```
🎯 Starting booking submission...
📋 Full booking data: {...}
🚐 Checking van rental data: {...}
🔍 Looking up destination ID for: "Sabang Beach"
📡 Fetching van destinations from API...
📥 API response: {success: true, destinations: [...]}
🔎 Searching for destination: "Sabang Beach"
📍 Destination ID found: 5
📦 Sending van rental payload: {
  booking_id: "25-0001",
  destination_id: 5,
  rental_days: 2,
  total_price: 4000
}
```

**Successful submission:**
```
✅ Van rental booking created successfully: {...}
```

#### In Terminal (Server Logs), look for:

```
📝 Van rental booking request received
📦 Request body: {booking_id: "25-0001", destination_id: 5, ...}
📤 Inserting to database: {...}
✅ Van rental booking created successfully: {...}
```

### 5. Common Issues & Solutions

#### Issue 1: Van data is undefined/empty
**Console shows:**
```
ℹ️ Van rental not selected - skipping
```

**Solution:**
- The van rental data is not being saved to sessionStorage
- Check that you selected all van rental fields (destination, place, trip type, days)
- Verify that "Van Rental Amount" shows a price before proceeding

#### Issue 2: Destination ID not found
**Console shows:**
```
❌ Van destination not found: "Some Place Name"
💡 Available destination names: [...]
```

**Solution:**
- The place name in your form doesn't match the database
- Check the `van_destinations` table in Supabase
- The place name must match exactly (case-insensitive)

#### Issue 3: API call fails
**Console shows:**
```
❌ Van rental booking failed: ...
```

**Solution:**
- Check the terminal/server logs for detailed error
- Common issues:
  - RLS policies blocking insert (run the RLS fix SQL)
  - Missing `van_destination_id` in database
  - Foreign key constraint violation

#### Issue 4: Database error
**Server logs show:**
```
❌ Database error: {...}
```

**Solution:**
- Check error code and details
- If RLS error, run the RLS policies SQL fix
- If foreign key error, verify `van_destinations` table has the destination
- If column error, verify `bookings_van_rental` table structure

## Quick SQL Fix for RLS

If you see RLS errors, run this in Supabase SQL Editor:

```sql
-- Allow public insert on bookings_van_rental
DROP POLICY IF EXISTS "Allow public insert on bookings_van_rental" ON bookings_van_rental;
CREATE POLICY "Allow public insert on bookings_van_rental"
ON bookings_van_rental FOR INSERT
TO public
WITH CHECK (true);

-- Allow public select on bookings_van_rental
DROP POLICY IF EXISTS "Allow public select on bookings_van_rental" ON bookings_van_rental;
CREATE POLICY "Allow public select on bookings_van_rental"
ON bookings_van_rental FOR SELECT
TO public
USING (true);
```

## Verify Database Table Structure

Run this in Supabase SQL Editor to check the table:

```sql
-- Check bookings_van_rental structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings_van_rental' 
ORDER BY ordinal_position;

-- Check if van_destinations table exists and has data
SELECT * FROM van_destinations ORDER BY destination_name;

-- Check recent van rental bookings
SELECT * FROM bookings_van_rental ORDER BY created_at DESC LIMIT 5;
```

## Expected Table Structure

`bookings_van_rental` should have these columns:
- `id` (serial, primary key)
- `booking_id` (varchar)
- `van_destination_id` (integer, foreign key to van_destinations)
- `number_of_days` (integer)
- `total_amount` (numeric)
- `trip_type` (varchar)
- `choose_destination` (varchar)
- `created_at` (timestamp)

## Need More Help?

1. Copy all console logs (browser and terminal)
2. Run the verification SQL queries above
3. Share the results to identify the exact issue
