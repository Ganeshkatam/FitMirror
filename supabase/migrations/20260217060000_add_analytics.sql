-- Create analytics_events table
create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  event_type text not null,
  product_id uuid references products(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table analytics_events enable row level security;

-- Policy: Allow public insert (anon and authenticated)
create policy "Allow public insert" on analytics_events for insert with check (true);

-- Optional: Allow admins to view (if needed), otherwise data is write-only for public
create policy "Allow admins to view" on analytics_events for select using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);
