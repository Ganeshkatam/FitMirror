BEGIN;

-- 1. Introduce Columns
ALTER TABLE order_items 
  ADD COLUMN offer_id uuid REFERENCES product_offers(id) ON DELETE RESTRICT,
  ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE RESTRICT;

-- 2. Self-Verifying Gate (Audit mapping completeness)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM order_items oi
        LEFT JOIN stores s
          ON s.id = oi.store_id
        LEFT JOIN product_offers po
          ON po.product_id = oi.product_id
         AND po.seller_id = s.seller_id
        GROUP BY oi.id
        HAVING COUNT(po.id) <> 1
    ) THEN
        RAISE EXCEPTION
            '9G migration failed: every order_item must map to exactly one product_offer';
    END IF;
END $$;

-- 3. Backfill Snapshots
UPDATE order_items oi
SET 
  offer_id = po.id,
  seller_id = po.seller_id
FROM stores s
JOIN product_offers po ON po.seller_id = s.seller_id
WHERE oi.store_id = s.id AND po.product_id = oi.product_id;

-- 4. Validate Backfill Success
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM order_items WHERE offer_id IS NULL OR seller_id IS NULL) THEN
        RAISE EXCEPTION '9G migration failed: orphan order_items found without deterministic offer/seller mapping';
    END IF;
END $$;

-- 5. Enforce Strong Composite Invariant
-- Note: product_offers already has UNIQUE(id) and UNIQUE(product_id, seller_id),
-- but we must explicitly add UNIQUE(id, seller_id) to allow the composite foreign key.
ALTER TABLE product_offers ADD CONSTRAINT uq_product_offers_id_seller UNIQUE (id, seller_id);

ALTER TABLE order_items 
  ADD CONSTRAINT fk_order_items_offer_seller 
  FOREIGN KEY (offer_id, seller_id) REFERENCES product_offers (id, seller_id) ON DELETE RESTRICT;

ALTER TABLE order_items 
  ALTER COLUMN offer_id SET NOT NULL,
  ALTER COLUMN seller_id SET NOT NULL;

-- 6. Freeze Attribution (Immutability Trigger)
CREATE OR REPLACE FUNCTION prevent_order_item_attribution_mutation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.offer_id IS DISTINCT FROM OLD.offer_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
        RAISE EXCEPTION 'Immutable attribution: offer_id and seller_id cannot be modified after insertion';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_order_item_attribution_immutability
BEFORE UPDATE OF offer_id, seller_id ON order_items
FOR EACH ROW EXECUTE FUNCTION prevent_order_item_attribution_mutation();

COMMIT;
