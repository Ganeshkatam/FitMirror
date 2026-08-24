-- Phase 3B: Establish First-Party Ownership

-- 1. Consolidate all products under the single first-party store
UPDATE products 
SET store_id = '05317275-ed64-444d-b86a-7745d60f5aa4';

-- 2. Delete the secondary dummy store
DELETE FROM stores 
WHERE id = 'c28c8e24-0d53-4052-aadc-32b954163704';

-- Phase 3C: Drop constraints linking core tables to sellers
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_seller_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_owner_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_seller_id_fkey;
ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_seller_id_fkey;
ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_seller_id_fkey;
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_seller_id_fkey;
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_seller_id_key;

-- Phase 3D: Drop the now-obsolete columns from core tables (with CASCADE to remove old RLS policies)
ALTER TABLE products 
  DROP COLUMN IF EXISTS seller_id CASCADE, 
  DROP COLUMN IF EXISTS owner_id CASCADE;

ALTER TABLE order_items DROP COLUMN IF EXISTS seller_id CASCADE;
ALTER TABLE returns DROP COLUMN IF EXISTS seller_id CASCADE;
ALTER TABLE return_items DROP COLUMN IF EXISTS seller_id CASCADE;
ALTER TABLE stores DROP COLUMN IF EXISTS seller_id CASCADE;

-- Phase 3E: Remove Seller Infrastructure
DROP TABLE IF EXISTS seller_transactions CASCADE;
DROP TABLE IF EXISTS seller_staff CASCADE;
DROP TABLE IF EXISTS seller_permissions CASCADE;
DROP TABLE IF EXISTS seller_warehouses CASCADE;
DROP TABLE IF EXISTS seller_payouts CASCADE;
DROP TABLE IF EXISTS seller_performance CASCADE;
DROP TABLE IF EXISTS seller_bank_details CASCADE;
DROP TABLE IF EXISTS seller_documents CASCADE;
DROP TABLE IF EXISTS seller_daily_metrics CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;

-- Phase 3F: Admin/Chairman Cleanup (Independent)
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_credentials CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS admin_reports CASCADE;
DROP TABLE IF EXISTS admin_pending_changes CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_mode_preferences CASCADE;
DROP TABLE IF EXISTS admin_invitations CASCADE;
DROP TABLE IF EXISTS chairman_sessions CASCADE;
DROP TABLE IF EXISTS chairman_audit_logs CASCADE;
DROP TABLE IF EXISTS chairmen CASCADE;
DROP TABLE IF EXISTS ip_whitelist CASCADE;
DROP TABLE IF EXISTS change_approval_rules CASCADE;
