-- Fix broken images for specific products
-- 1. Men's Heavy Cotton Tee (Black) - Replace dead image with valid one
UPDATE "public"."products"
SET "image" = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format',
    "images" = ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format']
WHERE "slug" = 'heavy-cotton-tee';

-- 2. Men's Slim Fit Jeans - Replace dead image
UPDATE "public"."products"
SET "image" = 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format',
    "images" = ARRAY['https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format']
WHERE "slug" = 'slim-fit-jeans';

-- 3. Men's Bomber Jacket - Replace dead image
UPDATE "public"."products"
SET "image" = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format',
    "images" = ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format']
WHERE "slug" = 'nylon-bomber-jacket';

-- 4. Men's Trench Coat - Replace dead image
UPDATE "public"."products"
SET "image" = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format',
    "images" = ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format']
WHERE "slug" = 'classic-trench-coat';

-- 5. Women's Denim Jacket - Replace dead image
UPDATE "public"."products"
SET "image" = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format',
    "images" = ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format']
WHERE "slug" = 'womens-denim-jacket';

-- 6. Categories - Replace potentially dead images
UPDATE "public"."main_categories"
SET "image_url" = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format'
WHERE "slug" = 'woman'; -- Verify if dead, if so use: https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=800&auto=format

UPDATE "public"."main_categories"
SET "image_url" = 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format'
WHERE "slug" = 'man'; -- Verify if dead, if so use: https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format

UPDATE "public"."main_categories"
SET "image_url" = 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format'
WHERE "slug" = 'kids'; -- Verify if dead, if so use: https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format

