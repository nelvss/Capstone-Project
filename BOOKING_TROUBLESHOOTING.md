# Booking Submission Troubleshooting Guide

## Issue: "Failed to submit the booking"

### 🔍 **Step 1: Check Database Schema**

The most likely cause is that the database still expects UUID format for `booking_id`. Run these SQL commands in your Supabase SQL editor:

```sql
-- Check current booking_id column structure
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'booking_id';
```

### 🔧 **Step 2: Update Database Schema**

If the column is still UUID type or has a default value, run:

```sql
-- Remove default value constraint
ALTER TABLE bookings ALTER COLUMN booking_id DROP DEFAULT;

-- If column is UUID type, change to VARCHAR
ALTER TABLE bookings ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Ensure it's not null
ALTER TABLE bookings ALTER COLUMN booking_id SET NOT NULL;
```

### 🧪 **Step 3: Test Database Changes**

Test if the database accepts custom booking IDs:

```sql
-- Test insert with custom booking ID
INSERT INTO bookings (booking_id, customer_first_name, customer_last_name, customer_email, customer_contact, booking_type, booking_preferences, arrival_date, departure_date, number_of_tourist, status) 
VALUES ('25-000', 'Test', 'User', 'test@example.com', '1234567890', 'package_only', 'Package Only: Package 1', '2025-01-01', '2025-01-02', 1, 'pending');
```

### 🔍 **Step 4: Check Server Logs**

1. **Start your server**: `cd my-express-web && node server.js`
2. **Try to submit a booking**
3. **Check the console output** for these debug messages:
   - `📝 Creating new booking:`
   - `📝 Booking ID from frontend:`
   - Any error messages

### 🐛 **Step 5: Common Issues & Solutions**

#### Issue 1: "Missing required fields: booking_id"
**Solution**: The frontend is not sending the booking_id. Check that:
- `generateBookingReference()` function is working
- The booking_id is being included in the payload

#### Issue 2: Database constraint violation
**Solution**: The database still has UUID constraints. Run the schema update commands above.

#### Issue 3: "Failed to create booking" with database error
**Solution**: Check the exact error message in server logs. Common issues:
- Column type mismatch (UUID vs VARCHAR)
- Default value constraints
- Foreign key constraints

### 🔄 **Step 6: Verify Frontend Data**

Check browser console for:
1. **Booking payload**: Look for `booking_id` in the payload
2. **API response**: Check if the server returns success
3. **Error messages**: Any JavaScript errors

### 📋 **Step 7: Manual Testing**

Test the API directly with curl:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "25-000",
    "customer_first_name": "Test",
    "customer_last_name": "User", 
    "customer_email": "test@example.com",
    "customer_contact": "1234567890",
    "booking_type": "package_only",
    "booking_preferences": "Package Only: Package 1",
    "arrival_date": "2025-01-01",
    "departure_date": "2025-01-02",
    "number_of_tourist": 1,
    "status": "pending"
  }'
```

### ✅ **Expected Behavior After Fix**

1. **Frontend**: Generates booking ID like "25-000"
2. **Backend**: Accepts and stores the custom booking ID
3. **Database**: Stores booking with custom ID instead of UUID
4. **Response**: Returns success with booking details

### 🆘 **If Still Failing**

1. **Check Supabase logs** in your dashboard
2. **Verify environment variables** (SUPABASE_URL, SUPABASE_KEY)
3. **Test with a simple booking** (minimal data)
4. **Check network tab** in browser for exact error response

---

## Quick Fix Summary

1. Run the database schema update SQL
2. Restart your server
3. Try booking submission again
4. Check server logs for specific error messages
