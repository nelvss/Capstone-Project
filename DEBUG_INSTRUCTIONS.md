# Debug Instructions - Why 2019-2021 Bookings Aren't Showing

## Issue:
- You have confirmed bookings from 2019-2021 in Supabase
- But seasonal prediction only shows 3 years of data (likely 2022-2024)
- Still showing 52 bookings instead of expected ~93

## Steps to Diagnose:

### 1. Restart Your Server
**IMPORTANT**: After code changes, you MUST restart your Express server for changes to take effect!

### 2. Call the Seasonal Prediction API
Make a request to:
```
GET /api/analytics/seasonal-prediction?year=2025
```

### 3. Check Server Console Logs

You should see logs like this:

```
📅 Seasonal Prediction Date Range: {
  FIRST_ANALYTICS_YEAR: 2019,
  targetYear: 2025,
  startDate: '2019-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.000Z',
  dateRange: '2019-01-01 to 2024-12-31'
}

📊 Historical Bookings Fetched: {
  totalBookings: XXX,
  dateRange: '2019 to 2024',
  ...
}

📊 Bookings by Year: {
  2019: XX,
  2020: XX,
  2021: XX,
  2022: XX,
  2023: XX,
  2024: XX
}

📊 January Years After Grouping: {
  yearsFound: [2019, 2020, 2021, 2022, 2023, 2024],
  totalYears: 6,
  breakdown: [...],
  totalBookings: XXX
}

📊 January Calculation Debug: {
  years_with_data: [...],
  yearsCount: X,
  total_bookings: XXX,
  breakdown_by_year: [...]
}
```

### 4. Check API Response

In the response, look at the January month data:
```json
{
  "month_name": "January",
  "predicted_bookings": 52,
  "years_count": 3,  // NEW FIELD - how many years
  "total_historical_bookings": 142,  // NEW FIELD - total bookings
  "years_with_data": [2022, 2023, 2024]  // NEW FIELD - which years
}
```

## What to Look For:

### If 2019-2021 bookings ARE in the query result:
- Check "Bookings by Year" log - do they show 2019, 2020, 2021 with booking counts?
- Check "January Years After Grouping" - are 2019-2021 included?

### If 2019-2021 bookings are NOT in the query result:
Possible causes:
1. **Date format mismatch** - arrival_date might be stored differently
2. **Status mismatch** - bookings might not be 'confirmed' or 'completed'
3. **Arrival date is NULL** - check if arrival_date field is populated
4. **Timezone issues** - dates might be in different timezone

## Quick Test Query:

Run this directly in Supabase SQL Editor to verify:
```sql
SELECT 
  EXTRACT(YEAR FROM arrival_date) as year,
  COUNT(*) as booking_count,
  status
FROM bookings
WHERE arrival_date >= '2019-01-01'
  AND arrival_date <= '2024-12-31'
  AND status IN ('confirmed', 'completed')
GROUP BY EXTRACT(YEAR FROM arrival_date), status
ORDER BY year, status;
```

This will show you:
- How many bookings per year
- Their status
- If dates are in the expected format

## Expected Result After Fix:

If everything works correctly:
- **years_count**: 6 (2019-2024)
- **total_historical_bookings**: ~510 (your calculation)
- **average**: 510 ÷ 6 = 85.1
- **predicted**: 85.1 × 1.1 = 93.6 bookings ✓

Check the logs and share what you find!

