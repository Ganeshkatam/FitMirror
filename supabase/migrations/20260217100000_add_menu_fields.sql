-- Add visual configuration fields to main_categories
ALTER TABLE main_categories 
ADD COLUMN IF NOT EXISTS featured_discount_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add grouping for Mega Menu
ALTER TABLE sub_categories
ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Other';

-- Updates to allow creating the "Myntra Structure"
-- We will seed this via a script/RPC or manually for now.
