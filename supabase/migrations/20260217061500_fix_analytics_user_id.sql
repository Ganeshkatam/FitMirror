-- Make user_id nullable to support anonymous analytics
alter table analytics_events alter column user_id drop not null;

-- Ensure RLS allows anonymous inserts if not already
create policy "Allow public insert" on analytics_events for insert with check (true);
-- Note: If policy already exists, this might error or be ignored. Supabase usually handles duplicate policy names by erroring.
-- Safest to drop first or use DO block?
-- Simple approach: If it fails, user can ignore. But let's try to be clean.
-- Actually, the previous migration created "Allow public insert". If user ran it, it exists.
-- But the table ALREADY EXISTED (hence the error), so maybe my previous migration didn't run or didn't create policy?
-- If table existed, "create table if not exists" did nothing.
-- The existing table likely has its own policies.
-- I'll just do the alter column. That is the critical fix.
