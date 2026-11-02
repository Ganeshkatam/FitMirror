-- Migration: Retire Virtual Try-On Tables and Columns
-- Description: Drops tables and columns exclusively used by the retired Virtual Try-On feature.

-- 1. Drop Try-On specific tables in reverse dependency order
DROP TABLE IF EXISTS public.tryon_audit_logs CASCADE;
DROP TABLE IF EXISTS public.tryon_events CASCADE;
DROP TABLE IF EXISTS public.tryon_results CASCADE;
DROP TABLE IF EXISTS public.tryon_sessions CASCADE;

-- 2. Drop Try-On specific columns from products if they exist
ALTER TABLE public.products DROP COLUMN IF EXISTS tryon_asset_ref;
ALTER TABLE public.products DROP COLUMN IF EXISTS tryon_enabled;
ALTER TABLE public.products DROP COLUMN IF EXISTS tryon_count;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_tryon_enabled;
ALTER TABLE public.products DROP COLUMN IF EXISTS tryon_config;
ALTER TABLE public.products DROP COLUMN IF EXISTS physics_profile;
