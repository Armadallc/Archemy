-- Add address fields to service_areas table
-- Migration: 0010_add_service_area_address_fields.sql

-- Add address columns to service_areas table
ALTER TABLE service_areas ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE service_areas ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE service_areas ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE service_areas ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Update existing service areas with address data
UPDATE service_areas SET
  street_address = '5241 Lowell Blvd',
  city = 'Denver',
  state = 'CO',
  zip_code = '80221',
  full_address = '5241 Lowell Blvd, Denver, CO 80221'
WHERE nickname = 'Newton' AND organization_id = 'monarch_competency';

-- Add more service areas for Monarch Launch
INSERT INTO service_areas (id, organization_id, nickname, description, street_address, city, state, zip_code, full_address, is_active)
VALUES (
  gen_random_uuid(),
  'monarch_launch',
  'Dakota Launch Center',
  'Career launch and training facility - Dakota location',
  '6581 E. Dakota Ave.',
  'Denver',
  'CO',
  '80224',
  '6581 E. Dakota Ave. Denver, CO 80224',
  true
);
