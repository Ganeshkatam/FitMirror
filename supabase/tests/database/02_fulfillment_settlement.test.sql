BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT * FROM no_plan();

-- Setup
INSERT INTO auth.users (id, email) VALUES ('a1111111-1111-1111-1111-111111111111', 'seller_a@test.com') ON CONFLICT DO NOTHING;
INSERT INTO auth.users (id, email) VALUES ('b2222222-2222-2222-2222-222222222222', 'seller_b@test.com') ON CONFLICT DO NOTHING;

INSERT INTO sellers (id, profile_id, store_name, status) VALUES 
('s1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Store A', 'active'),
('s2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Store B', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, user_id, status, idempotency_key) VALUES ('o1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'pending', 'idem1') ON CONFLICT DO NOTHING;

INSERT INTO order_items (id, order_id, seller_id, product_id, variant_id, quantity, unit_price, total_amount, status) VALUES 
('i1111111-1111-1111-1111-111111111111', 'o1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'p_test_1', 'v_test_1', 2, 100, 200, 'pending'),
('i2222222-2222-2222-2222-222222222222', 'o1111111-1111-1111-1111-111111111111', 's2222222-2222-2222-2222-222222222222', 'p_test_2', 'v_test_2', 1, 300, 300, 'pending')
ON CONFLICT (id, seller_id) DO UPDATE SET status = 'pending';

-- Test 2: Seller A modifies Seller B item (via RPC)
SELECT diag('Test 2: Seller A modifies Seller B item');
-- Become Seller A
SET request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
SET role authenticated;

SELECT throws_ok(
    $$ SELECT transition_order_item_status('i2222222-2222-2222-2222-222222222222', 'pending', 'processing') $$,
    'insufficient_privilege',
    'Unauthorized: seller does not own this order item',
    'Seller A cannot modify Seller B item'
);

-- Test 4: Shipment contains two sellers
SELECT diag('Test 4: Shipment contains two sellers');
SELECT throws_ok(
    $$ SELECT create_shipment('FedEx', '1234', '[{"order_item_id": "i1111111-1111-1111-1111-111111111111", "quantity": 1}, {"order_item_id": "i2222222-2222-2222-2222-222222222222", "quantity": 1}]'::jsonb) $$,
    'insufficient_privilege',
    'Unauthorized: Order item i2222222-2222-2222-2222-222222222222 does not belong to you',
    'Cannot mix sellers in shipment'
);

-- Test 5 & 6: Shipment quantity
SELECT diag('Test 5 & 6: Shipment quantity invariants');
DO $$
DECLARE
    v_shipment UUID;
BEGIN
    -- Partial shipment (Test 6)
    v_shipment := create_shipment('FedEx', '1234', '[{"order_item_id": "i1111111-1111-1111-1111-111111111111", "quantity": 1}]'::jsonb);
    
    -- Exceeding quantity (Test 5)
    BEGIN
        PERFORM add_shipment_item(v_shipment, 'i1111111-1111-1111-1111-111111111111', 2);
        RAISE EXCEPTION 'Should have failed on quantity violation';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;
PERFORM pass('Partial shipment succeeded and exceeding quantity was blocked');

-- Test 7: Invalid fulfillment transition
SELECT diag('Test 7: Invalid fulfillment transition');
SELECT throws_ok(
    $$ SELECT transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'pending', 'delivered') $$,
    'check_violation',
    'Invalid transition from pending',
    'Pending -> Delivered is blocked'
);

-- Test 9 & 10: Delivered -> Settlement
SELECT diag('Test 9 & 10: Settlement Eligibility');
PERFORM transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'pending', 'processing');
PERFORM transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'processing', 'shipped');
PERFORM transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'shipped', 'delivered');

PERFORM is((SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'i1111111-1111-1111-1111-111111111111' AND type = 'sale'), 1, 'Exactly one settlement entry created');

-- Duplicate delivery attempt
PERFORM is((SELECT transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'shipped', 'delivered')), false, 'Duplicate transition is rejected safely');
PERFORM is((SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'i1111111-1111-1111-1111-111111111111' AND type = 'sale'), 1, 'Still exactly one settlement entry created (idempotent)');

-- Test 15: Refund
SELECT diag('Test 15: Refund');
PERFORM transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'delivered', 'return_requested');
PERFORM transition_order_item_status('i1111111-1111-1111-1111-111111111111', 'return_requested', 'returned');
PERFORM is((SELECT COUNT(*)::int FROM settlement_items WHERE order_item_id = 'i1111111-1111-1111-1111-111111111111' AND type = 'refund'), 1, 'Exactly one refund settlement entry created');
PERFORM is((SELECT SUM(seller_amount)::int FROM settlement_items WHERE order_item_id = 'i1111111-1111-1111-1111-111111111111'), 0, 'Net seller economics is exactly 0 after refund');

-- Test 13 & 15: Order aggregate status
SELECT diag('Test: Order aggregate status');
RESET ROLE;
PERFORM is((SELECT calculate_order_status('o1111111-1111-1111-1111-111111111111')), 'partially_delivered', 'Order status correctly derived as partially_delivered since Item A is returned/completed and Item B is pending');

SELECT * FROM finish();
ROLLBACK;
