-- Refresh search_index if it is a materialized view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'search_index') THEN
        REFRESH MATERIALIZED VIEW search_index;
    END IF;
END $$;

-- Optional: Create a function/trigger to keep it updated?
-- Only if we are sure it exists.
-- For now, Manual Refresh to fix the immediate issue.
