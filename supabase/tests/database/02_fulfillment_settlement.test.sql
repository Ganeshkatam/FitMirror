BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT * FROM no_plan();

-- === SETUP ===
INSERT INTO auth.users (id, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'seller_a@test.com'),
  ('b2222222-2222-2222-2222-222222222222', 'seller_b@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'seller_a@test.com'),
  ('b2222222-2222-2222-2222-222222222222', 'seller_b@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO sellers (id, profile_id, business_name, business_email, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Store A', 'a@test.com', 'active'),
  ('d2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Store B', 'b@test.com', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, price, compare_price, image, category, material) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Test Product A', 400, 500, 'test.jpg', 'shirts', 'cotton'),
  ('99999999-9999-9999-9999-999999999999', 'Test Product B', 1000, 1200, 'test2.jpg', 'pants', 'denim')
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, name, size) VALUES
  ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'SKU-A-M', 'Medium', 'M'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'SKU-B-L', 'Large', 'L')
ON CONFLICT DO NOTHING;

INSERT INTO product_offers (id, product_id, seller_id, price_paise, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111', 40000, 'active'),
  ('b2222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'd2222222-2222-2222-2222-222222222222', 100000, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, user_id, status, idempotency_key, total_amount, subtotal_amount, tax_amount, shipping_cost, discount_amount)
VALUES ('e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'placed',
        'aaaa1111-1111-1111-1111-111111111111', 3000, 3000, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Item A: qty=5, unit=400, total=2000, commission=200, seller=1800
INSERT INTO order_items (
    id, order_id, seller_id, offer_id, product_id, variant_id,
    quantity, unit_price, discount_amount_paise, taxable_amount_paise, tax_rate_bps, tax_amount_paise, total_amount,
    commission_rate, commission_amount, seller_amount, status
) VALUES (
    'f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888',
    5, 400, 0, 2000, 0, 0, 2000, 0.10, 200, 1800, 'pending'
) ON CONFLICT (id, seller_id) DO UPDATE SET status = 'pending';

-- Item B: qty=1, unit=1000, total=1000, commission=100, seller=900
INSERT INTO order_items (
    id, order_id, seller_id, offer_id, product_id, variant_id,
    quantity, unit_price, discount_amount_paise, taxable_amount_paise, tax_rate_bps, tax_amount_paise, total_amount,
    commission_rate, commission_amount, seller_amount, status
) VALUES (
    'f2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111',
    'd2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
    '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    1, 1000, 0, 1000, 0, 0, 1000, 0.10, 100, 900, 'pending'
) ON CONFLICT (id, seller_id) DO UPDATE SET status = 'pending';

-- === BECOME SELLER A ===
SET request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
SET role authenticated;

-- TEST 1: Seller A cannot modify Seller B item
SELECT throws_ok(
    $$ SELECT transition_order_item_status('f2222222-2222-2222-2222-222222222222', 'pending', 'processing') $$,
    '42501'::character(5),
    'Unauthorized: seller does not own this order item',
    'T1: Seller A cannot modify Seller B item'
);

-- TEST 2: Cannot mix sellers in shipment
SELECT throws_ok(
    $$ SELECT create_shipment('FedEx', '1234', '[{"order_item_id": "f1111111-1111-1111-1111-111111111111", "quantity": 1}, {"order_item_id": "f2222222-2222-2222-2222-222222222222", "quantity": 1}]'::jsonb) $$,
    '42501'::character(5),
    'Unauthorized: Order item f2222222-2222-2222-2222-222222222222 does not belong to you',
    'T2: Cannot mix sellers in shipment'
);

-- TEST 3: Invalid state transition
SELECT throws_ok(
    $$ SELECT transition_order_item_status('f1111111-1111-1111-1111-111111111111', 'pending', 'delivered') $$,
    '23514'::character(5),
    'Invalid transition from pending',
    'T3: pending -> delivered is blocked'
);

-- TEST 4: Shipment quantity invariants (partial shipment + oversell block)
DO $$
DECLARE
    v_shipment UUID;
BEGIN
    -- Partial shipment of 2 out of 5
    v_shipment := create_shipment('FedEx', '1234', '[{"order_item_id": "f1111111-1111-1111-1111-111111111111", "quantity": 2}]'::jsonb);
    
    -- Ship another 2 (total 4)
    PERFORM add_shipment_item(v_shipment, 'f1111111-1111-1111-1111-111111111111', 2);
    
    -- Attempt to ship 2 more (total 6 > 5) -> should fail
    BEGIN
        PERFORM add_shipment_item(v_shipment, 'f1111111-1111-1111-1111-111111111111', 2);
        RAISE EXCEPTION 'Should have failed on quantity violation';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;
SELECT pass('T4: Partial shipment succeeded and exceeding quantity was blocked');

-- TEST 5: Valid transitions: pending -> processing -> shipped -> delivered
SELECT is(
    (SELECT transition_order_item_status('f1111111-1111-1111-1111-111111111111', 'pending', 'processing')),
    true, 'T5a: pending -> processing'
);
SELECT is(
    (SELECT transition_order_item_status('f1111111-1111-1111-1111-111111111111', 'processing', 'shipped')),
    true, 'T5b: processing -> shipped'
);
SELECT is(
    (SELECT transition_order_item_status('f1111111-1111-1111-1111-111111111111', 'shipped', 'delivered')),
    true, 'T5c: shipped -> delivered'
);

-- TEST 6: Settlement created exactly once with snapshot facts
SELECT is(
    (SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    1, 'T6a: Exactly one sale settlement'
);
SELECT is(
    (SELECT quantity FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    5, 'T6b: Settlement captures full item quantity=5'
);
SELECT is(
    (SELECT gross_amount FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    2000::bigint, 'T6c: Settlement gross=2000 from order_item snapshot'
);
SELECT is(
    (SELECT seller_amount FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    1800::bigint, 'T6d: Settlement seller_amount=1800 from order_item snapshot'
);

-- TEST 7: Single-winner concurrency / duplicate transition returns false
SELECT is(
    (SELECT transition_order_item_status('f1111111-1111-1111-1111-111111111111', 'shipped', 'delivered')),
    false, 'T7a: Duplicate transition returns false'
);
SELECT is(
    (SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    1, 'T7b: Still exactly one sale settlement (idempotent)'
);

-- TEST 8: H7 Snapshot Isolation -- mutating offer/product price does NOT alter existing settlement
RESET ROLE;
UPDATE product_offers SET price_paise = 99999 WHERE id = 'b1111111-1111-1111-1111-111111111111';
UPDATE products SET price = 9999 WHERE id = '77777777-7777-7777-7777-777777777777';

SELECT is(
    (SELECT gross_amount FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'sale'),
    2000::bigint, 'T8: Settlement gross remains 2000 despite offer price change'
);

-- === BECOME SELLER A AGAIN ===
SET request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
SET role authenticated;

-- TEST 9: Partial Return (H4: 2 out of 5 units returned)
DO $$
DECLARE
    v_ret_id UUID;
BEGIN
    v_ret_id := process_return(
        'f1111111-1111-1111-1111-111111111111',
        2,
        'cccc1111-1111-1111-1111-111111111111'
    );
END $$;

SELECT is(
    (SELECT gross_amount FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'refund'),
    -800::bigint, 'T9a: Partial refund gross is -800 (floor(2000 * 2 / 5))'
);
SELECT is(
    (SELECT seller_amount FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'refund'),
    -720::bigint, 'T9b: Partial refund seller amount is -720 (floor(1800 * 2 / 5))'
);
SELECT is(
    (SELECT status::text FROM order_items WHERE id = 'f1111111-1111-1111-1111-111111111111'),
    'return_requested', 'T9c: Status transitioned to return_requested on partial return'
);

-- TEST 10: Return Idempotency (H5: same idempotency key produces no duplicate row)
DO $$
DECLARE
    v_ret_id UUID;
BEGIN
    v_ret_id := process_return(
        'f1111111-1111-1111-1111-111111111111',
        2,
        'cccc1111-1111-1111-1111-111111111111'
    );
END $$;

SELECT is(
    (SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111' AND type = 'refund'),
    1, 'T10: Retry with same idempotency key produces exactly 1 refund record'
);

-- TEST 11: Final Return (remaining 3 units -> exact remainder economics & status = returned)
DO $$
DECLARE
    v_ret_id UUID;
BEGIN
    v_ret_id := process_return(
        'f1111111-1111-1111-1111-111111111111',
        3,
        'cccc2222-2222-2222-2222-222222222222'
    );
END $$;

SELECT is(
    (SELECT SUM(gross_amount)::bigint FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111'),
    0::bigint, 'T11a: Net gross across sale + all refunds is exactly 0'
);
SELECT is(
    (SELECT SUM(seller_amount)::bigint FROM settlement_items WHERE order_item_id = 'f1111111-1111-1111-1111-111111111111'),
    0::bigint, 'T11b: Net seller economics across sale + all refunds is exactly 0'
);
SELECT is(
    (SELECT status::text FROM order_items WHERE id = 'f1111111-1111-1111-1111-111111111111'),
    'returned', 'T11c: Order item is fully returned'
);

-- TEST 12: Cannot return more than ordered (5 ordered, 5 returned, trying 1 more)
SELECT throws_ok(
    $$ SELECT process_return('f1111111-1111-1111-1111-111111111111', 1, 'cccc3333-3333-3333-3333-333333333333') $$,
    '23514'::character(5),
    'Cannot return 1 units: 5 already returned out of 5 ordered',
    'T12: Cannot return exceeding quantity'
);

-- TEST 13: Order status aggregation (H6)
RESET ROLE;
-- Item A is returned, Item B is pending -> order is partially_delivered
SELECT is(
    (SELECT calculate_order_status('e1111111-1111-1111-1111-111111111111')),
    'partially_delivered',
    'T13a: 1 returned + 1 pending = partially_delivered'
);

-- Cancel Item B -> all non-cancelled are returned -> completed
UPDATE order_items SET status = 'cancelled' WHERE id = 'f2222222-2222-2222-2222-222222222222';
SELECT is(
    (SELECT calculate_order_status('e1111111-1111-1111-1111-111111111111')),
    'completed',
    'T13b: 1 returned + 1 cancelled = completed'
);

-- Make Item A cancelled too -> all cancelled -> cancelled
UPDATE order_items SET status = 'cancelled' WHERE id = 'f1111111-1111-1111-1111-111111111111';
SELECT is(
    (SELECT calculate_order_status('e1111111-1111-1111-1111-111111111111')),
    'cancelled',
    'T13c: all cancelled = cancelled'
);

SELECT * FROM finish();
ROLLBACK;
