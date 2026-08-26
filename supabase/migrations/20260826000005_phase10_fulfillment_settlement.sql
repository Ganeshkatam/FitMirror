-- Phase 10 Fulfillment and Settlement Schema

BEGIN;

-- 10B: Fulfillment state machine
CREATE TYPE order_item_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'return_requested',
    'returned'
);

-- Convert existing status column safely
ALTER TABLE order_items 
  ALTER COLUMN status TYPE order_item_status 
  USING COALESCE(status, 'pending')::order_item_status,
  ALTER COLUMN status SET DEFAULT 'pending';

-- UNIQUE constraint for shipment_items composite FK
ALTER TABLE order_items ADD CONSTRAINT order_items_id_seller_id_key UNIQUE (id, seller_id);

-- 10C: Shipments domain
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    carrier TEXT NOT NULL,
    tracking_number TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT shipments_id_seller_id_key UNIQUE (id, seller_id)
);

CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL,
    order_item_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_shipment 
        FOREIGN KEY (shipment_id, seller_id) 
        REFERENCES shipments(id, seller_id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_order_item 
        FOREIGN KEY (order_item_id, seller_id) 
        REFERENCES order_items(id, seller_id) ON DELETE RESTRICT
);

-- Trigger to enforce SUM(shipment_items.quantity) <= order_items.quantity
CREATE OR REPLACE FUNCTION enforce_shipment_quantity() RETURNS TRIGGER AS $$
DECLARE
    v_ordered_qty INTEGER;
    v_shipped_qty INTEGER;
BEGIN
    SELECT quantity INTO v_ordered_qty FROM order_items WHERE id = NEW.order_item_id;
    SELECT COALESCE(SUM(quantity), 0) INTO v_shipped_qty FROM shipment_items WHERE order_item_id = NEW.order_item_id;
    
    IF v_shipped_qty > v_ordered_qty THEN
        RAISE EXCEPTION 'Cannot ship % items for order item %, only % ordered', v_shipped_qty, NEW.order_item_id, v_ordered_qty
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_shipment_quantity
    AFTER INSERT OR UPDATE ON shipment_items
    FOR EACH ROW EXECUTE FUNCTION enforce_shipment_quantity();

-- 10E: Customer order aggregation
CREATE OR REPLACE FUNCTION calculate_order_status(p_order_id UUID) RETURNS text AS $$
DECLARE
    v_total int;
    v_pending int;
    v_processing int;
    v_shipped int;
    v_delivered int;
    v_cancelled int;
BEGIN
    SELECT 
        count(*),
        count(*) FILTER (WHERE status = 'pending'),
        count(*) FILTER (WHERE status = 'processing'),
        count(*) FILTER (WHERE status = 'shipped'),
        count(*) FILTER (WHERE status = 'delivered'),
        count(*) FILTER (WHERE status IN ('cancelled', 'returned', 'return_requested'))
    INTO v_total, v_pending, v_processing, v_shipped, v_delivered, v_cancelled
    FROM order_items
    WHERE order_id = p_order_id;

    IF v_total = 0 THEN
        RETURN 'pending';
    END IF;

    IF v_cancelled = v_total THEN
        RETURN 'cancelled';
    END IF;

    IF (v_delivered + v_cancelled) = v_total AND v_delivered > 0 THEN
        RETURN 'completed';
    END IF;

    IF v_delivered = v_total THEN
        RETURN 'delivered';
    END IF;

    IF v_shipped = v_total THEN
        RETURN 'shipped';
    END IF;

    IF v_delivered > 0 THEN
        RETURN 'partially_delivered';
    END IF;

    IF v_shipped > 0 THEN
        RETURN 'partially_shipped';
    END IF;

    IF v_processing > 0 THEN
        RETURN 'processing';
    END IF;

    RETURN 'pending';
END;
$$ LANGUAGE plpgsql STABLE;

-- 10F/10G: Settlement ledger
CREATE TYPE settlement_type AS ENUM ('sale', 'refund', 'adjustment');

CREATE TABLE settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    type settlement_type NOT NULL,
    gross_amount BIGINT NOT NULL,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    platform_fee BIGINT NOT NULL DEFAULT 0,
    seller_amount BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_order_item_sale UNIQUE NULLS NOT DISTINCT (order_item_id, CASE WHEN type = 'sale' THEN true ELSE null END)
);

-- 10H: Seller payouts
CREATE TABLE seller_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    gross_amount BIGINT NOT NULL,
    platform_fees BIGINT NOT NULL,
    adjustments BIGINT NOT NULL DEFAULT 0,
    net_amount BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relate settlement items to payouts
ALTER TABLE settlement_items ADD COLUMN payout_id UUID REFERENCES seller_payouts(id) ON DELETE SET NULL;

-- 10B RPC: transition_order_item_status
CREATE OR REPLACE FUNCTION transition_order_item_status(
    p_order_item_id UUID,
    p_expected_status order_item_status,
    p_new_status order_item_status
) RETURNS BOOLEAN AS $$
DECLARE
    v_seller_profile_id UUID;
    v_updated BOOLEAN := false;
BEGIN
    -- Authorization: must be the seller of the item
    SELECT sellers.profile_id INTO v_seller_profile_id
    FROM order_items
    JOIN sellers ON sellers.id = order_items.seller_id
    WHERE order_items.id = p_order_item_id;

    IF v_seller_profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: seller does not own this order item'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Transition rules
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

    -- Atomic conditional update
    UPDATE order_items 
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_order_item_id AND status = p_expected_status;

    IF FOUND THEN
        v_updated := true;
        
        -- Settlement logic when delivered
        IF p_new_status = 'delivered' THEN
            INSERT INTO settlement_items (
                order_item_id, seller_id, type, 
                gross_amount, discount_amount, tax_amount, platform_fee, seller_amount
            )
            SELECT 
                id, seller_id, 'sale',
                total_amount, 
                COALESCE(discount_amount_paise, 0),
                COALESCE(tax_amount_paise, 0),
                COALESCE(commission_amount, 0),
                COALESCE(seller_amount, 0)
            FROM order_items WHERE id = p_order_item_id
            ON CONFLICT DO NOTHING;
        END IF;

        -- Return/Refund economics logic
        IF p_new_status = 'returned' THEN
            INSERT INTO settlement_items (
                order_item_id, seller_id, type, 
                gross_amount, discount_amount, tax_amount, platform_fee, seller_amount
            )
            SELECT 
                id, seller_id, 'refund',
                -total_amount, 
                -COALESCE(discount_amount_paise, 0),
                -COALESCE(tax_amount_paise, 0),
                -COALESCE(commission_amount, 0),
                -COALESCE(seller_amount, 0)
            FROM order_items WHERE id = p_order_item_id;
        END IF;
    END IF;

    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10D: Seller fulfillment APIs
CREATE OR REPLACE FUNCTION create_shipment(
    p_carrier TEXT,
    p_tracking_number TEXT,
    p_items JSONB -- [{order_item_id, quantity}]
) RETURNS UUID AS $$
DECLARE
    v_seller_id UUID;
    v_shipment_id UUID;
    v_item JSONB;
    v_order_item_seller UUID;
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
        -- Verify order item belongs to this seller
        SELECT seller_id INTO v_order_item_seller FROM order_items WHERE id = (v_item->>'order_item_id')::UUID;
        IF v_order_item_seller != v_seller_id THEN
            RAISE EXCEPTION 'Unauthorized: Order item % does not belong to you', (v_item->>'order_item_id') USING ERRCODE = 'insufficient_privilege';
        END IF;

        INSERT INTO shipment_items (shipment_id, order_item_id, seller_id, quantity)
        VALUES (v_shipment_id, (v_item->>'order_item_id')::UUID, v_seller_id, (v_item->>'quantity')::INTEGER);
    END LOOP;

    RETURN v_shipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_shipment_item(
    p_shipment_id UUID,
    p_order_item_id UUID,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_seller_id UUID;
    v_order_item_seller UUID;
BEGIN
    SELECT id INTO v_seller_id FROM sellers WHERE profile_id = auth.uid();
    IF v_seller_id IS NULL THEN
        RAISE EXCEPTION 'Not a seller' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Verify order item belongs to this seller
    SELECT seller_id INTO v_order_item_seller FROM order_items WHERE id = p_order_item_id;
    IF v_order_item_seller != v_seller_id THEN
        RAISE EXCEPTION 'Unauthorized: Order item does not belong to you' USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    INSERT INTO shipment_items (shipment_id, order_item_id, seller_id, quantity)
    VALUES (p_shipment_id, p_order_item_id, v_seller_id, p_quantity);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION mark_shipped(
    p_order_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN transition_order_item_status(p_order_item_id, 'processing', 'shipped');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_delivered(
    p_order_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN transition_order_item_status(p_order_item_id, 'shipped', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_return(
    p_order_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN transition_order_item_status(p_order_item_id, 'delivered', 'return_requested');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their shipments" ON shipments
    FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "Sellers can view their shipment items" ON shipment_items
    FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "Sellers can view their settlements" ON settlement_items
    FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "Sellers can view their payouts" ON seller_payouts
    FOR SELECT USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));

COMMIT;
