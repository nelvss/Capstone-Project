-- Check status distribution by year for bookings
-- This will help identify if 2019-2021 bookings have the correct status

SELECT 
  EXTRACT(YEAR FROM arrival_date) as year,
  status,
  COUNT(*) as count
FROM bookings
WHERE arrival_date >= '2019-01-01'
  AND arrival_date <= '2024-12-31'
GROUP BY EXTRACT(YEAR FROM arrival_date), status
ORDER BY year, status;

-- Check if 2019-2021 have confirmed/completed bookings
SELECT 
  EXTRACT(YEAR FROM arrival_date) as year,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status IN ('confirmed', 'completed') THEN 1 END) as confirmed_or_completed,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM bookings
WHERE arrival_date >= '2019-01-01'
  AND arrival_date <= '2024-12-31'
GROUP BY EXTRACT(YEAR FROM arrival_date)
ORDER BY year;
