-- Phase 9G.8.8: RLS Seller Identity Chain Migration

-- 1. Orders table: Sellers view orders if they have any order_items belonging to them
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their store orders" ON public.orders;

CREATE POLICY "Sellers can view their orders" ON public.orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.order_id = orders.id
          AND oi.seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
);

CREATE POLICY "Sellers can update their orders" ON public.orders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.order_id = orders.id
          AND oi.seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
);

-- 2. Order Items table: Sellers can view/update their own order items
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
CREATE POLICY "Sellers can view their order items" ON public.order_items FOR SELECT USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS "Sellers can update their order items" ON public.order_items;
CREATE POLICY "Sellers can update their order items" ON public.order_items FOR UPDATE USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);

-- 3. Products table: Sellers can manage products they have active offers for, OR own the store of
DROP POLICY IF EXISTS "Store owners can manage their products" ON public.products;
CREATE POLICY "Sellers can manage their products" ON public.products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.product_offers po
        WHERE po.product_id = products.id
          AND po.seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
    OR
    store_id IN (
        SELECT id FROM public.stores 
        WHERE seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
);

-- 4. Product Inventory table: Handled via offer_id
DROP POLICY IF EXISTS "Store owners can manage their inventory" ON public.product_inventory;
CREATE POLICY "Sellers manage own inventory" ON public.product_inventory FOR ALL USING (
    offer_id IN (
        SELECT id FROM public.product_offers 
        WHERE seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
);

-- 5. Product Media table: Handled via offers
DROP POLICY IF EXISTS "Sellers manage own media" ON public.product_media;
CREATE POLICY "Sellers manage own media" ON public.product_media FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.product_offers po
        WHERE po.product_id = product_media.product_id
          AND po.seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON p.store_id = s.id
        WHERE p.id = product_media.product_id
          AND s.seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
);

-- 6. Try-on events, Platform fees, Coupons: Migrate stores.owner_id to stores.seller_id
DROP POLICY IF EXISTS "Sellers view own events" ON public.tryon_events;
CREATE POLICY "Sellers view own events" ON public.tryon_events FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "Sellers can view own fees" ON public.platform_fees;
CREATE POLICY "Sellers can view own fees" ON public.platform_fees FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "Sellers can manage own coupons" ON public.coupons;
CREATE POLICY "Sellers can manage own coupons" ON public.coupons FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid()))
);
