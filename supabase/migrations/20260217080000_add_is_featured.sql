alter table "public"."products" add column "is_featured" boolean default false;

-- Create index for performance
create index if not exists "products_is_featured_idx" on "public"."products" ("is_featured");
