-- Migration: Finalize VTryOn and AI Retirement
-- Description: Completely removes remaining tryon/AI tables, columns, constraints, and rebuilds search_index without is_tryon_enabled.
-- Idempotent across fresh installs and existing environments.

-- 1. Drop all retired VTryOn and AI tables
DROP TABLE IF EXISTS public.copilot_messages CASCADE;
DROP TABLE IF EXISTS public.copilot_sessions CASCADE;
DROP TABLE IF EXISTS public.user_style_profiles CASCADE;
DROP TABLE IF EXISTS public.tryon_audit_logs CASCADE;
DROP TABLE IF EXISTS public.tryon_events CASCADE;
DROP TABLE IF EXISTS public.tryon_results CASCADE;
DROP TABLE IF EXISTS public.tryon_sessions CASCADE;
DROP TABLE IF EXISTS public.garment_assets CASCADE;
DROP TABLE IF EXISTS public.generations CASCADE;
DROP TABLE IF EXISTS public.user_avatars CASCADE;

-- 2. Drop all retired VTryOn and AI columns
ALTER TABLE IF EXISTS public.categories DROP COLUMN IF EXISTS tryon_enabled;
ALTER TABLE IF EXISTS analytics.product_performance DROP COLUMN IF EXISTS tryon_count;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS tryon_asset_ref;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS tryon_enabled;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS tryon_count;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS is_tryon_enabled;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS tryon_config;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS physics_profile;
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS style_vector;

-- 3. Update ar_assets check constraint to eliminate tryon_config
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ar_assets'
    ) THEN
        ALTER TABLE public.ar_assets DROP CONSTRAINT IF EXISTS ar_assets_asset_type_check;
        ALTER TABLE public.ar_assets ADD CONSTRAINT ar_assets_asset_type_check 
            CHECK (asset_type = ANY (ARRAY['3d_model'::text, 'texture'::text]));
    END IF;
END $$;

-- 4. Rebuild search_index materialized view without is_tryon_enabled or physics_profile
-- Drop dependent functions first to prevent dependency deadlocks
DROP FUNCTION IF EXISTS public.universal_search;
DROP FUNCTION IF EXISTS public.get_search_suggestions;
DROP TRIGGER IF EXISTS refresh_search_index_on_product_change ON public.products;
DROP FUNCTION IF EXISTS public.refresh_search_index();

DROP TABLE IF EXISTS public.search_index CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.search_index CASCADE;
DROP VIEW IF EXISTS public.search_index CASCADE;

CREATE MATERIALIZED VIEW public.search_index AS
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
    COALESCE((
        SELECT SUM(pi.stock) 
        FROM product_inventory pi 
        WHERE pi.product_id = p.id
    ), 0) > 0 AS is_in_stock,
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
    (
        (CASE WHEN p.created_at > now() - interval '30 days' THEN 10 ELSE 0 END) +
        (COALESCE(p.rating_avg, 0) * 2)
    ) AS boost_score,
    setweight(to_tsvector('english', COALESCE(p.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(p.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(p.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(mc.name, '')), 'C')
    AS search_vector
FROM products p
LEFT JOIN main_categories mc ON mc.slug = p.category
WHERE p.is_active = true AND p.is_deleted = false;

CREATE UNIQUE INDEX idx_search_index_id ON public.search_index(product_id);
CREATE INDEX idx_search_index_vector ON public.search_index USING GIN(search_vector);

-- 5. Recreate universal_search function without is_tryon_enabled
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
    slug TEXT,
    image TEXT,
    images TEXT[],
    category TEXT,
    category_slug TEXT,
    gender TEXT,
    color TEXT,
    brand TEXT,
    price NUMERIC,
    sizes TEXT[],
    tags TEXT[],
    is_in_stock BOOLEAN,
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
        (search_query IS NULL OR search_query = '' OR si.search_vector @@ plainto_tsquery('english', search_query))
        AND (filter_categories IS NULL OR si.category_slug = ANY(filter_categories))
        AND (filter_category IS NULL OR si.category = filter_category OR si.category_slug = filter_category)
        AND (filter_genders IS NULL OR si.gender = ANY(filter_genders))
        AND (filter_colors IS NULL OR si.color = ANY(filter_colors))
        AND (filter_sizes IS NULL OR si.sizes && filter_sizes)
        AND (filter_brands IS NULL OR si.brand = ANY(filter_brands))
        AND (filter_patterns IS NULL OR si.pattern = ANY(filter_patterns))
        AND (filter_occasions IS NULL OR si.occasion = ANY(filter_occasions))
        AND (filter_sleeves IS NULL OR si.sleeve_length = ANY(filter_sleeves))
        AND (filter_necks IS NULL OR si.neck_type = ANY(filter_necks))
        AND (filter_fits IS NULL OR si.fit = ANY(filter_fits))
        AND (filter_materials IS NULL OR si.material = ANY(filter_materials))
        AND (filter_rating IS NULL OR si.rating >= filter_rating)
        AND (filter_in_stock IS NULL OR si.is_in_stock = filter_in_stock)
        AND (filter_age_groups IS NULL OR si.age_group = ANY(filter_age_groups))
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

-- 6. Recreate get_search_suggestions function
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

-- 7. Recreate refresh_search_index function and trigger
CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_index;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW public.search_index;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_search_index_on_product_change
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_search_index();
