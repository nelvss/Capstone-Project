-- =====================================================
-- COMPLETE DATABASE SETUP FOR CAPSTONE PROJECT
-- =====================================================
-- This file consolidates all SQL operations needed to set up the database
-- Execute this file in your Supabase SQL Editor to set up the complete database

-- =====================================================
-- SECTION 1: VEHICLES TABLE SETUP
-- =====================================================

-- Populate vehicles table with the vehicle types used in the frontend
-- This will create the mapping between frontend vehicle names and database records

-- First, clear any existing data to avoid duplicates
DELETE FROM vehicles;

-- Insert vehicles that match the frontend vehicle types exactly
INSERT INTO vehicles (name, price_per_day) VALUES
('ADV', 1000),
('NMAX', 1000),
('VERSYS 650', 2000),
('VERSYS 1000', 2500),
('TUKTUK', 1800),
('CAR', 3000);

-- Verify the data was inserted
SELECT * FROM vehicles ORDER BY name;

-- Check that we have 6 vehicles
SELECT COUNT(*) as vehicle_count FROM vehicles;

-- =====================================================
-- SECTION 2: HOTELS DATA SETUP
-- =====================================================

-- SQL INSERT statements for hotels table
-- Execute these in your Supabase SQL Editor

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Ilaya Resort',
  'Beachfront resort with modern amenities and stunning ocean views. Perfect for families and couples seeking relaxation.',
  2500,
  '["Images/ilaya.jpg", "Images/ilaya2.jpg", "Images/ilaya3.jpg", "Images/ilaya4.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Bliss Beach Resort',
  'Luxury beachfront resort offering premium accommodations with world-class service and breathtaking sunset views.',
  3200,
  '["Images/bliss.jpg", "Images/bliss2.jpg", "Images/bliss3.jpg", "Images/bliss4.jpg", "Images/bliss5.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'The Mangyan Grand Hotel',
  'Elegant hotel featuring spacious rooms, modern facilities, and exceptional hospitality in the heart of Puerto Galera.',
  4500,
  '["Images/the_mangyan_grand_hotel.png"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Mindoro Transient House',
  'Comfortable and affordable accommodation perfect for budget-conscious travelers. Also known as Casa De Honcho.',
  1800,
  '["Images/mangyan.jpg", "Images/mangyan2.jpg", "Images/mangyan3.jpg", "Images/mangyan4.jpg", "Images/mangyan5.jpg", "Images/mangyan6.jpg", "Images/mangyan7.jpg", "Images/mangyan8.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Southview Lodge',
  'Cozy lodge with panoramic views of the surrounding landscape. Ideal for nature lovers and adventure seekers.',
  2200,
  '["Images/southview.jpg", "Images/southview2.jpg", "Images/southview3.jpg", "Images/southview4.jpg", "Images/southview5.jpg", "Images/southview6.jpg"]'::jsonb
);

-- =====================================================
-- SECTION 3: BOOKING SYSTEM SCHEMA FIXES
-- =====================================================

-- Fix booking_id column to remove gen_random_uuid() default
-- This allows the application to provide custom booking IDs like "25-000"

-- Step 1: Remove the default value constraint
ALTER TABLE bookings ALTER COLUMN booking_id DROP DEFAULT;

-- Step 2: If the column is UUID type, change it to VARCHAR to accept custom IDs
-- (Uncomment the line below if your booking_id column is currently UUID type)
-- ALTER TABLE bookings ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 3: Make sure the column can accept custom values
ALTER TABLE bookings ALTER COLUMN booking_id SET NOT NULL;

-- =====================================================
-- SECTION 4: BOOKING VEHICLES TABLE SETUP
-- =====================================================

-- Fix booking_vehicles table to accept custom booking IDs
-- The booking_id column in booking_vehicles should match the bookings table format

-- Step 1: Change booking_id column from UUID to VARCHAR to match bookings table
ALTER TABLE booking_vehicles ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 2: Ensure it's not null
ALTER TABLE booking_vehicles ALTER COLUMN booking_id SET NOT NULL;

-- Add vehicle_id column as foreign key to booking_vehicles table
-- This creates a relationship between booking_vehicles and vehicles tables

-- Step 1: Add the vehicle_id column
ALTER TABLE booking_vehicles 
ADD COLUMN vehicle_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE booking_vehicles 
ADD CONSTRAINT fk_booking_vehicles_vehicle_id 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Add index for better query performance
CREATE INDEX idx_booking_vehicles_vehicle_id ON booking_vehicles(vehicle_id);

-- Step 4: Make vehicle_id column nullable for flexibility
ALTER TABLE booking_vehicles 
ALTER COLUMN vehicle_id DROP NOT NULL;

-- Step 5: Add comment to document the column purpose
COMMENT ON COLUMN booking_vehicles.vehicle_id IS 'Foreign key reference to vehicles table - can be NULL if vehicle not found in database';

-- =====================================================
-- SECTION 5: DIVING BOOKINGS TABLE SETUP
-- =====================================================

-- Fix bookings_diving table to accept custom booking IDs
-- The booking_id column in bookings_diving should match the bookings table format

-- Step 1: Change booking_id column from UUID to VARCHAR to match bookings table
ALTER TABLE bookings_diving ALTER COLUMN booking_id TYPE VARCHAR(50);

-- Step 2: Ensure it's not null
ALTER TABLE bookings_diving ALTER COLUMN booking_id SET NOT NULL;

-- Add booking_type column to bookings_diving table
-- This tracks whether the diving experience came from "Package Only" or "Tour Only" booking flow

-- Step 1: Add the booking_type column
ALTER TABLE bookings_diving 
ADD COLUMN booking_type VARCHAR(20) NOT NULL DEFAULT 'package_only';

-- Step 2: Add CHECK constraint to ensure only valid values
ALTER TABLE bookings_diving 
ADD CONSTRAINT check_booking_type 
CHECK (booking_type IN ('package_only', 'tour_only'));

-- Step 3: Add comment to document the column purpose
COMMENT ON COLUMN bookings_diving.booking_type IS 'Indicates whether this diving booking came from Package Only or Tour Only booking flow';

-- =====================================================
-- SECTION 6: VAN RENTAL BOOKINGS TABLE SETUP
-- =====================================================

-- Update bookings_van_rental table schema to match backend API
-- This script ensures proper foreign key relationships

-- Add foreign key constraint for booking_id (if not already exists)
ALTER TABLE bookings_van_rental 
ADD CONSTRAINT fk_bookings_van_rental_booking_id 
FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint for van_destination_id (if not already exists)
-- Note: Replace 'van_destinations' with the actual table name if different
ALTER TABLE bookings_van_rental 
ADD CONSTRAINT fk_bookings_van_rental_destination_id 
FOREIGN KEY (van_destination_id) REFERENCES van_destinations(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- SECTION 7: VERIFICATION QUERIES
-- =====================================================

-- Verify vehicles table structure and data
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

-- Verify hotels table has data
SELECT COUNT(*) as hotel_count FROM hotels;

-- Verify booking_vehicles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_vehicles' 
ORDER BY ordinal_position;

-- Verify bookings_diving table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings_diving' 
ORDER BY ordinal_position;

-- Verify bookings_van_rental table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings_van_rental' 
ORDER BY ordinal_position;

-- Check foreign key constraints for bookings_van_rental
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'bookings_van_rental';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your database is now ready with:
-- 1. Vehicle data populated
-- 2. Hotel data populated  
-- 3. Proper foreign key relationships
-- 4. Custom booking ID support
-- 5. All necessary constraints and indexes
-- =====================================================
