-- Migration: Security Containment, Atomic Order Cancellation, and Webhook Lifecycle Fixes
-- Description: Enforces auth.uid() authorization on cancellation, verifies inventory rows on restock, sets refund_pending on paid cancellations, hardens webhook RLS against client roles, fixes mutable function search paths, and secures analytics reporting.

-- 1. Containment: Drop insecure security-definer view exposing auth.users
DROP VIEW IF EXISTS public.marketing_segments;

-- 2. Payment Webhook Events: Schema enhancements, strict RLS, and explicit service_role grants
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Block all client-side roles completely from viewing or inserting webhook events
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.payment_webhook_events TO service_role;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role manages webhook events" ON public.payment_webhook_events;
    CREATE POLICY "Service role manages webhook events"
        ON public.payment_webhook_events
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- 3. Stock Validation: Fix decrement_stock to require strictly positive quantity and enforce fixed search_path
CREATE OR REPLACE FUNCTION public.decrement_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'decrement_stock quantity must be strictly positive (got %)', p_quantity;
    END IF;

    UPDATE public.product_inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id
      AND size = p_size
      AND quantity >= p_quantity;

    RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, TEXT, INT) TO authenticated, service_role;

-- 4. Dedicated Stock Restoration RPC with positive validation and safe search_path
CREATE OR REPLACE FUNCTION public.restore_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'restore_stock quantity must be strictly positive (got %)', p_quantity;
    END IF;

    UPDATE public.product_inventory
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id
      AND size = p_size;

    RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_stock(UUID, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_stock(UUID, TEXT, INT) TO authenticated, service_role;

-- 5. Atomic Order Cancellation RPC
-- Binds authorization to auth.uid() inside database (no trusted client user_id)
-- Locks order row FOR UPDATE
-- Sets refund_pending for paid orders
-- Verifies inventory rows exist and rolls back completely if any inventory row is missing
CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID,
    p_reason TEXT DEFAULT 'User cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_is_service_role BOOLEAN;
    v_order RECORD;
    v_item RECORD;
    v_updated_rows INT;
BEGIN
    -- 1. Identify and authenticate caller inside database
    v_caller_id := auth.uid();
    v_is_service_role := (current_setting('request.jwt.claim.role', true) = 'service_role');

    IF v_caller_id IS NULL AND NOT v_is_service_role THEN
        RAISE EXCEPTION 'Unauthorized: authenticated session required';
    END IF;

    -- 2. Fetch order with exclusive row lock to prevent concurrent modifications
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 3. Verify ownership: regular users can only cancel their own orders
    IF NOT v_is_service_role AND v_order.user_id <> v_caller_id THEN
        RAISE EXCEPTION 'Forbidden: order does not belong to authenticated user';
    END IF;

    -- 4. Verify order is in a cancellable status
    IF v_order.status NOT IN ('pending', 'placed', 'processing') THEN
        RAISE EXCEPTION 'Order cannot be cancelled in status %', v_order.status;
    END IF;

    -- 5. Update order status and track refund obligation for paid orders
    UPDATE public.orders
    SET status = 'cancelled',
        payment_status = CASE 
            WHEN v_order.is_paid = true OR v_order.payment_status = 'captured' THEN 'refund_pending'
            ELSE v_order.payment_status
        END,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 6. Restore inventory for all items; fail atomically if any inventory row is missing
    FOR v_item IN
        SELECT product_id, size, quantity
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        IF v_item.quantity > 0 THEN
            UPDATE public.product_inventory
            SET quantity = quantity + v_item.quantity,
                updated_at = NOW()
            WHERE product_id = v_item.product_id
              AND size = v_item.size;

            GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
            IF v_updated_rows = 0 THEN
                RAISE EXCEPTION 'Inventory row missing for product % and size %', v_item.product_id, v_item.size;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'refund_required', (v_order.is_paid = true OR v_order.payment_status = 'captured')
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) TO authenticated, service_role;

-- 6. Analytics tables RLS enforcement and server-side reporting grants
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'analytics') THEN
        EXECUTE 'ALTER TABLE IF EXISTS analytics.seller_daily_metrics ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE IF EXISTS analytics.product_performance ENABLE ROW LEVEL SECURITY';
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA analytics FROM anon, authenticated, PUBLIC';
        EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA analytics TO service_role';
        EXECUTE 'DROP POLICY IF EXISTS "Service role manages seller metrics" ON analytics.seller_daily_metrics';
        EXECUTE 'CREATE POLICY "Service role manages seller metrics" ON analytics.seller_daily_metrics FOR ALL TO service_role USING (true) WITH CHECK (true)';
        EXECUTE 'DROP POLICY IF EXISTS "Service role manages product performance" ON analytics.product_performance';
        EXECUTE 'CREATE POLICY "Service role manages product performance" ON analytics.product_performance FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- 7. High-priority foreign key supporting indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON public.product_inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events (event_id);
