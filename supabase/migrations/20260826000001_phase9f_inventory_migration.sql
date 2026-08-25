BEGIN;

-- 1. Introduce the true marketplace boundary
ALTER TABLE product_inventory 
  ADD COLUMN offer_id uuid REFERENCES product_offers(id) ON DELETE RESTRICT;

-- 2. Deterministic Backfill
UPDATE product_inventory pi
SET offer_id = po.id
FROM product_offers po
JOIN stores s ON s.seller_id = po.seller_id
WHERE po.product_id = pi.product_id 
  AND s.id = pi.store_id;

-- 3. Self-verifying gate: abort if any inventory row lacks an offer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM product_inventory
        WHERE offer_id IS NULL
    ) THEN
        RAISE EXCEPTION
            '9F migration failed: one or more inventory rows could not be mapped to an offer';
    END IF;
END $$;

-- 4. Enforce the invariant natively
ALTER TABLE product_inventory 
  ALTER COLUMN offer_id SET NOT NULL;

-- 5. Add uniqueness constraint
-- Note: A single offer covers multiple variants (size/color). 
-- Therefore we cannot use UNIQUE(offer_id). We must use UNIQUE(offer_id, size, color) 
-- to ensure one inventory pool per variant per offer.
ALTER TABLE product_inventory
  ADD CONSTRAINT uq_inventory_offer_variant UNIQUE (offer_id, size, color);

CREATE INDEX IF NOT EXISTS idx_product_inventory_offer_id
    ON product_inventory(offer_id);

COMMIT;
