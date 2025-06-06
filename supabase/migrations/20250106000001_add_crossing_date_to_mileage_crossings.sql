-- Add crossing_date column to driver_mileage_crossings table
-- This allows users to manually specify the date when they crossed state lines

ALTER TABLE driver_mileage_crossings 
ADD COLUMN crossing_date DATE;

-- Set default values for existing records using the timestamp date
UPDATE driver_mileage_crossings 
SET crossing_date = DATE(timestamp) 
WHERE crossing_date IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE driver_mileage_crossings 
ALTER COLUMN crossing_date SET NOT NULL;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN driver_mileage_crossings.crossing_date IS 'Date when the driver crossed into this state (user-specified)';

-- Add an index for performance when querying by crossing date
CREATE INDEX idx_driver_mileage_crossings_crossing_date ON driver_mileage_crossings(crossing_date);