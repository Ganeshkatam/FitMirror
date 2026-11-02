-- Migration: Retire AI Tables, Sessions, and Vectors
-- Description: Drops tables and columns exclusively used by the retired Copilot, AI Chat, and Style Vector systems safely without CASCADE.

-- 1. Drop Copilot messages before session headers
DROP TABLE IF EXISTS public.copilot_messages;
DROP TABLE IF EXISTS public.copilot_sessions;
DROP TABLE IF EXISTS public.user_style_profiles;

-- 2. Drop AI vector columns from profiles if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS style_vector;
