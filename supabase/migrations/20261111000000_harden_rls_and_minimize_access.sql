-- FitMirror production hardening: minimum access, scoped data ownership, and RPC privilege reduction.
-- This migration preserves business data and all commerce tables.

BEGIN;

-- Guest carts are owned by an unguessable HttpOnly session cookie and are accessed only
-- by server actions using the service-role client. Authenticated carts are owned by auth.uid().
ALTER TABLE public.carts ALTER COLUMN user_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS carts_session_id_key
    ON public.carts (session_id)
    WHERE session_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.carts'::regclass
          AND conname = 'carts_exactly_one_owner_check'
    ) THEN
        ALTER TABLE public.carts
            ADD CONSTRAINT carts_exactly_one_owner_check
            CHECK (
                (user_id IS NOT NULL AND session_id IS NULL)
                OR
                (user_id IS NULL AND session_id IS NOT NULL)
            ) NOT VALID;
    END IF;
END
$$;
ALTER TABLE public.carts VALIDATE CONSTRAINT carts_exactly_one_owner_check;

ALTER TABLE public.cart_items ALTER COLUMN variant_id DROP NOT NULL;

DROP POLICY IF EXISTS "Public view cart" ON public.carts;
DROP POLICY IF EXISTS "Public insert cart" ON public.carts;
DROP POLICY IF EXISTS "Public update cart" ON public.carts;
DROP POLICY IF EXISTS "Public delete cart" ON public.carts;
DROP POLICY IF EXISTS "Users manage own carts" ON public.carts;
CREATE POLICY "Authenticated users access own carts"
    ON public.carts FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public view cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Public insert cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Public update cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Public delete cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Authenticated users access own cart items" ON public.cart_items;
CREATE POLICY "Authenticated users access own cart items"
    ON public.cart_items FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.id = cart_items.cart_id
              AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.id = cart_items.cart_id
              AND c.user_id = (SELECT auth.uid())
        )
    );

REVOKE ALL ON TABLE public.carts, public.cart_items FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.carts, public.cart_items TO authenticated;
GRANT ALL ON TABLE public.carts, public.cart_items TO service_role;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.products FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.categories FROM anon;

-- Public catalog reads must never expose drafts or soft-deleted products.
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "public_view_all_products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
    ON public.products FOR SELECT TO anon, authenticated
    USING (is_active IS TRUE AND is_deleted IS FALSE);

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Sellers can view their own products"
    ON public.products FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.product_offers po
            JOIN public.sellers s ON s.id = po.seller_id
            WHERE po.product_id = products.id
              AND s.profile_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Admins can view all products"
    ON public.products FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.profile_id = (SELECT auth.uid())
              AND a.status = 'active'
        )
    );

-- Review moderation is enforced at the database boundary. Users cannot approve their own reviews.
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

-- Only approved reviews are public. Existing approved-review policy is retained.
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews"
    ON public.reviews FOR SELECT TO anon, authenticated
    USING (is_approved IS TRUE);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert own reviews" ON public.reviews;

-- Category administration requires a real active admin row, not merely an authenticated session.
DROP POLICY IF EXISTS "Staff can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Staff can read all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.profile_id = (SELECT auth.uid())
              AND a.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.profile_id = (SELECT auth.uid())
              AND a.status = 'active'
        )
    );

-- Digital wardrobe remains a supported customer feature; remove the mistakenly public service-role policy.
REVOKE ALL ON TABLE public.user_closet_items FROM PUBLIC, anon;
DROP POLICY IF EXISTS "Service role manages closet" ON public.user_closet_items;
DROP POLICY IF EXISTS "Users can manage own closet" ON public.user_closet_items;
CREATE POLICY "Users can manage own closet"
    ON public.user_closet_items FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- System diagnostics are private operational data. The application logger writes with service_role only.
DROP POLICY IF EXISTS "Enable delete for authenticated" ON public.system_errors;
DROP POLICY IF EXISTS "Enable insert for all" ON public.system_errors;
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.system_errors;
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.system_errors;
REVOKE ALL ON TABLE public.system_errors FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_errors TO service_role;

-- SECURITY DEFINER functions are not public RPC endpoints by default.
-- Revoke both inherited PUBLIC access and explicit legacy anon grants.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.universal_search(text, text[], text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], numeric, boolean, text[], numeric, numeric, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_suggestions(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_stats() TO anon, authenticated;

-- RPCs with caller-controlled identity or no caller authorization are disabled until replaced
-- by authenticated, ownership-checked implementations. No active application RPC call sites were found.
REVOKE EXECUTE ON FUNCTION public.check_requires_approval(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.end_admin_session(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_mode(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_activity(uuid, text, text, uuid, text, jsonb, jsonb, text, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_search_index(boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_pending_change(uuid, uuid, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_admin_session(uuid, text, text, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_change_for_approval(uuid, text, text, text, text, uuid, text, text, jsonb, jsonb, text, text, text, boolean, timestamptz) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.toggle_platform_setting(text, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_activity(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_mode(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_platform_setting(text, text, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_super_admin_login(uuid, text, text) FROM anon, authenticated;

-- Wrap legacy identity-parameter RPCs with auth.uid() binding. Internal functions are not API-callable.
ALTER FUNCTION public.create_order_snapshot(uuid, uuid, uuid, uuid, uuid, jsonb, text, jsonb)
    RENAME TO create_order_snapshot_internal;
REVOKE ALL ON FUNCTION public.create_order_snapshot_internal(uuid, uuid, uuid, uuid, uuid, jsonb, text, jsonb) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.create_order_snapshot(
    p_idempotency_key uuid,
    p_user_id uuid,
    p_coupon_id uuid,
    p_shipping_method_id uuid,
    p_address_id uuid,
    p_shipping_address jsonb,
    p_payment_method text,
    p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Unauthorized order owner' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN public.create_order_snapshot_internal(
        p_idempotency_key, p_user_id, p_coupon_id, p_shipping_method_id,
        p_address_id, p_shipping_address, p_payment_method, p_lines
    );
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_snapshot(uuid, uuid, uuid, uuid, uuid, jsonb, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_snapshot(uuid, uuid, uuid, uuid, uuid, jsonb, text, jsonb) TO authenticated;

ALTER FUNCTION public.get_loyalty_info(uuid) RENAME TO get_loyalty_info_internal;
REVOKE ALL ON FUNCTION public.get_loyalty_info_internal(uuid) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.get_loyalty_info(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Unauthorized loyalty profile access' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN public.get_loyalty_info_internal(p_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.get_loyalty_info(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_loyalty_info(uuid) TO authenticated;

ALTER FUNCTION public.redeem_loyalty_points(uuid, integer) RENAME TO redeem_loyalty_points_internal;
REVOKE ALL ON FUNCTION public.redeem_loyalty_points_internal(uuid, integer) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.redeem_loyalty_points(p_user_id uuid, p_points integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Unauthorized loyalty redemption' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_points IS NULL OR p_points < 100 OR p_points > 1000000 THEN
        RAISE EXCEPTION 'Invalid points amount' USING ERRCODE = 'check_violation';
    END IF;

    PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'no_data_found';
    END IF;

    RETURN public.redeem_loyalty_points_internal(p_user_id, p_points);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_loyalty_points(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer) TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

COMMIT;
