-- Phase 10 Hardening Migration
-- Addresses: H1 (transition concurrency), H2 (shipment quantity concurrency),
-- H3 (settlement composite FK), H4 (quantity-aware returns with deterministic
-- financial allocation), H5 (return idempotency key), H6 (deterministic order
-- aggregate status).

BEGIN;

---------------------------------------------------------------------
-- H4-preflight: Add quantity column to settlement_items
-- Zero historical rows, so DEFAULT 1 is safe (verified by preflight).
---------------------------------------------------------------------
ALTER TABLE settlement_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

---------------------------------------------------------------------
-- H5-preflight: Add idempotency_key column + unique index for returns
---------------------------------------------------------------------
ALTER TABLE settlement_items ADD COLUMN IF NOT EXISTS idempotency_key UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_idempotency
    ON settlement_items (order_item_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

---------------------------------------------------------------------
-- H3: Composite FK on settlement_items -> order_items(id, seller_id)
-- Prerequisite UNIQUE(id, seller_id) verified in preflight.
---------------------------------------------------------------------
ALTER TABLE settlement_items
    DROP CONSTRAINT IF EXISTS settlement_items_order_item_id_fkey;

ALTER TABLE settlement_items
    ADD CONSTRAINT settlement_items_order_item_seller_fkey
    FOREIGN KEY (order_item_id, seller_id)
    REFERENCES order_items(id, seller_id) ON DELETE RESTRICT;

---------------------------------------------------------------------
-- H2: Concurrency-safe shipment quantity trigger
-- Uses FOR UPDATE on parent order_items row to serialize.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_shipment_quantity() RETURNS TRIGGER AS $$
DECLARE
    v_ordered_qty INTEGER;
    v_shipped_qty INTEGER;
BEGIN
    -- Lock the parent row to serialize concurrent shipment inserts
    SELECT quantity INTO v_ordered_qty
    FROM order_items
    WHERE id = NEW.order_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item % does not exist', NEW.order_item_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_shipped_qty
    FROM shipment_items
    WHERE order_item_id = NEW.order_item_id;

    IF v_shipped_qty > v_ordered_qty THEN
        RAISE EXCEPTION 'Cannot ship % items for order item %, only % ordered',
            v_shipped_qty, NEW.order_item_id, v_ordered_qty
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- H1 + H4 (sale settlement): Hardened transition_order_item_status
-- 
-- H1: Authorization query is a plain SELECT (no FOR UPDATE needed
-- because the UPDATE itself serializes via row lock + WHERE status =
-- expected). Uses GET DIAGNOSTICS to require exactly 1 affected row.
--
-- H4 (sale): Settlement INSERT captures full item quantity.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION transition_order_item_status(
    p_order_item_id UUID,
    p_expected_status order_item_status,
    p_new_status order_item_status
) RETURNS BOOLEAN AS $$
DECLARE
    v_seller_id UUID;
    v_seller_profile_id UUID;
    v_row_count INTEGER;
BEGIN
    -- Authorization: derive seller from auth.uid(), not from client assertion
    SELECT oi.seller_id, s.profile_id
    INTO v_seller_id, v_seller_profile_id
    FROM order_items oi
    JOIN sellers s ON s.id = oi.seller_id
    WHERE oi.id = p_order_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item not found'
        USING ERRCODE = 'no_data_found';
    END IF;

    IF v_seller_profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: seller does not own this order item'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Validate transition graph
    IF p_expected_status = 'pending' AND p_new_status NOT IN ('processing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from pending' USING ERRCODE = 'check_violation';
    END IF;
    IF p_expected_status = 'processing' AND p_new_status NOT IN ('shipped', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from processing' USING ERRCODE = 'check_violation';
    END IF;
    IF p_expected_status = 'shipped' AND p_new_status NOT IN ('delivered', 'return_requested') THEN
        RAISE EXCEPTION 'Invalid transition from shipped' USING ERRCODE = 'check_violation';
    END IF;
    IF p_expected_status = 'delivered' AND p_new_status NOT IN ('return_requested') THEN
        RAISE EXCEPTION 'Invalid transition from delivered' USING ERRCODE = 'check_violation';
    END IF;
    IF p_expected_status = 'return_requested' AND p_new_status NOT IN ('returned') THEN
        RAISE EXCEPTION 'Invalid transition from return_requested' USING ERRCODE = 'check_violation';
    END IF;
    IF p_expected_status IN ('cancelled', 'returned') THEN
        RAISE EXCEPTION 'Item is in terminal state' USING ERRCODE = 'check_violation';
    END IF;

    -- Atomic conditional update: row lock serializes concurrent attempts
    UPDATE order_items
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_order_item_id
      AND seller_id = v_seller_id
      AND status = p_expected_status;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF v_row_count != 1 THEN
        -- Concurrent transition already won; this request lost the race
        RETURN false;
    END IF;

    -- Settlement: generate immutable sale ledger on delivery
    IF p_new_status = 'delivered' THEN
        INSERT INTO settlement_items (
            order_item_id, seller_id, type, quantity,
            gross_amount, discount_amount, tax_amount, platform_fee, seller_amount
        )
        SELECT
            id, seller_id, 'sale', quantity,
            total_amount,
            COALESCE(discount_amount_paise, 0),
            COALESCE(tax_amount_paise, 0),
            COALESCE(commission_amount, 0),
            COALESCE(seller_amount, 0)
        FROM order_items WHERE id = p_order_item_id
        ON CONFLICT (order_item_id) WHERE type = 'sale' DO NOTHING;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---------------------------------------------------------------------
-- H4 + H5: Quantity-aware, idempotent process_return()
--
-- Deterministic integer-paise allocation:
--   base_per_unit = floor(component / sale_quantity)
--   remainder     = component % sale_quantity
--   First unit absorbs remainder.
--
-- Concurrency: FOR UPDATE on order_items serializes competing returns.
-- Idempotency: unique (order_item_id, idempotency_key).
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_return(
    p_order_item_id UUID,
    p_return_quantity INTEGER,
    p_idempotency_key UUID
) RETURNS UUID AS $$
DECLARE
    v_seller_id UUID;
    v_seller_profile_id UUID;
    v_item_quantity INTEGER;
    v_item_total BIGINT;
    v_item_discount BIGINT;
    v_item_tax BIGINT;
    v_item_commission BIGINT;
    v_item_seller_amount BIGINT;
    v_already_returned INTEGER;
    v_refund_gross BIGINT;
    v_refund_discount BIGINT;
    v_refund_tax BIGINT;
    v_refund_commission BIGINT;
    v_refund_seller BIGINT;
    v_settlement_id UUID;
BEGIN
    IF p_return_quantity < 1 THEN
        RAISE EXCEPTION 'Return quantity must be at least 1'
        USING ERRCODE = 'check_violation';
    END IF;

    -- Lock the order item row for the duration of this transaction
    SELECT oi.seller_id, s.profile_id,
           oi.quantity, oi.total_amount,
           COALESCE(oi.discount_amount_paise, 0),
           COALESCE(oi.tax_amount_paise, 0),
           COALESCE(oi.commission_amount, 0),
           COALESCE(oi.seller_amount, 0)
    INTO v_seller_id, v_seller_profile_id,
         v_item_quantity, v_item_total,
         v_item_discount, v_item_tax,
         v_item_commission, v_item_seller_amount
    FROM order_items oi
    JOIN sellers s ON s.id = oi.seller_id
    WHERE oi.id = p_order_item_id
    FOR UPDATE OF oi;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item not found'
        USING ERRCODE = 'no_data_found';
    END IF;

    IF v_seller_profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: seller does not own this order item'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Calculate already-returned quantity from the refund ledger
    SELECT COALESCE(SUM(quantity), 0) INTO v_already_returned
    FROM settlement_items
    WHERE order_item_id = p_order_item_id
      AND type = 'refund';

    IF (v_already_returned + p_return_quantity) > v_item_quantity THEN
        RAISE EXCEPTION 'Cannot return % units: % already returned out of % ordered',
            p_return_quantity, v_already_returned, v_item_quantity
        USING ERRCODE = 'check_violation';
    END IF;

    -- Deterministic integer-paise allocation
    -- Each component is allocated proportionally: floor(component * return_qty / total_qty)
    -- with remainder absorbed by the final return batch (when return_qty + already_returned = total_qty).
    IF (v_already_returned + p_return_quantity) = v_item_quantity THEN
        -- Final return: allocate the remainder (total - sum of previous refunds)
        SELECT
            v_item_total - COALESCE(SUM(CASE WHEN type = 'refund' THEN -gross_amount ELSE 0 END), 0),
            v_item_discount - COALESCE(SUM(CASE WHEN type = 'refund' THEN -discount_amount ELSE 0 END), 0),
            v_item_tax - COALESCE(SUM(CASE WHEN type = 'refund' THEN -tax_amount ELSE 0 END), 0),
            v_item_commission - COALESCE(SUM(CASE WHEN type = 'refund' THEN -platform_fee ELSE 0 END), 0),
            v_item_seller_amount - COALESCE(SUM(CASE WHEN type = 'refund' THEN -seller_amount ELSE 0 END), 0)
        INTO v_refund_gross, v_refund_discount, v_refund_tax, v_refund_commission, v_refund_seller
        FROM settlement_items
        WHERE order_item_id = p_order_item_id
          AND type = 'refund';
    ELSE
        -- Non-final return: floor allocation
        v_refund_gross := floor(v_item_total::numeric * p_return_quantity / v_item_quantity);
        v_refund_discount := floor(v_item_discount::numeric * p_return_quantity / v_item_quantity);
        v_refund_tax := floor(v_item_tax::numeric * p_return_quantity / v_item_quantity);
        v_refund_commission := floor(v_item_commission::numeric * p_return_quantity / v_item_quantity);
        v_refund_seller := floor(v_item_seller_amount::numeric * p_return_quantity / v_item_quantity);
    END IF;

    -- Insert refund ledger entry (idempotent via unique key)
    INSERT INTO settlement_items (
        order_item_id, seller_id, type, quantity, idempotency_key,
        gross_amount, discount_amount, tax_amount, platform_fee, seller_amount
    )
    VALUES (
        p_order_item_id, v_seller_id, 'refund', p_return_quantity, p_idempotency_key,
        -v_refund_gross, -v_refund_discount, -v_refund_tax, -v_refund_commission, -v_refund_seller
    )
    ON CONFLICT (order_item_id, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING;

    GET DIAGNOSTICS v_settlement_id = ROW_COUNT;

    -- Transition item status if fully returned
    IF (v_already_returned + p_return_quantity) = v_item_quantity THEN
        UPDATE order_items
        SET status = 'returned', updated_at = NOW()
        WHERE id = p_order_item_id
          AND status IN ('delivered', 'return_requested');
    ELSIF v_already_returned = 0 THEN
        -- First partial return: transition to return_requested
        UPDATE order_items
        SET status = 'return_requested', updated_at = NOW()
        WHERE id = p_order_item_id
          AND status = 'delivered';
    END IF;

    -- Return the settlement entry id
    SELECT id INTO v_settlement_id
    FROM settlement_items
    WHERE order_item_id = p_order_item_id
      AND idempotency_key = p_idempotency_key;

    RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---------------------------------------------------------------------
-- H2: Hardened create_shipment with FOR UPDATE row lock
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_shipment(
    p_carrier TEXT,
    p_tracking_number TEXT,
    p_items JSONB -- [{order_item_id, quantity}]
) RETURNS UUID AS $$
DECLARE
    v_seller_id UUID;
    v_shipment_id UUID;
    v_item JSONB;
    v_oi_seller_id UUID;
    v_ordered_qty INTEGER;
    v_already_shipped INTEGER;
    v_requested_qty INTEGER;
BEGIN
    SELECT id INTO v_seller_id FROM sellers WHERE profile_id = auth.uid();
    IF v_seller_id IS NULL THEN
        RAISE EXCEPTION 'Not a seller' USING ERRCODE = 'insufficient_privilege';
    END IF;

    INSERT INTO shipments (seller_id, carrier, tracking_number, status)
    VALUES (v_seller_id, p_carrier, p_tracking_number, 'created')
    RETURNING id INTO v_shipment_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Lock the order item row to serialize concurrent shipment operations
        SELECT seller_id, quantity
        INTO v_oi_seller_id, v_ordered_qty
        FROM order_items
        WHERE id = (v_item->>'order_item_id')::UUID
        FOR UPDATE;

        IF v_oi_seller_id != v_seller_id THEN
            RAISE EXCEPTION 'Unauthorized: Order item % does not belong to you',
                (v_item->>'order_item_id')
            USING ERRCODE = 'insufficient_privilege';
        END IF;

        v_requested_qty := (v_item->>'quantity')::INTEGER;

        SELECT COALESCE(SUM(quantity), 0) INTO v_already_shipped
        FROM shipment_items
        WHERE order_item_id = (v_item->>'order_item_id')::UUID;

        IF (v_already_shipped + v_requested_qty) > v_ordered_qty THEN
            RAISE EXCEPTION 'Cannot ship % more items for order item %: % already shipped of % ordered',
                v_requested_qty, (v_item->>'order_item_id'), v_already_shipped, v_ordered_qty
            USING ERRCODE = 'check_violation';
        END IF;

        INSERT INTO shipment_items (shipment_id, order_item_id, seller_id, quantity)
        VALUES (v_shipment_id, (v_item->>'order_item_id')::UUID, v_seller_id, v_requested_qty);
    END LOOP;

    RETURN v_shipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---------------------------------------------------------------------
-- H2: Hardened add_shipment_item with FOR UPDATE row lock
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_shipment_item(
    p_shipment_id UUID,
    p_order_item_id UUID,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_seller_id UUID;
    v_oi_seller_id UUID;
    v_ordered_qty INTEGER;
    v_already_shipped INTEGER;
BEGIN
    SELECT id INTO v_seller_id FROM sellers WHERE profile_id = auth.uid();
    IF v_seller_id IS NULL THEN
        RAISE EXCEPTION 'Not a seller' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Lock parent row to serialize
    SELECT seller_id, quantity
    INTO v_oi_seller_id, v_ordered_qty
    FROM order_items
    WHERE id = p_order_item_id
    FOR UPDATE;

    IF v_oi_seller_id != v_seller_id THEN
        RAISE EXCEPTION 'Unauthorized: Order item does not belong to you'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_already_shipped
    FROM shipment_items
    WHERE order_item_id = p_order_item_id;

    IF (v_already_shipped + p_quantity) > v_ordered_qty THEN
        RAISE EXCEPTION 'Cannot ship % more items: % already shipped of % ordered',
            p_quantity, v_already_shipped, v_ordered_qty
        USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO shipment_items (shipment_id, order_item_id, seller_id, quantity)
    VALUES (p_shipment_id, p_order_item_id, v_seller_id, p_quantity);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---------------------------------------------------------------------
-- H6: Deterministic order aggregate status
--
-- Precedence rules (explicit):
--   returned = terminal, counts as fulfilled-then-reversed
--   return_requested = active lifecycle, counts as in-flight
--
--   1. All cancelled                          → cancelled
--   2. All returned                           → returned
--   3. All non-cancelled are delivered/returned → completed
--   4. Any delivered (not all)                → partially_delivered
--   5. All shipped                            → shipped
--   6. Any shipped (not all)                  → partially_shipped
--   7. Any processing                         → processing
--   8. All pending                            → pending
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_order_status(p_order_id UUID) RETURNS text AS $$
DECLARE
    v_total int;
    v_pending int;
    v_processing int;
    v_shipped int;
    v_delivered int;
    v_cancelled int;
    v_returned int;
    v_return_requested int;
BEGIN
    SELECT
        count(*),
        count(*) FILTER (WHERE status = 'pending'),
        count(*) FILTER (WHERE status = 'processing'),
        count(*) FILTER (WHERE status = 'shipped'),
        count(*) FILTER (WHERE status = 'delivered'),
        count(*) FILTER (WHERE status = 'cancelled'),
        count(*) FILTER (WHERE status = 'returned'),
        count(*) FILTER (WHERE status = 'return_requested')
    INTO v_total, v_pending, v_processing, v_shipped, v_delivered,
         v_cancelled, v_returned, v_return_requested
    FROM order_items
    WHERE order_id = p_order_id;

    IF v_total = 0 THEN
        RETURN 'pending';
    END IF;

    -- 1. All cancelled
    IF v_cancelled = v_total THEN
        RETURN 'cancelled';
    END IF;

    -- 2. All returned
    IF v_returned = v_total THEN
        RETURN 'returned';
    END IF;

    -- 3. All non-cancelled items are delivered or returned
    --    (completed = order is done, some items may have been returned)
    IF (v_delivered + v_returned + v_cancelled) = v_total
       AND (v_delivered + v_returned) > 0 THEN
        RETURN 'completed';
    END IF;

    -- 4. Any return_requested counts as active delivery lifecycle
    --    Any delivered items exist (partial fulfillment)
    IF (v_delivered + v_return_requested + v_returned) > 0
       AND (v_delivered + v_return_requested + v_returned + v_cancelled) < v_total THEN
        RETURN 'partially_delivered';
    END IF;

    -- If all active items are delivered/return_requested/returned but not all cancelled
    IF (v_delivered + v_return_requested + v_returned) > 0
       AND (v_delivered + v_return_requested + v_returned + v_cancelled) = v_total THEN
        RETURN 'completed';
    END IF;

    -- 5. All shipped
    IF v_shipped = v_total THEN
        RETURN 'shipped';
    END IF;

    -- 6. Any shipped
    IF v_shipped > 0 THEN
        RETURN 'partially_shipped';
    END IF;

    -- 7. Any processing
    IF v_processing > 0 THEN
        RETURN 'processing';
    END IF;

    -- 8. Default
    RETURN 'pending';
END;
$$ LANGUAGE plpgsql STABLE;

---------------------------------------------------------------------
-- Remove the old request_return shortcut (replaced by process_return)
---------------------------------------------------------------------
DROP FUNCTION IF EXISTS request_return(UUID);

COMMIT;
