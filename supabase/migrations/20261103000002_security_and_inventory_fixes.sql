-- Migration: Security Containment and Inventory Transactional Fixes
-- Description: Restricts insecure marketing views, hardens webhook RLS, enforces positive decrement_stock, provides atomic cancel_order RPC, and adds critical foreign key indexes.

-- 1. Containment: Drop insecure security-definer view exposing auth.users
DROP VIEW IF EXISTS public.marketing_segments;

-- 2. Payment Webhook Events: Enable RLS and add explicit service_role access policy
ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'payment_webhook_events' 
          AND policyname = 'Service role manages webhook events'
    ) THEN
        CREATE POLICY "Service role manages webhook events"
            ON public.payment_webhook_events
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 3. Stock Validation: Fix decrement_stock to reject negative/zero quantities and fix search_path
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

-- 5. Atomic Order Cancellation RPC: Ensures cancellation and stock restoration succeed together
CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT 'User cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    -- 1. Fetch order and lock row to prevent race conditions
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or unauthorized';
    END IF;

    IF v_order.status NOT IN ('pending', 'placed', 'processing') THEN
        RAISE EXCEPTION 'Order cannot be cancelled in state %', v_order.status;
    END IF;

    -- 2. Update order status atomically
    UPDATE public.orders
    SET status = 'cancelled',
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 3. Restore inventory for all items in a single transaction
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
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- 6. Analytics tables RLS enforcement
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'analytics') THEN
        EXECUTE 'ALTER TABLE IF EXISTS analytics.seller_daily_metrics ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE IF EXISTS analytics.product_performance ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- 7. High-priority foreign key supporting indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON public.product_inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events (event_id);
