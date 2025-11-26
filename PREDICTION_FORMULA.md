# Mathematical Formula for Predicted Bookings

## Formula for Academic Paper

### Historical Average Bookings per Month

For a given month \( m \) (where \( m \in \{1, 2, ..., 12\} \)), the historical average is calculated as:

\[
\bar{B}_m = \frac{\sum_{y=y_{start}}^{y_{end}} B_{m,y}}{Y_m}
\]

Where:
- \( \bar{B}_m \) = Average bookings for month \( m \)
- \( B_{m,y} \) = Number of bookings in month \( m \) for year \( y \)
- \( y_{start} \) = First year in historical data (2019)
- \( y_{end} \) = Last year before target year
- \( Y_m \) = Number of years with booking data for month \( m \)

---

### Year-over-Year Average Growth Rate

The growth rate for month \( m \) is calculated using the average of consecutive year-over-year changes:

\[
G_m = \frac{1}{Y_m - 1} \sum_{y=y_{start}}^{y_{end}-1} \left( \frac{B_{m,y+1} - B_{m,y}}{B_{m,y}} \times 100 \right)
\]

Where:
- \( G_m \) = Average growth rate (%) for month \( m \)
- \( Y_m - 1 \) = Number of year pairs (consecutive years)

---

### Trend Classification

The trend \( T_m \) is classified based on the growth rate threshold \( \theta \):

\[
T_m = \begin{cases}
\text{increasing} & \text{if } G_m > \theta \\
\text{decreasing} & \text{if } G_m < -\theta \\
\text{stable} & \text{otherwise}
\end{cases}
\]

Where:
- \( \theta \) = Growth threshold (10% by default)

---

### Trend Multiplier

The trend multiplier \( M_m \) is applied based on the trend:

\[
M_m = \begin{cases}
1.1 & \text{if } T_m = \text{increasing} \\
0.9 & \text{if } T_m = \text{decreasing} \\
1.0 & \text{if } T_m = \text{stable}
\end{cases}
\]

---

### Predicted Bookings

The final predicted bookings for month \( m \) in the target year:

\[
\hat{B}_m = \text{round}(\bar{B}_m \times M_m)
\]

Where:
- \( \hat{B}_m \) = Predicted bookings for month \( m \)
- \( \bar{B}_m \) = Historical average bookings for month \( m \)
- \( M_m \) = Trend multiplier for month \( m \)
- \( \text{round}(\cdot) \) = Round to nearest integer

---

## Complete Formula (Single Expression)

\[
\hat{B}_m = \text{round}\left( \frac{\sum_{y=y_{start}}^{y_{end}} B_{m,y}}{Y_m} \times M_m \right)
\]

With trend multiplier:

\[
M_m = \begin{cases}
1.1 & \text{if } \frac{1}{Y_m - 1} \sum_{y=y_{start}}^{y_{end}-1} \left( \frac{B_{m,y+1} - B_{m,y}}{B_{m,y}} \times 100 \right) > 10\% \\
0.9 & \text{if } \frac{1}{Y_m - 1} \sum_{y=y_{start}}^{y_{end}-1} \left( \frac{B_{m,y+1} - B_{m,y}}{B_{m,y}} \times 100 \right) < -10\% \\
1.0 & \text{otherwise}
\end{cases}
\]

---

## Season Classification Formula

### Overall Monthly Average

\[
\bar{B}_{\text{overall}} = \frac{1}{12} \sum_{m=1}^{12} \hat{B}_m
\]

### Season Thresholds

\[
B_{\text{peak}} = \bar{B}_{\text{overall}} \times 1.25
\]

\[
B_{\text{low}} = \bar{B}_{\text{overall}} \times 0.75
\]

### Season Classification

\[
S_m = \begin{cases}
\text{peak} & \text{if } \hat{B}_m \geq B_{\text{peak}} \\
\text{low} & \text{if } \hat{B}_m \leq B_{\text{low}} \\
\text{moderate} & \text{otherwise}
\end{cases}
\]

### Percentage of Average

\[
P_m = \frac{\hat{B}_m}{\bar{B}_{\text{overall}}} \times 100\%
\]

---

## Numerical Example

### Given:
- January bookings: 2019 (40), 2020 (45), 2021 (50), 2022 (55), 2023 (60), 2024 (65)
- \( y_{start} = 2019 \), \( y_{end} = 2024 \), \( Y_m = 6 \)

### Step 1: Calculate Average
\[
\bar{B}_1 = \frac{40 + 45 + 50 + 55 + 60 + 65}{6} = \frac{315}{6} = 52.5
\]

### Step 2: Calculate Growth Rate
\[
G_1 = \frac{1}{5} \left[ \frac{45-40}{40} + \frac{50-45}{45} + \frac{55-50}{50} + \frac{60-55}{55} + \frac{65-60}{60} \right] \times 100
\]

\[
G_1 = \frac{1}{5} (12.5\% + 11.1\% + 10.0\% + 9.1\% + 8.3\%) = 10.2\%
\]

### Step 3: Determine Trend
\[
G_1 = 10.2\% > 10\% \implies T_1 = \text{increasing} \implies M_1 = 1.1
\]

### Step 4: Calculate Prediction
\[
\hat{B}_1 = \text{round}(52.5 \times 1.1) = \text{round}(57.75) = 58 \text{ bookings}
\]

---

## Algorithm Pseudocode

```
FUNCTION predictBookings(month, yearsData, threshold):
    // Step 1: Calculate historical average
    totalBookings = SUM(yearsData[year].bookings for all years)
    yearsCount = COUNT(years with data)
    avgBookings = totalBookings / yearsCount
    
    // Step 2: Calculate year-over-year average growth
    IF yearsCount >= 2:
        totalGrowth = 0
        pairsCount = 0
        FOR each consecutive year pair (y, y+1):
            IF yearsData[y].bookings > 0:
                growth = ((yearsData[y+1].bookings - yearsData[y].bookings) / yearsData[y].bookings) * 100
                totalGrowth = totalGrowth + growth
                pairsCount = pairsCount + 1
        avgGrowthRate = totalGrowth / pairsCount
        
        // Step 3: Classify trend
        IF avgGrowthRate > threshold:
            trend = 'increasing'
            multiplier = 1.1
        ELSE IF avgGrowthRate < -threshold:
            trend = 'decreasing'
            multiplier = 0.9
        ELSE:
            trend = 'stable'
            multiplier = 1.0
    ELSE:
        trend = 'stable'
        multiplier = 1.0
    
    // Step 4: Generate prediction
    predictedBookings = ROUND(avgBookings * multiplier)
    
    RETURN predictedBookings, trend, avgGrowthRate
END FUNCTION
```

---

## Variables and Notation

| Symbol | Description |
|--------|-------------|
| \( m \) | Month index (1-12) |
| \( y \) | Year |
| \( B_{m,y} \) | Bookings in month \( m \), year \( y \) |
| \( \bar{B}_m \) | Average bookings for month \( m \) |
| \( \hat{B}_m \) | Predicted bookings for month \( m \) |
| \( Y_m \) | Number of years with data for month \( m \) |
| \( G_m \) | Average growth rate (%) for month \( m \) |
| \( T_m \) | Trend classification for month \( m \) |
| \( M_m \) | Trend multiplier for month \( m \) |
| \( \theta \) | Growth threshold (10%) |
| \( S_m \) | Season classification for month \( m \) |
| \( P_m \) | Percentage of average for month \( m \) |
| \( y_{start} \) | Starting year (2019) |
| \( y_{end} \) | Ending year before target |

---

## Citation Format

You can reference this formula in your paper as:

> "The predicted bookings for each month are calculated using a year-over-year average growth model that incorporates historical averages and trend analysis. The prediction applies a multiplicative adjustment factor based on the detected growth trend, with increasing trends receiving a 10% boost and decreasing trends receiving a 10% reduction."

---

## For Method Section

**Prediction Model:**

The seasonal booking prediction model employs a two-stage approach:

1. **Historical Averaging Stage**: Computes the mean bookings for each month across all available historical years.

2. **Trend-Adjusted Prediction Stage**: Applies a trend multiplier derived from year-over-year average growth rate analysis to adjust the historical average.

The final prediction formula integrates both components, where the predicted bookings \( \hat{B}_m \) for month \( m \) is the product of the historical average \( \bar{B}_m \) and the trend multiplier \( M_m \), rounded to the nearest integer.
