-- Add status column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '2e hands';

-- Update existing products to have status '2e hands' if NULL
UPDATE products SET status = '2e hands' WHERE status IS NULL; 