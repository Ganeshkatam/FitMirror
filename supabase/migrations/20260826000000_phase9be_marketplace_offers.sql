BEGIN;

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE seller_status AS ENUM ('pending', 'active', 'suspended', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_offer_status AS ENUM ('draft', 'active', 'paused', 'suspended', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Upgrade Sellers Table
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_status_check;
ALTER TABLE sellers 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE seller_status USING status::seller_status,
  ALTER COLUMN status SET DEFAULT 'pending'::seller_status;

-- 3. Create product_offers Table
CREATE TABLE IF NOT EXISTS product_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    price_paise bigint NOT NULL CHECK (price_paise >= 0),
    sale_price_paise bigint CHECK (
        sale_price_paise IS NULL OR (
            sale_price_paise >= 0 AND sale_price_paise <= price_paise
        )
    ),
    status product_offer_status NOT NULL DEFAULT 'active'::product_offer_status,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE (product_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_product_offers_product ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_seller ON product_offers(seller_id);

-- 4. Store Reconciliation and Offer Migration
DO $$
DECLARE
    legacy_store RECORD;
    v_seller_id UUID;
    v_conflict_count INT;
BEGIN
    -- 4a. Reconcile store.owner_id -> profile -> seller
    FOR legacy_store IN SELECT * FROM stores WHERE seller_id IS NULL
    LOOP
        -- Safely map to an existing seller if one exists for the profile
        SELECT id INTO v_seller_id FROM sellers WHERE profile_id = legacy_store.owner_id;
        
        IF v_seller_id IS NULL THEN
            INSERT INTO sellers (profile_id, business_name, business_email, status)
            VALUES (legacy_store.owner_id, legacy_store.name, COALESCE(legacy_store.support_email, 'seller@fitmirror.com'), 'active'::seller_status)
            RETURNING id INTO v_seller_id;
        END IF;
        
        UPDATE stores SET seller_id = v_seller_id WHERE id = legacy_store.id;
    END LOOP;

    -- 4b. Verify no conflicting pre-existing offers
    SELECT COUNT(*) INTO v_conflict_count
    FROM products p
    JOIN stores s ON s.id = p.store_id
    JOIN product_offers po
      ON po.product_id = p.id
     AND po.seller_id = s.seller_id
    WHERE po.price_paise <> p.price
       OR (po.sale_price_paise IS DISTINCT FROM p.sale_price);
       
    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % conflicting pre-existing offers found.', v_conflict_count;
    END IF;

    -- 4c. Product -> Offer Commercial Migration
    INSERT INTO product_offers (product_id, seller_id, price_paise, sale_price_paise, status)
    SELECT 
        p.id, 
        s.seller_id, 
        p.price, 
        p.sale_price, 
        'active'::product_offer_status
    FROM products p
    JOIN stores s ON p.store_id = s.id
    ON CONFLICT (product_id, seller_id) DO UPDATE SET
        price_paise = EXCLUDED.price_paise,
        sale_price_paise = EXCLUDED.sale_price_paise,
        status = EXCLUDED.status;

END $$;

COMMIT;
