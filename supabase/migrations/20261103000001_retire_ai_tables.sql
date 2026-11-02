-- Migration: Retire AI Tables, Sessions, and Vectors
-- Description: Drops tables and columns exclusively used by the retired Copilot, AI Chat, and Style Vector systems.

-- 1. Drop Copilot and AI tables in reverse dependency order
DROP TABLE IF EXISTS public.copilot_messages CASCADE;
DROP TABLE IF EXISTS public.copilot_sessions CASCADE;
DROP TABLE IF EXISTS public.user_style_profiles CASCADE;

-- 2. Drop AI vector columns from profiles if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS style_vector;
