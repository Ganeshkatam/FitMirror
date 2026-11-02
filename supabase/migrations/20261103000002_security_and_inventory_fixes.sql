-- Migration: Security Containment, Atomic Webhook Lifecycle, and Inventory Transactional Fixes
-- Description:
-- 1. Drops insecure marketing_segments security-definer view.
-- 2. Adds provider payment/order ID columns and indexes to public.orders.
-- 3. Adds lease, claimant, retry, and diagnostic columns to public.payment_webhook_events with strict service_role RLS.
-- 4. Implements atomic compare-and-swap webhook event claiming (claim_payment_webhook_event).
-- 5. Implements atomic, monotonic captured payment recording (record_captured_payment) with provider order verification.
-- 6. Implements atomic payment status recording (record_payment_status) with monotonic downgrade protection.
-- 7. Implements webhook claim release on transient failures (release_webhook_claim_on_failure).
-- 8. Enforces positive quantities on decrement_stock and restore_stock with fixed search_path.
-- 9. Implements atomic cancel_order RPC with auth.uid() binding, row locking (FOR UPDATE), fail-closed missing inventory checks, and refund_pending state.
-- 10. Defensively applies RLS and service_role grants to analytics schema tables only where each table exists.

-- 1. Containment: Drop insecure security-definer view exposing auth.users
DROP VIEW IF EXISTS public.marketing_segments;

-- 2. Orders Table: Add provider identifier columns and supporting indexes
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders (razorpay_order_id);

-- 3. Payment Webhook Events: Add lease, claimant, retry, and diagnostic columns
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS claimed_by TEXT;
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.payment_webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

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

-- 4. Atomic Compare-and-Swap Webhook Event Claiming RPC
CREATE OR REPLACE FUNCTION public.claim_payment_webhook_event(
    p_event_id TEXT,
    p_event_type TEXT,
    p_claimant_id TEXT,
    p_lease_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_lease_expiry TIMESTAMPTZ;
BEGIN
    v_lease_expiry := v_now + (p_lease_seconds || ' seconds')::INTERVAL;

    -- 1. Lock existing event row FOR UPDATE if it exists
    SELECT * INTO v_existing
    FROM public.payment_webhook_events
    WHERE event_id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Atomic insert with initial lease
        INSERT INTO public.payment_webhook_events (
            event_id,
            event_type,
            status,
            claimed_by,
            claimed_at,
            lease_expires_at,
            created_at,
            updated_at
        ) VALUES (
            p_event_id,
            p_event_type,
            'processing',
            p_claimant_id,
            v_now,
            v_lease_expiry,
            v_now,
            v_now
        );

        RETURN jsonb_build_object(
            'success', true,
            'claimed', true,
            'action', 'new_claim'
        );
    END IF;

    -- 2. If already processed or ignored
    IF v_existing.status IN ('processed', 'ignored') THEN
        RETURN jsonb_build_object(
            'success', true,
            'claimed', false,
            'status', v_existing.status,
            'action', 'already_processed'
        );
    END IF;

    -- 3. If terminal failure
    IF v_existing.status = 'failed_terminal' THEN
        RETURN jsonb_build_object(
            'success', true,
            'claimed', false,
            'status', 'failed_terminal',
            'action', 'terminal_failure'
        );
    END IF;

    -- 4. If currently processing: check if lease is still active
    IF v_existing.status = 'processing' THEN
        IF v_existing.lease_expires_at IS NOT NULL AND v_existing.lease_expires_at > v_now THEN
            RETURN jsonb_build_object(
                'success', true,
                'claimed', false,
                'status', 'processing',
                'action', 'in_flight_locked'
            );
        END IF;
        -- Stale lease expired! Allow CAS reclaim
    END IF;

    -- 5. CAS Reclaim for stale processing or failed_retryable
    UPDATE public.payment_webhook_events
    SET status = 'processing',
        claimed_by = p_claimant_id,
        claimed_at = v_now,
        lease_expires_at = v_lease_expiry,
        retry_count = COALESCE(retry_count, 0) + 1,
        updated_at = v_now
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'claimed', true,
        'action', 'reclaimed'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_payment_webhook_event(TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_payment_webhook_event(TEXT, TEXT, TEXT, INT) TO service_role;

-- 5. Atomic, Monotonic Captured Payment Recording RPC
CREATE OR REPLACE FUNCTION public.record_captured_payment(
    p_order_id UUID,
    p_event_id TEXT,
    p_claimant_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_order_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_webhook RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Verify caller owns active claim lease
    SELECT * INTO v_webhook
    FROM public.payment_webhook_events
    WHERE event_id = p_event_id AND claimed_by = p_claimant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim lease expired or not owned by claimant %', p_claimant_id;
    END IF;

    -- 2. Lock and load authoritative order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        UPDATE public.payment_webhook_events
        SET status = 'failed_terminal',
            error_message = 'Authoritative order not found in database',
            claimed_by = NULL,
            lease_expires_at = NULL,
            updated_at = v_now
        WHERE event_id = p_event_id;

        RETURN jsonb_build_object('success', false, 'error', 'order_not_found', 'terminal', true);
    END IF;

    -- 3. Invariant Validations
    IF p_currency <> 'INR' OR v_order.currency <> 'INR' THEN
        UPDATE public.payment_webhook_events
        SET status = 'failed_terminal',
            error_message = 'Currency violation: expected INR',
            claimed_by = NULL,
            lease_expires_at = NULL,
            updated_at = v_now
        WHERE event_id = p_event_id;

        RETURN jsonb_build_object('success', false, 'error', 'currency_violation', 'terminal', true);
    END IF;

    IF p_amount <> v_order.total_amount THEN
        UPDATE public.payment_webhook_events
        SET status = 'failed_terminal',
            error_message = format('Amount mismatch: provider %s != order %s', p_amount, v_order.total_amount),
            claimed_by = NULL,
            lease_expires_at = NULL,
            updated_at = v_now
        WHERE event_id = p_event_id;

        RETURN jsonb_build_object('success', false, 'error', 'amount_mismatch', 'terminal', true);
    END IF;

    -- 4. Provider Order Identity Verification (if stored, must match)
    IF v_order.razorpay_order_id IS NOT NULL AND p_razorpay_order_id IS NOT NULL 
       AND v_order.razorpay_order_id <> p_razorpay_order_id THEN
        UPDATE public.payment_webhook_events
        SET status = 'failed_terminal',
            error_message = format('Provider order mismatch: order has %s, payment has %s', v_order.razorpay_order_id, p_razorpay_order_id),
            claimed_by = NULL,
            lease_expires_at = NULL,
            updated_at = v_now
        WHERE event_id = p_event_id;

        RETURN jsonb_build_object('success', false, 'error', 'provider_order_mismatch', 'terminal', true);
    END IF;

    -- 5. Monotonic State Transition
    IF v_order.status NOT IN ('placed', 'confirmed', 'processing', 'shipped', 'delivered') THEN
        UPDATE public.orders
        SET status = 'placed'
        WHERE id = p_order_id;
    END IF;

    -- 6. Guarantee paid status, payment_status, and provider identifiers
    UPDATE public.orders
    SET is_paid = true,
        payment_status = 'captured',
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_order_id = COALESCE(v_order.razorpay_order_id, p_razorpay_order_id),
        updated_at = v_now
    WHERE id = p_order_id;

    -- 7. Mark webhook event processed atomically
    UPDATE public.payment_webhook_events
    SET status = 'processed',
        processed_at = v_now,
        claimed_by = NULL,
        lease_expires_at = NULL,
        error_message = NULL,
        updated_at = v_now
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'payment_status', 'captured');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_captured_payment(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_captured_payment(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

-- 6. Atomic Payment Status Recording RPC (Monotonic Protection against Downgrades)
CREATE OR REPLACE FUNCTION public.record_payment_status(
    p_order_id UUID,
    p_event_id TEXT,
    p_claimant_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_order_id TEXT,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Verify claimant lease
    IF NOT EXISTS (
        SELECT 1 FROM public.payment_webhook_events
        WHERE event_id = p_event_id AND claimed_by = p_claimant_id
    ) THEN
        RAISE EXCEPTION 'Claim lease expired or not owned by claimant %', p_claimant_id;
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF FOUND THEN
        -- Provider order validation if present
        IF v_order.razorpay_order_id IS NOT NULL AND p_razorpay_order_id IS NOT NULL 
           AND v_order.razorpay_order_id <> p_razorpay_order_id THEN
            -- Mismatch; ignore order update
            NULL;
        -- Monotonic protection: NEVER downgrade if already captured or paid
        ELSIF NOT v_order.is_paid AND v_order.payment_status <> 'captured' THEN
            UPDATE public.orders
            SET payment_status = p_new_status,
                razorpay_payment_id = COALESCE(v_order.razorpay_payment_id, p_razorpay_payment_id),
                razorpay_order_id = COALESCE(v_order.razorpay_order_id, p_razorpay_order_id),
                updated_at = v_now
            WHERE id = p_order_id;
        END IF;
    END IF;

    -- Mark webhook event processed
    UPDATE public.payment_webhook_events
    SET status = 'processed',
        processed_at = v_now,
        claimed_by = NULL,
        lease_expires_at = NULL,
        updated_at = v_now
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_payment_status(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_status(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 7. Webhook Claim Release on Failure RPC
CREATE OR REPLACE FUNCTION public.release_webhook_claim_on_failure(
    p_event_id TEXT,
    p_claimant_id TEXT,
    p_error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.payment_webhook_events
    SET status = 'failed_retryable',
        error_message = p_error_message,
        claimed_by = NULL,
        lease_expires_at = NULL,
        updated_at = NOW()
    WHERE event_id = p_event_id AND claimed_by = p_claimant_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_webhook_claim_on_failure(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_webhook_claim_on_failure(TEXT, TEXT, TEXT) TO service_role;

-- 8. Stock Validation: Fix decrement_stock to require strictly positive quantity and enforce fixed search_path
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

-- Dedicated Stock Restoration RPC with positive validation and safe search_path
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

-- 9. Atomic Order Cancellation RPC
-- Binds authorization to auth.uid() inside database (no trusted client user_id)
-- Locks order row FOR UPDATE
-- Sets refund_pending for paid orders and documents refund lifecycle
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
    -- Policy Note: Cancellation immediately restores inventory to catalog while
    -- marking paid orders as refund_pending to initiate asynchronous payment processor refund
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
        'cancellation_state', 'cancelled',
        'inventory_restored', true,
        'refund_status', (CASE WHEN v_order.is_paid = true OR v_order.payment_status = 'captured' THEN 'refund_pending' ELSE 'none' END),
        'refund_required', (v_order.is_paid = true OR v_order.payment_status = 'captured')
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT) TO authenticated, service_role;

-- 10. Analytics tables RLS enforcement and server-side reporting grants (Per-table existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'analytics' AND table_name = 'seller_daily_metrics'
    ) THEN
        ALTER TABLE analytics.seller_daily_metrics ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON analytics.seller_daily_metrics FROM anon, authenticated, PUBLIC;
        GRANT ALL ON analytics.seller_daily_metrics TO service_role;
        DROP POLICY IF EXISTS "Service role manages seller metrics" ON analytics.seller_daily_metrics;
        CREATE POLICY "Service role manages seller metrics" ON analytics.seller_daily_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'analytics' AND table_name = 'product_performance'
    ) THEN
        ALTER TABLE analytics.product_performance ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON analytics.product_performance FROM anon, authenticated, PUBLIC;
        GRANT ALL ON analytics.product_performance TO service_role;
        DROP POLICY IF EXISTS "Service role manages product performance" ON analytics.product_performance;
        CREATE POLICY "Service role manages product performance" ON analytics.product_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 11. High-priority foreign key supporting indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON public.product_inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events (event_id);
