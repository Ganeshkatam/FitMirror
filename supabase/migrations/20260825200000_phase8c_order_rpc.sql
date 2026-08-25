-- Migration: Phase 8C Order RPC

CREATE OR REPLACE FUNCTION create_order_snapshot(
    p_user_id uuid,
    p_coupon_id uuid,
    p_shipping_method_id uuid,
    p_calculation jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_coupon_record record;
    v_item jsonb;
    v_product_id uuid;
    v_variant_id uuid;
    v_quantity integer;
    v_stock integer;
    
    v_subtotal bigint;
    v_discount bigint;
    v_tax bigint;
    v_shipping bigint;
    v_total bigint;
BEGIN
    -- Extract totals
    v_subtotal := (p_calculation->>'subtotalPaise')::bigint;
    v_discount := (p_calculation->>'discountPaise')::bigint;
    v_tax      := (p_calculation->>'taxPaise')::bigint;
    v_shipping := (p_calculation->>'shippingPaise')::bigint;
    v_total    := (p_calculation->>'totalPaise')::bigint;

    -- 1. Redeem Coupon (Atomic)
    IF p_coupon_id IS NOT NULL THEN
        -- Lock coupon to ensure max_uses isn't exceeded concurrently
        SELECT * INTO v_coupon_record 
        FROM coupons 
        WHERE id = p_coupon_id FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coupon not found';
        END IF;

        IF v_coupon_record.is_active = false THEN
            RAISE EXCEPTION 'Coupon is not active';
        END IF;

        -- Check user usage limits
        IF v_coupon_record.max_uses_per_user IS NOT NULL THEN
            DECLARE
                v_user_uses integer;
            BEGIN
                SELECT count(*) INTO v_user_uses 
                FROM coupon_usages 
                WHERE coupon_id = p_coupon_id AND user_id = p_user_id;

                IF v_user_uses >= v_coupon_record.max_uses_per_user THEN
                    RAISE EXCEPTION 'Coupon usage limit exceeded for user';
                END IF;
            END;
        END IF;
    END IF;

    -- 2. Insert Order Snapshot
    INSERT INTO orders (
        user_id, status, subtotal_amount, discount_amount, 
        shipping_cost, tax_amount, total_amount, currency, shipping_method_id
    ) VALUES (
        p_user_id, 'pending_payment', v_subtotal, v_discount,
        v_shipping, v_tax, v_total, 'INR', p_shipping_method_id
    ) RETURNING id INTO v_order_id;

    -- 3. Record Coupon Usage (if any)
    IF p_coupon_id IS NOT NULL THEN
        INSERT INTO coupon_usages (coupon_id, order_id, user_id, discount_amount_paise)
        VALUES (p_coupon_id, v_order_id, p_user_id, v_discount);
    END IF;

    -- 4. Process Line Items (Stock lock & Insert snapshot)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_calculation->'lines')
    LOOP
        v_product_id := (v_item->>'productId')::uuid;
        v_variant_id := NULLIF(v_item->>'variantId', '')::uuid;
        v_quantity := (v_item->>'quantity')::integer;

        -- Lock and decrement stock
        IF v_variant_id IS NOT NULL THEN
            UPDATE product_variants
            SET stock = stock - v_quantity
            WHERE id = v_variant_id AND stock >= v_quantity
            RETURNING stock INTO v_stock;

            IF v_stock IS NULL THEN
                RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
            END IF;
        ELSE
            -- Main product stock
            UPDATE product_inventory
            SET stock = stock - v_quantity
            WHERE product_id = v_product_id AND stock >= v_quantity
            RETURNING stock INTO v_stock;
            
            IF v_stock IS NULL THEN
                RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
            END IF;
        END IF;

        -- Insert Order Item
        INSERT INTO order_items (
            order_id, product_id, variant_id, quantity,
            unit_price, tax_rule_id, tax_rate_bps,
            discount_amount_paise, taxable_amount_paise, tax_amount_paise, total_amount
        ) VALUES (
            v_order_id, v_product_id, v_variant_id, v_quantity,
            (v_item->>'unitPricePaise')::bigint,
            NULLIF(v_item->>'taxRuleId', '')::uuid,
            (v_item->>'taxRateBps')::integer,
            (v_item->>'discountAmountPaise')::bigint,
            (v_item->>'taxableAmountPaise')::bigint,
            (v_item->>'taxAmountPaise')::bigint,
            (v_item->>'totalAmountPaise')::bigint
        );
    END LOOP;

    RETURN v_order_id;
END;
$$;
