# Seasonal Prediction Feature Guide

## Overview
The Seasonal Prediction feature analyzes historical booking data to forecast peak and low seasons for the upcoming year. It uses statistical analysis to predict monthly booking patterns, helping business owners plan resources and marketing strategies.

## How It Works

### Data Collection
The system analyzes historical booking data from the past 2 years (configurable) to identify seasonal patterns:
- **Confirmed bookings** only (status: 'confirmed' or 'completed')
- Monthly aggregation of bookings, tourist counts, and revenue
- Multi-year trend analysis for accuracy

### Prediction Algorithm
1. **Historical Averaging**: Calculates average bookings per month across past years
2. **Trend Analysis**: Identifies growth patterns (increasing, stable, or decreasing)
3. **Forecast Application**: Applies trend multipliers to generate predictions
4. **Season Classification**: Categorizes months based on predicted activity levels

### Season Classification
Months are classified into three categories based on predicted bookings:

- **🔴 Peak Season**: 125%+ of average monthly bookings
- **🟡 Moderate Season**: 75-125% of average monthly bookings  
- **🔵 Low Season**: Below 75% of average monthly bookings

## API Endpoint

### GET `/api/analytics/seasonal-prediction`

**Query Parameters:**
- `year` (optional): Target year for prediction (default: current year)
- `lookback_years` (optional): Number of past years to analyze (default: 2, max: 5)

**Example Request:**
```javascript
fetch('https://api.otgpuertogaleratravel.com/api/analytics/seasonal-prediction?year=2025&lookback_years=2')
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2025-11-14T10:30:00.000Z",
    "target_year": 2025,
    "lookback_years": 2,
    "historical_data_points": 1247,
    "has_sufficient_data": true,
    "average_monthly_bookings": 104,
    "peak_threshold": 130,
    "low_threshold": 78,
    "months": [
      {
        "month_number": 1,
        "month_name": "January",
        "historical_avg_bookings": 145,
        "predicted_bookings": 160,
        "predicted_tourists": 520,
        "predicted_revenue": 285000,
        "trend": "increasing",
        "growth_rate": 12.5,
        "confidence": "high"
      }
      // ... more months
    ],
    "peak_months": [
      {
        "month": "December",
        "month_number": 12,
        "predicted_bookings": 201,
        "predicted_tourists": 680,
        "predicted_revenue": 385000,
        "trend": "increasing",
        "season": "peak",
        "percentage_of_average": 193.3
      }
      // ... more peak months
    ],
    "low_months": [
      {
        "month": "June",
        "month_number": 6,
        "predicted_bookings": 54,
        "predicted_tourists": 180,
        "predicted_revenue": 95000,
        "trend": "stable",
        "season": "low",
        "percentage_of_average": 51.9
      }
      // ... more low months
    ],
    "moderate_months": [ /* ... */ ],
    "summary": {
      "peak_season": "December, January, February, March, April",
      "low_season": "May, June, July, August",
      "total_predicted_bookings": 1247,
      "total_predicted_revenue": 2400000
    }
  }
}
```

## Visualization

### Chart Display
The seasonal prediction is displayed as a **bar chart** with:
- **Color-coded bars** showing predicted bookings by month
  - Red: Peak season
  - Yellow: Moderate season
  - Blue: Low season
- **Line overlay** showing predicted revenue trend
- **Dual Y-axes** for bookings and revenue

### Status Information
Below the chart, three indicator boxes show:
1. Peak Season criteria (125%+ of average)
2. Moderate Season criteria (75-125% of average)
3. Low Season criteria (below 75% of average)

## Business Benefits

### Resource Planning
- **Staff Scheduling**: Hire seasonal staff during peak months
- **Inventory Management**: Stock up supplies for high-demand periods
- **Equipment Maintenance**: Schedule during low season

### Marketing Strategy
- **Promotional Campaigns**: Target low season with special offers
- **Pricing Strategy**: Implement dynamic pricing based on demand
- **Early Bird Discounts**: Encourage bookings during off-peak months

### Financial Planning
- **Cash Flow Management**: Prepare for revenue fluctuations
- **Budget Allocation**: Plan marketing spend based on season
- **Investment Timing**: Schedule major expenses during low season

## Data Requirements

### Minimum Requirements
- At least **30 confirmed bookings** in the historical period
- Data spanning at least **6 months** for basic predictions
- Recommended: **2+ years** of data for accurate forecasts

### Best Practices
- Regularly update booking statuses to 'confirmed' or 'completed'
- Maintain accurate arrival dates and booking amounts
- Ensure consistent data entry across all booking types

## Accuracy Factors

### Confidence Levels
- **High Confidence**: 2+ years of historical data
- **Medium Confidence**: 1-2 years of historical data
- **Low Confidence**: Less than 1 year of data

### Variables Affecting Accuracy
- Economic conditions
- Weather patterns
- Marketing campaigns
- Competition changes
- External events (holidays, festivals)

## Integration with Other Features

### Dashboard Overview
- Seasonal predictions inform the overview metrics
- Trend indicators reflect predicted patterns

### Daily Demand Prediction
- Works alongside service-specific forecasts
- Provides macro-level seasonal context

### Recommendations
- AI-powered recommendations consider seasonal patterns
- Suggests strategies for each season type

## Troubleshooting

### "Insufficient historical data" Message
**Solution**: Add more confirmed bookings to your database or reduce `lookback_years`

### Predictions Seem Inaccurate
**Possible Causes**:
- Irregular booking patterns
- Recent business changes
- Insufficient historical data
- External factors not captured in data

**Solutions**:
- Wait for more data accumulation
- Adjust lookback period
- Consider manual adjustments based on known factors

### Chart Not Displaying
**Checklist**:
1. Verify API endpoint is accessible
2. Check browser console for errors
3. Ensure historical bookings exist in database
4. Confirm booking statuses are 'confirmed' or 'completed'

## Future Enhancements

### Planned Features
- Custom season thresholds
- Multi-year forecast comparison
- Weather data integration
- Event calendar integration
- Export seasonal report as PDF
- Email alerts for seasonal transitions

### Advanced Analytics
- Service-specific seasonal patterns
- Customer segment analysis by season
- Competitive benchmarking
- ROI tracking for seasonal campaigns

## Example Use Cases

### Case 1: Peak Season Preparation (December - April)
**Scenario**: System predicts 193% of average bookings in December

**Actions**:
1. Hire 3 additional tour guides
2. Increase vehicle inventory by 40%
3. Pre-book hotel partnerships
4. Stock up on diving equipment
5. Launch premium package deals

### Case 2: Low Season Promotion (June - August)
**Scenario**: System predicts 52% of average bookings in June

**Actions**:
1. Introduce 30% off "Summer Escape" packages
2. Partner with local hotels for bundle deals
3. Launch social media campaigns
4. Offer loyalty rewards for repeat customers
5. Schedule equipment maintenance and staff training

### Case 3: Moderate Season Optimization (September - November)
**Scenario**: System predicts 85-110% of average bookings

**Actions**:
1. Maintain standard staffing levels
2. Test new tour offerings
3. Gather customer feedback
4. Prepare for upcoming peak season
5. Optimize operational efficiency

## API Integration Example

```javascript
// Fetch seasonal prediction for 2026
async function loadSeasonalForecast() {
  try {
    const response = await fetch(
      'https://api.otgpuertogaleratravel.com/api/analytics/seasonal-prediction?year=2026&lookback_years=2'
    );
    const result = await response.json();
    
    if (result.success) {
      console.log('Peak Months:', result.data.peak_months);
      console.log('Low Months:', result.data.low_months);
      
      // Use predictions for business planning
      result.data.peak_months.forEach(month => {
        console.log(`${month.month}: Prepare for ${month.predicted_bookings} bookings`);
      });
    }
  } catch (error) {
    console.error('Failed to load seasonal forecast:', error);
  }
}
```

## Support

For questions or issues with the seasonal prediction feature:
- Check the troubleshooting section above
- Review the ANALYTICS_FIX_NOTES.md file
- Verify database contains confirmed booking data
- Ensure API server is running and accessible

---

**Last Updated**: November 14, 2025  
**Feature Version**: 1.0  
**Compatible with**: OTG Travel & Tours Analytics Dashboard v2.0+
