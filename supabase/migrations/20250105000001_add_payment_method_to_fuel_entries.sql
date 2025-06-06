-- Add payment_method column to fuel_entries table
ALTER TABLE fuel_entries ADD COLUMN payment_method TEXT DEFAULT 'Credit Card';

-- Update existing records to have a default payment method
UPDATE fuel_entries SET payment_method = 'Credit Card' WHERE payment_method IS NULL;