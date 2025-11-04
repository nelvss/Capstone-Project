-- =====================================================
-- SETTINGS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This file creates the database tables needed for the Settings Management System
-- Execute this file in your Supabase SQL Editor to set up the tables
-- 
-- Tables created:
-- 1. site_content - Stores mission, vision, business info, package descriptions
-- 2. service_pricing - Stores all service prices, descriptions, and features
-- 3. service_images - Stores service images with primary/order management
-- 4. payment_qr_codes - Stores QR code images and payment information

-- =====================================================
-- TABLE 1: site_content
-- =====================================================
-- Stores website content like mission, vision, business info, package descriptions

CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key VARCHAR(100) NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on section_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);

-- Insert default content sections (only mission and vision are used dynamically)
-- Other content (services, packages, hotels, etc.) remains hardcoded in HTML
INSERT INTO site_content (section_key, content) VALUES
  ('mission', 'To provide exceptional travel experiences, promote sustainable tourism practices, and showcase the beauty and culture of Puerto Galera to travelers around the world. It aims to create unforgettable journeys while respecting the local environment and supporting the community.'),
  ('vision', 'To ensure that our clients have memorable experiences and fulfill their dreams and goals through travel. We want our clients to remember their trips with us for a lifetime.')
ON CONFLICT (section_key) DO NOTHING;

-- =====================================================
-- TABLE 2: service_pricing
-- =====================================================
-- Stores all service prices, descriptions, and features

CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type VARCHAR(50) NOT NULL, -- 'hotel', 'vehicle', 'tour', 'package'
  service_name VARCHAR(100) NOT NULL, -- e.g., 'Standard', 'ADV', 'Island Hopping'
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB, -- Array of features as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_type, service_name)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_pricing_service_type ON service_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_service_pricing_service_name ON service_pricing(service_name);

-- =====================================================
-- TABLE 3: service_images
-- =====================================================
-- Stores service images with primary/order management

CREATE TABLE IF NOT EXISTS service_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL, -- e.g., 'Snorkeling Tour', 'Vehicle Rental'
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_images_service_name ON service_images(service_name);
CREATE INDEX IF NOT EXISTS idx_service_images_display_order ON service_images(display_order);
CREATE INDEX IF NOT EXISTS idx_service_images_is_primary ON service_images(is_primary);

-- =====================================================
-- TABLE 4: payment_qr_codes
-- =====================================================
-- Stores QR code images and payment information

CREATE TABLE IF NOT EXISTS payment_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method VARCHAR(50) NOT NULL UNIQUE, -- 'gcash', 'paymaya', 'online_banking'
  qr_code_url TEXT,
  account_name VARCHAR(255),
  account_number VARCHAR(100),
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on payment_method for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_qr_codes_payment_method ON payment_qr_codes(payment_method);

-- Insert default payment methods (empty initially)
INSERT INTO payment_qr_codes (payment_method, account_name, account_number, instructions) VALUES
  ('gcash', '', '', 'Scan the QR code to pay via GCash'),
  ('paymaya', '', '', 'Scan the QR code to pay via PayMaya'),
  ('online_banking', '', '', 'Scan the QR code to pay via Online Banking')
ON CONFLICT (payment_method) DO NOTHING;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMP
-- =====================================================
-- Automatically update updated_at timestamp when records are modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_pricing_updated_at ON service_pricing;
CREATE TRIGGER update_service_pricing_updated_at
  BEFORE UPDATE ON service_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_images_updated_at ON service_images;
CREATE TRIGGER update_service_images_updated_at
  BEFORE UPDATE ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_qr_codes_updated_at ON payment_qr_codes;
CREATE TRIGGER update_payment_qr_codes_updated_at
  BEFORE UPDATE ON payment_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the tables were created successfully

-- SELECT 'site_content' as table_name, COUNT(*) as row_count FROM site_content
-- UNION ALL
-- SELECT 'service_pricing', COUNT(*) FROM service_pricing
-- UNION ALL
-- SELECT 'service_images', COUNT(*) FROM service_images
-- UNION ALL
-- SELECT 'payment_qr_codes', COUNT(*) FROM payment_qr_codes;

