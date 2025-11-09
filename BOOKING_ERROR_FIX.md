# Booking Creation Error - Fix Guide

## Error Description
When trying to create a booking, you're getting this error:
```
"Could not find the 'package_only_id' column of 'bookings' in the schema cache"
```

**Status Code:** 500 Internal Server Error

## Root Cause
The `bookings` table in your Supabase database is missing the `package_only_id` column that the backend API is trying to use when creating a booking.

## How to Fix

### Option 1: Quick Fix via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to "SQL Editor"

2. **Run the Fix Script**
   - Open the file `FIX_BOOKINGS_TABLE.sql` (in your project root)
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

3. **Verify the Fix**
   - The script includes verification queries
   - Check the results to confirm the column was added

### Option 2: Manual Fix

Run this single SQL command in Supabase SQL Editor:

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS package_only_id UUID;
```

## What the Fix Does

1. **Adds the missing column**: `package_only_id` (UUID type)
2. **Creates foreign key**: Links to `package_only` table
3. **Adds index**: Improves query performance
4. **Documents the column**: Adds helpful comment

## After Applying the Fix

1. **Test the booking creation**:
   - Go to your booking form
   - Fill in all required fields
   - Submit the booking
   - It should now work without errors!

2. **Expected successful response**:
   ```json
   {
     "success": true,
     "message": "Booking created successfully",
     "booking": {
       "booking_id": "25-XXXXXX",
       "customer_first_name": "...",
       "package_only_id": "...",
       ...
     }
   }
   ```

## Complete Bookings Table Schema

After the fix, your `bookings` table should have these columns:

- `booking_id` (VARCHAR) - Primary key
- `customer_first_name` (VARCHAR)
- `customer_last_name` (VARCHAR)
- `customer_email` (VARCHAR)
- `customer_contact` (VARCHAR)
- `booking_type` (VARCHAR) - 'package_only' or 'tour_only'
- `booking_preferences` (TEXT)
- `arrival_date` (DATE)
- `departure_date` (DATE)
- `number_of_tourist` (INTEGER)
- `hotel_id` (UUID) - Foreign key to hotels
- `hotel_nights` (INTEGER)
- **`package_only_id` (UUID)** - ⭐ THIS WAS MISSING
- `status` (VARCHAR) - 'pending', 'confirmed', 'cancelled', etc.
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Why This Error Occurred

The backend controller (`bookingController.js`) is trying to insert `package_only_id` into the bookings table (line ~72):

```javascript
const optionalFields = {};
if (package_only_id) optionalFields.package_only_id = package_only_id;
```

But the database table doesn't have this column, causing Supabase to reject the insert operation.

## Prevention

To avoid similar issues in the future:

1. **Keep database schema in sync** with your backend API
2. **Test all database operations** after schema changes
3. **Use migrations** to track database changes
4. **Document required columns** for each table

## Need Help?

If you still see errors after applying this fix:

1. Check the Supabase SQL Editor output for any error messages
2. Verify the column exists: Run `SELECT * FROM bookings LIMIT 1;`
3. Check if there are any column name mismatches (case sensitivity)
4. Review the `package_only` table to ensure `package_only_id` column exists there too

## Related Files

- `FIX_BOOKINGS_TABLE.sql` - The SQL fix script
- `my-express-web/controllers/bookingController.js` - Backend controller
- `user/package/package_summary.js` - Frontend booking submission
- `database_setup.sql` - Original database setup (needs update)
