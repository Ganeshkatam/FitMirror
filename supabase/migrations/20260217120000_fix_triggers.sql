-- Remove legacy triggers that treat search_index as a Table
-- And add a proper Refresh Trigger for the Materialized View

-- 1. Drop the bad trigger and function (from fixes/002)
DROP TRIGGER IF EXISTS update_search_index_on_change ON public.products;
DROP FUNCTION IF EXISTS public.update_search_index_row();

-- 2. Create/Update the Refresh Function
CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh the view safely
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- Fallback/Log if concurrent fails (e.g. first run)
    REFRESH MATERIALIZED VIEW search_index;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Good Trigger (Refresh on change)
DROP TRIGGER IF EXISTS refresh_search_index_on_product_click ON public.products; -- Cleanup
DROP TRIGGER IF EXISTS refresh_search_index_on_product_change ON public.products;

CREATE TRIGGER refresh_search_index_on_product_change
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH STATEMENT -- Execute once per transaction/batch (Better for seeding)
EXECUTE FUNCTION public.refresh_search_index();
