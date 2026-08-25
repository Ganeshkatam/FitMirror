-- Phase 7: Add migration reconciliation metadata to product_media
--
-- NON-DESTRUCTIVE. Adds columns only; does not modify existing rows or drop anything.
--
-- These columns persist the provenance chain required by the deterministic
-- migration contract (Phase 7D/7E specification):
--
--   source_hash:    SHA-256(product_id || ':' || source_position || ':' || source_url)
--                   Unique constraint enforces idempotency across retries.
--
--   source_position: Original array index in products.images.
--                    Distinct from `position` (display order) which can be
--                    reordered independently after migration.
--
--   source_url:     Original URL from products.images before transformation.
--                   Distinct from `url` which will point to Supabase Storage
--                   after migration completes.
--
--   content_type:   Actual MIME type derived from the HTTP response during download.
--                   Not assumed from URL extension.
--
--   migrated_at:    Timestamp of when this specific asset was migrated.
--                   NULL means not yet migrated (pre-existing or manually created).

-- 1. Add migration provenance columns
ALTER TABLE public.product_media
  ADD COLUMN IF NOT EXISTS source_hash TEXT,
  ADD COLUMN IF NOT EXISTS source_position INTEGER,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ;

-- 2. Add unique constraint on source_hash for idempotency
-- Only migrated rows will have a non-null source_hash.
-- The constraint must allow multiple NULLs (PostgreSQL UNIQUE does this by default).
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_source_hash
  ON public.product_media (source_hash)
  WHERE source_hash IS NOT NULL;

-- 3. Add index for provenance queries (find all migrated assets for a product)
CREATE INDEX IF NOT EXISTS idx_product_media_migrated
  ON public.product_media (product_id, source_position)
  WHERE migrated_at IS NOT NULL;
