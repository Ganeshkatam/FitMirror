-- Rebuild Search Index to include slug and images
-- Corrects issue where Product Cards have missing links/images

-- 1. Drop dependent functions
DROP FUNCTION IF EXISTS universal_search;
DROP FUNCTION IF EXISTS get_search_suggestions;

-- 2. Drop existing object (Handle all types, Table first allows MatView check to skip if gone)
-- Note: Postgres throws error if dropping MatView on Table even with IF EXISTS.
-- So we must try Table first if we suspect it's a table.
DROP TABLE IF EXISTS search_index CASCADE;
DROP MATERIALIZED VIEW IF EXISTS search_index CASCADE;
DROP VIEW IF EXISTS search_index CASCADE;

-- 3. Recreate Materialized View with ALL needed columns
CREATE MATERIALIZED VIEW search_index AS
SELECT
    p.id AS product_id,
    p.name AS title,
    p.description,
    p.slug,
    p.image,
    p.images,
    mc.name AS category,
    mc.slug AS category_slug,
    p.gender,
    p.color,
    p.brand,
    p.sale_price AS price,
    p.sizes,
    p.tags,
    -- Inventory Logic: TRUE if inventory sum > 0
    COALESCE((
        SELECT SUM(pi.stock) 
        FROM product_inventory pi 
        WHERE pi.product_id = p.id
    ), 0) > 0 AS is_in_stock,
    -- Physics Profile existence check
    (p.physics_profile IS NOT NULL) AS is_tryon_enabled,
    p.rating_avg AS rating,
    p.review_count,
    p.pattern,
    p.occasion,
    p.sleeve_length,
    p.neck_type,
    p.fit,
    p.material,
    p.age_group,
    p.store_id,
    p.created_at,
    -- Boost Score
    (
        (CASE WHEN p.created_at > now() - interval '30 days' THEN 10 ELSE 0 END) +
        (COALESCE(p.rating_avg, 0) * 2)
    ) AS boost_score,
    -- Search Vector (Title A, Brand B, Description C)
    setweight(to_tsvector('english', COALESCE(p.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(p.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(p.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(mc.name, '')), 'C')
    AS search_vector
FROM products p
LEFT JOIN main_categories mc ON mc.slug = p.category -- Link by slug (e.g. 'woman')
WHERE p.is_active = true AND p.is_deleted = false;

-- Indexes
CREATE INDEX idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE UNIQUE INDEX idx_search_index_id ON search_index(product_id);

-- 4. Recreate Universal Search Function (Updated Return Type)
CREATE OR REPLACE FUNCTION public.universal_search(
    search_query TEXT DEFAULT NULL,
    filter_categories TEXT[] DEFAULT NULL,
    filter_category TEXT DEFAULT NULL,
    filter_genders TEXT[] DEFAULT NULL,
    filter_colors TEXT[] DEFAULT NULL,
    filter_sizes TEXT[] DEFAULT NULL,
    filter_brands TEXT[] DEFAULT NULL,
    filter_patterns TEXT[] DEFAULT NULL,
    filter_occasions TEXT[] DEFAULT NULL,
    filter_sleeves TEXT[] DEFAULT NULL,
    filter_necks TEXT[] DEFAULT NULL,
    filter_fits TEXT[] DEFAULT NULL,
    filter_materials TEXT[] DEFAULT NULL,
    filter_rating NUMERIC DEFAULT NULL,
    filter_in_stock BOOLEAN DEFAULT NULL,
    filter_age_groups TEXT[] DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL,
    sort_by TEXT DEFAULT NULL,
    page_size INT DEFAULT 20,
    page_offset INT DEFAULT 0
)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    description TEXT,
    slug TEXT,           -- Added
    image TEXT,          -- Added
    images TEXT[],       -- Added
    category TEXT,
    category_slug TEXT,
    gender TEXT,
    color TEXT,
    brand TEXT,
    price NUMERIC,
    sizes TEXT[],
    tags TEXT[],
    is_in_stock BOOLEAN,
    is_tryon_enabled BOOLEAN,
    rating NUMERIC,
    review_count INT,
    pattern TEXT,
    occasion TEXT,
    sleeve_length TEXT,
    neck_type TEXT,
    fit TEXT,
    material TEXT,
    age_group TEXT,
    store_id UUID,
    created_at TIMESTAMPTZ,
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.product_id,
        si.title,
        si.description,
        si.slug,
        si.image,
        si.images,
        si.category,
        si.category_slug,
        si.gender,
        si.color,
        si.brand,
        si.price,
        si.sizes,
        si.tags,
        si.is_in_stock,
        si.is_tryon_enabled,
        si.rating,
        si.review_count,
        si.pattern,
        si.occasion,
        si.sleeve_length,
        si.neck_type,
        si.fit,
        si.material,
        si.age_group,
        si.store_id,
        si.created_at,
        CASE
            WHEN search_query IS NOT NULL AND search_query != '' THEN
                ts_rank(si.search_vector, plainto_tsquery('english', search_query))
            ELSE 0
        END::REAL AS rank
    FROM search_index si
    WHERE
        -- Text search
        (search_query IS NULL OR search_query = '' OR si.search_vector @@ plainto_tsquery('english', search_query))
        -- Category filter (array)
        AND (filter_categories IS NULL OR si.category_slug = ANY(filter_categories))
        -- Category filter (single)
        AND (filter_category IS NULL OR si.category = filter_category OR si.category_slug = filter_category)
        -- Gender
        AND (filter_genders IS NULL OR si.gender = ANY(filter_genders))
        -- Color
        AND (filter_colors IS NULL OR si.color = ANY(filter_colors))
        -- Sizes (overlap)
        AND (filter_sizes IS NULL OR si.sizes && filter_sizes)
        -- Brand
        AND (filter_brands IS NULL OR si.brand = ANY(filter_brands))
        -- Pattern
        AND (filter_patterns IS NULL OR si.pattern = ANY(filter_patterns))
        -- Occasion
        AND (filter_occasions IS NULL OR si.occasion = ANY(filter_occasions))
        -- Sleeve
        AND (filter_sleeves IS NULL OR si.sleeve_length = ANY(filter_sleeves))
        -- Neck
        AND (filter_necks IS NULL OR si.neck_type = ANY(filter_necks))
        -- Fit
        AND (filter_fits IS NULL OR si.fit = ANY(filter_fits))
        -- Material
        AND (filter_materials IS NULL OR si.material = ANY(filter_materials))
        -- Rating
        AND (filter_rating IS NULL OR si.rating >= filter_rating)
        -- In stock
        AND (filter_in_stock IS NULL OR si.is_in_stock = filter_in_stock)
        -- Age group
        AND (filter_age_groups IS NULL OR si.age_group = ANY(filter_age_groups))
        -- Price range
        AND (min_price IS NULL OR si.price >= min_price)
        AND (max_price IS NULL OR si.price <= max_price)
    ORDER BY
        CASE WHEN sort_by = 'price_asc' THEN si.price END ASC NULLS LAST,
        CASE WHEN sort_by = 'price_desc' THEN si.price END DESC NULLS LAST,
        CASE WHEN sort_by = 'rating' THEN si.rating END DESC NULLS LAST,
        CASE WHEN sort_by = 'newest' THEN si.created_at END DESC NULLS LAST,
        CASE
            WHEN search_query IS NOT NULL AND search_query != '' THEN
                ts_rank(si.search_vector, plainto_tsquery('english', search_query))
            ELSE si.boost_score::REAL
        END DESC,
        si.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$;

-- 5. Recreate Search Suggestions Function
CREATE OR REPLACE FUNCTION public.get_search_suggestions(
    search_query TEXT,
    limit_count INT DEFAULT 6
)
RETURNS TABLE (
    suggestion TEXT,
    category TEXT,
    product_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        si.title AS suggestion,
        si.category,
        1::BIGINT AS product_count
    FROM search_index si
    WHERE
        si.search_vector @@ plainto_tsquery('english', search_query)
        OR si.title ILIKE '%' || search_query || '%'
    ORDER BY suggestion
    LIMIT limit_count;
END;
$$;
