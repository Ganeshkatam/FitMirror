-- Phase 6: Platform Foundation
-- Reintroduces support for Sellers and Admins with a streamlined architectural footprint.

-- 1. Create Admins Domain
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_profile_id ON public.admins(profile_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON public.admins(status);

-- 2. Create Sellers Domain
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_profile_id ON public.sellers(profile_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers(status);

-- 3. Explicit Relationship: Seller -> Store
-- Adds seller_id back to stores. Products, orders, and inventory will natively resolve
-- seller ownership through their store_id relationship, rather than duplicating seller_id.
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON public.stores(seller_id);

-- 4. Clean RLS Policies for Platform Foundation

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Admins can read other admins
CREATE POLICY "Admins can read admins" ON public.admins
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.profile_id = auth.uid() AND a.status = 'active')
);

-- Admins can manage all sellers
CREATE POLICY "Admins can manage sellers" ON public.sellers
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.profile_id = auth.uid() AND a.status = 'active')
);

-- Sellers can read their own profile
CREATE POLICY "Sellers can read own profile" ON public.sellers
FOR SELECT USING (auth.uid() = profile_id);

-- Sellers can update their own profile
CREATE POLICY "Sellers can update own profile" ON public.sellers
FOR UPDATE USING (auth.uid() = profile_id);

-- Sellers can manage their own stores
CREATE POLICY "Sellers can manage own stores" ON public.stores
FOR ALL USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);
