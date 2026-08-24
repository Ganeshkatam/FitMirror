-- Make store_id nullable to support global analytics events (like search, home page view)
alter table analytics_events alter column store_id drop not null;
