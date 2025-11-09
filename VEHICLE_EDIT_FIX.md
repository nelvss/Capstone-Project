# Vehicle Edit Modal Fix - Duplicate Vehicle Issue

## Problem Description
When editing a booking in the dashboard and changing the vehicle selection (e.g., from NMAX to another vehicle), the old vehicle was not being replaced. Instead, the new vehicle was being added, causing duplicate NMAX entries to appear in the rental column.

## Root Cause
In the `collectBookingFormData()` function in `dashboard.js`, when collecting vehicle data from the edit modal, the code was collecting **both**:
1. `vehicle_id` - The actual vehicle ID from the readonly field
2. `vehicle_name` - The text content from the dropdown select field

The issue occurred because:
- When you selected a vehicle from the dropdown, both `vehicle_id` and `vehicle_name` were being sent to the backend
- The condition to include a vehicle in the payload was: `if (vehicle.vehicle_id || vehicle.vehicle_name || ...)`
- This meant that as long as either field had a value, the vehicle would be included
- This could potentially cause issues where old data wasn't properly overridden

## Solution
Modified the `collectBookingFormData()` function to:

1. **Only collect `vehicle_id`** from the vehicle rows (removed `vehicle_name` from collection)
2. **Changed the filter condition** to only include vehicles that have a valid `vehicle_id`

### Code Changes
**File:** `owner/dashboard.js`

**Before:**
```javascript
vehicleRows.forEach(row => {
  const vehicle = {
    vehicle_id: emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_id'))),
    vehicle_name: emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_name'))),
    rental_days: parseIntegerField(getRepeatableFieldValue(row, 'rental_days')),
    total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
  };

  if (vehicle.vehicle_id || vehicle.vehicle_name || vehicle.rental_days !== null || vehicle.total_amount !== null) {
    payload.vehicles.push(vehicle);
  }
});
```

**After:**
```javascript
vehicleRows.forEach(row => {
  const vehicleId = emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_id')));
  
  // Only include vehicle if vehicle_id is present
  if (vehicleId) {
    const vehicle = {
      vehicle_id: vehicleId,
      rental_days: parseIntegerField(getRepeatableFieldValue(row, 'rental_days')),
      total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
    };
    payload.vehicles.push(vehicle);
  }
});
```

## How It Works Now

1. **User opens Edit Modal** - Existing vehicle data is loaded with the correct `vehicle_id` set in both the readonly field and the dropdown
2. **User changes vehicle** - The dropdown change event updates the `vehicle_id` readonly field with the new vehicle's ID
3. **User saves changes** - Only the `vehicle_id` is collected and sent to the backend
4. **Backend processes update**:
   - Deletes all existing vehicle bookings for that booking_id
   - Inserts new vehicle bookings based on the submitted data
5. **Result** - Only the newly selected vehicle is stored, no duplicates

## Backend Behavior
The backend (`bookingController.js`) correctly handles the update:
1. First, it **deletes all existing vehicle bookings** for the booking (line 743-753)
2. Then, it **inserts only the new vehicle bookings** from the request (line 755-778)
3. This ensures a clean replacement with no duplicates

## Testing Recommendations
1. Edit an existing booking with a vehicle (e.g., NMAX)
2. Change the vehicle to a different one (e.g., CAR)
3. Save the changes
4. Verify that only the new vehicle (CAR) appears in the rental column
5. Verify that the old vehicle (NMAX) is completely removed

## Related Files
- `owner/dashboard.js` - Frontend logic for edit modal
- `owner/dashboard.html` - Edit modal HTML structure
- `my-express-web/controllers/bookingController.js` - Backend update logic

## Date Fixed
November 9, 2025
