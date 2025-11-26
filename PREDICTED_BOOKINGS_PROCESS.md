# Complete Process of Predicted Bookings - Step-by-Step Guide

## Overview
The Predicted Bookings feature forecasts how many bookings you'll receive each month in the target year based on historical data patterns and growth trends.

---

## Phase 1: Data Collection & Preparation

### Step 1.1: Set Target Year
```javascript
targetYear = year from query parameter OR current year
// Example: If you're viewing 2025, targetYear = 2025
```

### Step 1.2: Define Date Range
```javascript
FIRST_ANALYTICS_YEAR = 2019
startDate = January 1, 2019
endDate = December 31, (targetYear - 1)

// Example for 2025:
// startDate: 2019-01-01
// endDate: 2024-12-31
// Range: 2019 to 2024 (6 years)
```

### Step 1.3: Query Historical Bookings
```javascript
Query: Get all bookings where:
  - arrival_date >= 2019-01-01
  - arrival_date <= 2024-12-31
  - status IN ('confirmed', 'completed')
```

**What this fetches:**
- All confirmed and completed bookings from 2019-2024
- Only bookings that actually happened (not pending/cancelled)
- Both package_only and tour_only bookings combined

**Result:** Raw array of booking records
```
Example:
[
  { booking_id: "BK001", arrival_date: "2019-01-15", status: "confirmed", number_of_tourist: 4 },
  { booking_id: "BK002", arrival_date: "2020-01-20", status: "completed", number_of_tourist: 2 },
  ...
]
```

### Step 1.4: Calculate Average Revenue Per Booking
```javascript
// Fetch payments for all historical bookings
// Calculate: total_revenue / total_bookings
avgRevenuePerBooking = totalRevenue / historicalBookings.length

// This will be used later to predict revenue
```

---

## Phase 2: Data Organization by Month

### Step 2.1: Initialize Monthly Structure
```javascript
Create structure for 12 months:
monthlyData = {
  0: { // January
    month_number: 1,
    month_name: "January",
    bookings: [],
    total_bookings: 0,
    total_tourists: 0,
    years_data: {}  // Will store data per year
  },
  1: { // February
    ...
  },
  ... (all 12 months)
}
```

### Step 2.2: Group Bookings by Month and Year
```javascript
For each booking:
  1. Extract arrival_date
  2. Get month (0-11) and year (e.g., 2022)
  3. Group into monthlyData[month]
  4. Track by year in years_data[year]

Example for January:
monthlyData[0] = {
  years_data: {
    2019: { bookings: 40, tourists: 120 },
    2020: { bookings: 45, tourists: 135 },
    2021: { bookings: 50, tourists: 150 },
    2022: { bookings: 55, tourists: 165 },
    2023: { bookings: 60, tourists: 180 },
    2024: { bookings: 65, tourists: 195 }
  },
  total_bookings: 315,  // Sum of all years
  total_tourists: 945
}
```

---

## Phase 3: Calculate Historical Average

### Step 3.1: Count Years with Data
```javascript
yearsCount = Object.keys(monthData.years_data).length

// Example:
// years_data has keys: [2019, 2020, 2021, 2022, 2023, 2024]
// yearsCount = 6
```

### Step 3.2: Calculate Average Bookings
```javascript
avgBookings = total_bookings / yearsCount

// Example:
// total_bookings = 315
// yearsCount = 6
// avgBookings = 315 / 6 = 52.5 bookings/month
```

---

## Phase 4: Trend Analysis (Year-over-Year Average Growth)

### Step 4.1: Get All Years with Data
```javascript
years = Object.keys(monthData.years_data).sort()
// Example: [2019, 2020, 2021, 2022, 2023, 2024]
```

### Step 4.2: Calculate Year-over-Year Growth for Each Pair
```javascript
Loop through consecutive year pairs:

For January example:
  Pair 1: 2019 → 2020
    prevBookings = 40
    currBookings = 45
    yoyGrowth = ((45 - 40) / 40) × 100 = 12.5%
    
  Pair 2: 2020 → 2021
    prevBookings = 45
    currBookings = 50
    yoyGrowth = ((50 - 45) / 45) × 100 = 11.1%
    
  Pair 3: 2021 → 2022
    prevBookings = 50
    currBookings = 55
    yoyGrowth = ((55 - 50) / 50) × 100 = 10.0%
    
  Pair 4: 2022 → 2023
    prevBookings = 55
    currBookings = 60
    yoyGrowth = ((60 - 55) / 55) × 100 = 9.1%
    
  Pair 5: 2023 → 2024
    prevBookings = 60
    currBookings = 65
    yoyGrowth = ((65 - 60) / 60) × 100 = 8.3%
```

### Step 4.3: Calculate Average Growth Rate
```javascript
totalGrowthRate = 12.5 + 11.1 + 10.0 + 9.1 + 8.3 = 51.0%
yearOverYearChanges = 5 (number of pairs)
growthRate = 51.0 / 5 = 10.2%
```

### Step 4.4: Classify Trend
```javascript
GROWTH_THRESHOLD = 10%

if (growthRate > 10%) {
  trend = 'increasing'
  // Example: 10.2% > 10% → 'increasing' ✓
} else if (growthRate < -10%) {
  trend = 'decreasing'
} else {
  trend = 'stable'
}
```

---

## Phase 5: Generate Prediction

### Step 5.1: Apply Trend Multiplier
```javascript
if (trend === 'increasing') {
  trendMultiplier = 1.1  // +10% boost
} else if (trend === 'decreasing') {
  trendMultiplier = 0.9  // -10% reduction
} else {
  trendMultiplier = 1.0  // No change
}
```

### Step 5.2: Calculate Predicted Bookings
```javascript
predictedBookings = Math.round(avgBookings × trendMultiplier)

// Example:
// avgBookings = 52.5
// trendMultiplier = 1.1 (increasing)
// predictedBookings = Math.round(52.5 × 1.1)
//                   = Math.round(57.75)
//                   = 58 bookings
```

### Step 5.3: Calculate Predicted Revenue
```javascript
predictedRevenue = predictedBookings × avgRevenuePerBooking

// Example:
// predictedBookings = 58
// avgRevenuePerBooking = ₱5,000
// predictedRevenue = 58 × 5000 = ₱290,000
```

---

## Phase 6: Season Classification

### Step 6.1: Calculate Overall Monthly Average
```javascript
// Sum all 12 months' predicted bookings
totalPredictedBookings = sum(predicted_bookings for all months)
avgMonthlyBookings = totalPredictedBookings / 12

// Example:
// If total predicted bookings for year = 624
// avgMonthlyBookings = 624 / 12 = 52 bookings/month
```

### Step 6.2: Set Thresholds
```javascript
peakThreshold = avgMonthlyBookings × 1.25  // 125% of average
lowThreshold = avgMonthlyBookings × 0.75    // 75% of average

// Example:
// avgMonthlyBookings = 52
// peakThreshold = 52 × 1.25 = 65 bookings
// lowThreshold = 52 × 0.75 = 39 bookings
```

### Step 6.3: Classify Each Month
```javascript
For each month:
  if (predicted_bookings >= peakThreshold) {
    season = 'peak'
  } else if (predicted_bookings <= lowThreshold) {
    season = 'low'
  } else {
    season = 'moderate'
  }
```

### Step 6.4: Calculate Percentage of Average
```javascript
percentage_of_average = (predicted_bookings / avgMonthlyBookings) × 100

// Example for January:
// predicted_bookings = 58
// avgMonthlyBookings = 52
// percentage_of_average = (58 / 52) × 100 = 111.5%
```

---

## Complete Example: January 2025 Prediction

### Input Data (Historical):
```
January 2019: 40 bookings
January 2020: 45 bookings
January 2021: 50 bookings
January 2022: 55 bookings
January 2023: 60 bookings
January 2024: 65 bookings
```

### Calculations:

**1. Historical Average:**
```
Total: 40 + 45 + 50 + 55 + 60 + 65 = 315 bookings
Years: 6
Average: 315 ÷ 6 = 52.5 bookings/month
```

**2. Year-over-Year Growth:**
```
2019→2020: +12.5%
2020→2021: +11.1%
2021→2022: +10.0%
2022→2023: +9.1%
2023→2024: +8.3%
─────────────────
Average: 10.2%
```

**3. Trend Classification:**
```
growthRate = 10.2%
Since 10.2% > 10% (GROWTH_THRESHOLD):
  trend = 'increasing' ✓
```

**4. Prediction:**
```
avgBookings = 52.5
trendMultiplier = 1.1 (increasing)
predictedBookings = Math.round(52.5 × 1.1) = 58 bookings
```

**5. Season Classification:**
```
If overall average = 52 bookings/month:
  peakThreshold = 65 bookings
  lowThreshold = 39 bookings
  
Since 58 is between 39 and 65:
  season = 'moderate'
  percentage_of_average = (58 / 52) × 100 = 111.5%
```

---

## Output Structure

For each month, the system returns:
```json
{
  "month_number": 1,
  "month_name": "January",
  "historical_avg_bookings": 53,
  "predicted_bookings": 58,
  "predicted_tourists": 174,
  "predicted_revenue": 290000,
  "trend": "increasing",
  "growth_rate": 10.2,
  "confidence": "high",
  "years_count": 6,
  "total_historical_bookings": 315,
  "years_with_data": [2019, 2020, 2021, 2022, 2023, 2024]
}
```

---

## Key Points

1. **Data Quality**: Only confirmed/completed bookings are used
2. **Multi-Year Analysis**: Uses all available years (2019-2024)
3. **Trend Detection**: Year-over-Year Average Growth considers all consecutive pairs
4. **Predictive Adjustments**: Applies 10% boost/reduction based on trend
5. **Season Classification**: Compares each month to overall average
6. **Per-Month Accuracy**: Each month is calculated independently

---

## Why This Approach?

- **Accurate**: Uses all historical data points
- **Robust**: Less sensitive to single-year anomalies
- **Practical**: Provides actionable predictions for business planning
- **Transparent**: Shows trend, growth rate, and confidence level
