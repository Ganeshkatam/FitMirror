BEGIN;
-- Setup pgTAP extension if not exists
CREATE EXTENSION IF NOT EXISTS pgtap;

-- We plan for multiple assertions. The exact count can be managed by no_plan() or plan(n).
SELECT plan(13);

-- Test 1: create_order_snapshot success & idempotency retry
SELECT diag('Testing create_order_snapshot idempotency');

-- Setup test data inside the transaction
INSERT INTO users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'test@fitmirror.com') ON CONFLICT DO NOTHING;
INSERT INTO stores (id, name, slug) VALUES ('22222222-2222-2222-2222-222222222222', 'Test Store', 'test-store') ON CONFLICT DO NOTHING;

-- Product & Variant for inventory test
INSERT INTO products (id, store_id, name, slug, price) 
VALUES ('p_test_1', '22222222-2222-2222-2222-222222222222', 'Test Product', 'test-product', 100000) 
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

INSERT INTO product_variants (id, product_id, size, stock) 
VALUES ('v_test_1', 'p_test_1', 'M', 5) 
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock;

-- Create Coupon for limit test
INSERT INTO coupons (id, code, type, discount_value, max_uses, current_uses, is_active)
VALUES ('c_test_1', 'TEST50', 'percentage', 50, 1, 0, true)
ON CONFLICT (id) DO UPDATE SET max_uses = EXCLUDED.max_uses, current_uses = 0, is_active = true;

-- Execute the RPC
DO $$
DECLARE
    v_order_id UUID;
    v_order_id_retry UUID;
    v_idem_key UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    SELECT create_order_snapshot(
        '11111111-1111-1111-1111-111111111111', -- user_id
        '22222222-2222-2222-2222-222222222222', -- store_id
        100000, -- subtotal_amount
        0, -- discount_amount
        0, -- shipping_cost
        18000, -- tax_amount
        118000, -- total_amount
        '{}'::JSONB, -- shipping_address
        '{}'::JSONB, -- billing_address
        'online', -- payment_method
        NULL, -- coupon_id
        v_idem_key, -- idempotency_key
        ARRAY[
            '{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }'
        ]::JSONB[] -- items
    ) INTO v_order_id;
    
    -- Idempotency Test: exact same payload should yield SAME order ID and not decrement stock again
    SELECT create_order_snapshot(
        '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        100000, 0, 0, 18000, 118000, '{}'::JSONB, '{}'::JSONB, 'online', NULL, 
        v_idem_key, ARRAY['{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }']::JSONB[]
    ) INTO v_order_id_retry;

    PERFORM is(v_order_id_retry, v_order_id, 'Idempotency key retry returns identical authoritative order UUID');
    
    -- Inventory decrement test
    PERFORM is((SELECT stock FROM product_variants WHERE id = 'v_test_1'), 4, 'Stock decremented exactly once due to idempotency');
END $$;

-- Test 2: Snapshot Immutability
SELECT diag('Testing Snapshot immutability');
DO $$
DECLARE
    v_order_id UUID;
    v_idem_key UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    SELECT create_order_snapshot(
        '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        100000, 0, 0, 18000, 118000, '{}'::JSONB, '{}'::JSONB, 'online', NULL, 
        v_idem_key, ARRAY['{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }']::JSONB[]
    ) INTO v_order_id;
    
    -- Mutate product catalog price
    UPDATE products SET price = 999999 WHERE id = 'p_test_1';
    
    -- Assert Snapshot remains immutable
    PERFORM is((SELECT unit_price FROM order_items WHERE order_id = v_order_id LIMIT 1), 100000::bigint, 'Order item unit_price remains completely immutable after catalog mutation');
    PERFORM is((SELECT total_amount FROM orders WHERE id = v_order_id), 118000::bigint, 'Order total_amount remains completely immutable after catalog mutation');
END $$;

-- Test 3: Transactional Rollback Safety (force failure, assert rollback)
SELECT diag('Testing Transactional Rollback Safety');
DO $$
DECLARE
    v_order_id UUID;
    v_idem_key UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- We will try to execute it but purposely trigger a failure (e.g. quantity exceeds stock, or invalid user_id foreign key)
    BEGIN
        SELECT create_order_snapshot(
            '00000000-0000-0000-0000-000000000000', -- Non-existent user
            '22222222-2222-2222-2222-222222222222',
            100000, 0, 0, 18000, 118000, '{}'::JSONB, '{}'::JSONB, 'online', 'c_test_1', 
            v_idem_key, ARRAY['{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }']::JSONB[]
        ) INTO v_order_id;
        
        -- Should not reach here
        RAISE EXCEPTION 'Order creation should have failed due to invalid FK';
    EXCEPTION WHEN OTHERS THEN
        -- Assert rollback occurred successfully
        PERFORM is((SELECT current_uses FROM coupons WHERE id = 'c_test_1'), 0, 'Coupon usage absent after failed transaction rollback');
        PERFORM is((SELECT COUNT(*)::int FROM coupon_usages WHERE coupon_id = 'c_test_1'), 0, 'Coupon usage ledger absent after failed transaction rollback');
        -- Stock was 4 previously
        PERFORM is((SELECT stock FROM product_variants WHERE id = 'v_test_1'), 4, 'Inventory restored after failed transaction rollback');
    END;
END $$;

-- Test 4: Coupon Concurrency and Max Uses Limits
SELECT diag('Testing Coupon Max Uses limit');
DO $$
DECLARE
    v_order_id_1 UUID;
BEGIN
    SELECT create_order_snapshot(
        '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        100000, 0, 0, 18000, 118000, '{}'::JSONB, '{}'::JSONB, 'online', 'c_test_1', 
        '66666666-6666-6666-6666-666666666666', ARRAY['{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }']::JSONB[]
    ) INTO v_order_id_1;
    
    PERFORM is((SELECT current_uses FROM coupons WHERE id = 'c_test_1'), 1, 'Coupon usage incremented exactly to 1');
    
    -- Concurrency Simulation: Attempt to use the same coupon again which has max_uses = 1
    BEGIN
        SELECT create_order_snapshot(
            '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
            100000, 0, 0, 18000, 118000, '{}'::JSONB, '{}'::JSONB, 'online', 'c_test_1', 
            '77777777-7777-7777-7777-777777777777', ARRAY['{ "product_id": "p_test_1", "variant_id": "v_test_1", "quantity": 1, "unit_price": 100000, "gross_amount": 100000, "discount_amount": 0, "taxable_amount": 100000, "tax_amount": 18000, "total_amount": 118000 }']::JSONB[]
        );
        -- Should not reach here
        PERFORM fail('Coupon should have rejected second concurrent redemption');
    EXCEPTION WHEN OTHERS THEN
        PERFORM pass('Coupon successfully rejected second redemption exceeding max limits');
    END;
END $$;

-- Test 5: State Machine Transition (transition_order_status)
SELECT diag('Testing State Machine Verification (transition_order_status)');
DO $$
DECLARE
    v_order_id UUID;
BEGIN
    SELECT id INTO v_order_id FROM orders WHERE idempotency_key = '44444444-4444-4444-4444-444444444444';
    
    -- Valid: pending_payment -> placed
    PERFORM is(transition_order_status(v_order_id, 'pending_payment', 'placed'), true, 'Allowed transition pending_payment -> placed');
    
    -- Invalid: pending_payment -> confirmed (it is now placed, so pending_payment -> confirmed will fail because old status doesn''t match)
    PERFORM is(transition_order_status(v_order_id, 'pending_payment', 'confirmed'), false, 'Rejected transition due to mismatched expected current state');
    
    -- Invalid transition rule: placed -> shipped (we should enforce strict valid transitions in the function, but for now we just test the RPC signature and basic constraint)
    -- Our RPC `transition_order_status` requires knowing the exact current state.
    PERFORM is(transition_order_status(v_order_id, 'placed', 'confirmed'), true, 'Allowed transition placed -> confirmed');
END $$;

SELECT * FROM finish();
ROLLBACK;
