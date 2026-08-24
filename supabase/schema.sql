
create table public.account_deletion_tokens (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  token text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint account_deletion_tokens_pkey primary key (id),
  constraint account_deletion_tokens_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_deletion_tokens_token on public.account_deletion_tokens using btree (token) TABLESPACE pg_default;


create table public.ad_campaigns (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  store_id uuid not null,
  name text not null,
  campaign_type text not null,
  status text null default 'draft'::text,
  daily_budget numeric(12, 2) null default 0,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_campaigns_pkey primary key (id),
  constraint ad_campaigns_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint ad_campaigns_store_id_fkey foreign KEY (store_id) references stores (id),
  constraint ad_campaigns_campaign_type_check check (
    (
      campaign_type = any (
        array[
          'sponsored_product'::text,
          'sponsored_brand'::text,
          'display'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.ad_clicks (
  id uuid not null default gen_random_uuid (),
  ad_id uuid not null,
  campaign_id uuid not null,
  user_id uuid not null,
  placement_id uuid null,
  cost numeric(10, 2) null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_clicks_pkey primary key (id),
  constraint ad_clicks_ad_id_fkey foreign KEY (ad_id) references ads (id),
  constraint ad_clicks_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id),
  constraint ad_clicks_placement_id_fkey foreign KEY (placement_id) references ad_placements (id),
  constraint ad_clicks_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.ad_conversions (
  id uuid not null default gen_random_uuid (),
  ad_id uuid not null,
  campaign_id uuid not null,
  user_id uuid not null,
  order_id uuid not null,
  revenue numeric(12, 2) null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_conversions_pkey primary key (id),
  constraint ad_conversions_ad_id_fkey foreign KEY (ad_id) references ads (id),
  constraint ad_conversions_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id),
  constraint ad_conversions_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint ad_conversions_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.ad_impressions (
  id uuid not null default gen_random_uuid (),
  ad_id uuid not null,
  campaign_id uuid not null,
  user_id uuid not null,
  placement_id uuid null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_impressions_pkey primary key (id),
  constraint ad_impressions_ad_id_fkey foreign KEY (ad_id) references ads (id),
  constraint ad_impressions_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id),
  constraint ad_impressions_placement_id_fkey foreign KEY (placement_id) references ad_placements (id),
  constraint ad_impressions_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.ad_placements (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_placements_pkey primary key (id),
  constraint ad_placements_slug_key unique (slug)
) TABLESPACE pg_default;


create table public.ad_spend (
  id uuid not null default gen_random_uuid (),
  campaign_id uuid not null,
  seller_id uuid not null,
  date date not null,
  amount numeric(12, 2) null default 0,
  impressions integer null default 0,
  clicks integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ad_spend_pkey primary key (id),
  constraint ad_spend_campaign_id_date_key unique (campaign_id, date),
  constraint ad_spend_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id),
  constraint ad_spend_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;

create table public.ad_stats_daily (
  id uuid not null default gen_random_uuid (),
  ad_id uuid not null,
  campaign_id uuid not null,
  stat_date date not null,
  impressions integer null default 0,
  clicks integer null default 0,
  conversions integer null default 0,
  spend_amount numeric(12, 2) null default 0,
  constraint ad_stats_daily_pkey primary key (id),
  constraint ad_stats_daily_ad_id_stat_date_key unique (ad_id, stat_date),
  constraint ad_stats_daily_ad_id_fkey foreign KEY (ad_id) references ads (id),
  constraint ad_stats_daily_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id)
) TABLESPACE pg_default;


create table public.addresses (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text null default 'India'::text,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  type text null default 'home'::text,
  constraint addresses_pkey primary key (id),
  constraint addresses_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_addresses_user_id on public.addresses using btree (user_id) TABLESPACE pg_default;


create table public.admin_activity_logs (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  profile_id uuid not null,
  admin_email text null,
  admin_name text null,
  session_id uuid not null,
  ip_address inet not null,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  resource_name text null,
  previous_value jsonb null,
  new_value jsonb null,
  changes_summary text not null,
  reason text null,
  severity text null default 'low'::text,
  category text null,
  performed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone null default now(),
  constraint admin_activity_logs_pkey primary key (id),
  constraint admin_activity_logs_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete set null,
  constraint admin_activity_logs_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete set null,
  constraint admin_activity_logs_session_id_fkey foreign KEY (session_id) references admin_sessions (id) on delete set null,
  constraint admin_activity_logs_severity_check check (
    (
      severity = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'critical'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_admin on public.admin_activity_logs using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_profile on public.admin_activity_logs using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_action on public.admin_activity_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_resource on public.admin_activity_logs using btree (resource_type, resource_id) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_performed on public.admin_activity_logs using btree (performed_at desc) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_severity on public.admin_activity_logs using btree (severity) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_category on public.admin_activity_logs using btree (category) TABLESPACE pg_default;


create table public.admin_credentials (
  id uuid not null default gen_random_uuid (),
  admin_id uuid null,
  profile_id uuid not null,
  pin_hash text null,
  pin_attempts integer null default 0,
  pin_locked_until timestamp with time zone null,
  admin_password_hash text null,
  password_attempts integer null default 0,
  password_locked_until timestamp with time zone null,
  last_login_at timestamp with time zone null,
  last_login_ip text null,
  last_login_device text null,
  two_factor_enabled boolean null default false,
  two_factor_secret text null,
  recovery_email text null,
  recovery_phone text null,
  verification_token text null,
  verification_token_expires_at timestamp with time zone null,
  verification_purpose text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  chairman_id uuid null,
  constraint admin_credentials_pkey primary key (id),
  constraint admin_credentials_profile_id_key unique (profile_id),
  constraint admin_credentials_admin_id_key unique (admin_id),
  constraint admin_credentials_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE,
  constraint admin_credentials_chairman_id_fkey foreign KEY (chairman_id) references chairmen (id),
  constraint admin_credentials_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint admin_credentials_owner_check check (
    (
      (
        (admin_id is not null)
        and (chairman_id is null)
      )
      or (
        (admin_id is null)
        and (chairman_id is not null)
      )
    )
  ),
  constraint admin_credentials_verification_purpose_check check (
    (
      verification_purpose = any (
        array[
          'pin_change'::text,
          'password_change'::text,
          'recovery'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admin_credentials_admin on public.admin_credentials using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_admin_credentials_profile on public.admin_credentials using btree (profile_id) TABLESPACE pg_default;


create table public.admin_invitations (
  id uuid not null default gen_random_uuid (),
  email text not null,
  token_hash text not null,
  role text not null default 'admin'::text,
  permissions jsonb null default '{}'::jsonb,
  department text null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  constraint admin_invitations_pkey primary key (id),
  constraint admin_invitations_created_by_fkey foreign KEY (created_by) references profiles (id)
) TABLESPACE pg_default;




create table public.admin_invitations (
  id uuid not null default gen_random_uuid (),
  email text not null,
  token_hash text not null,
  role text not null default 'admin'::text,
  permissions jsonb null default '{}'::jsonb,
  department text null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  constraint admin_invitations_pkey primary key (id),
  constraint admin_invitations_created_by_fkey foreign KEY (created_by) references profiles (id)
) TABLESPACE pg_default;


create table public.admin_mode_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  current_mode text not null default 'standard'::text,
  theme text not null default 'dark'::text,
  sidebar_collapsed boolean null default false,
  show_analytics boolean null default true,
  show_notifications boolean null default true,
  quick_actions jsonb null default '[]'::jsonb,
  dashboard_widgets jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_mode_preferences_pkey primary key (id),
  constraint admin_mode_preferences_user_id_key unique (user_id),
  constraint admin_mode_preferences_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint admin_mode_preferences_user_id_fkey1 foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint admin_mode_preferences_current_mode_check check (
    (
      current_mode = any (
        array[
          'standard'::text,
          'advanced'::text,
          'developer'::text,
          'minimal'::text
        ]
      )
    )
  ),
  constraint admin_mode_preferences_theme_check check (
    (
      theme = any (
        array['light'::text, 'dark'::text, 'system'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admin_mode_user on public.admin_mode_preferences using btree (user_id) TABLESPACE pg_default;

create table public.admin_notifications (
  id uuid not null default gen_random_uuid (),
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb null default '{}'::jsonb,
  read boolean null default false,
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null default (now() + '30 days'::interval),
  recipient_id uuid not null,
  priority text null default 'normal'::text,
  action_url text null,
  data jsonb null default '{}'::jsonb,
  read_at timestamp with time zone null,
  read_by uuid null,
  constraint admin_notifications_pkey primary key (id),
  constraint admin_notifications_recipient_id_fkey foreign KEY (recipient_id) references admins (id),
  constraint admin_notifications_type_check check (
    (
      type = any (
        array[
          'order'::text,
          'user'::text,
          'inventory'::text,
          'alert'::text,
          'review'::text,
          'system'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admin_notif_unread on public.admin_notifications using btree (recipient_id) TABLESPACE pg_default
where
  (read = false);

create index IF not exists idx_admin_notifications_unread on public.admin_notifications using btree (read, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_admin_notifications_read on public.admin_notifications using btree (read) TABLESPACE pg_default;

create index IF not exists idx_admin_notifications_type on public.admin_notifications using btree (type) TABLESPACE pg_default;

create index IF not exists idx_admin_notifications_created on public.admin_notifications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_admin_notifications_recipient on public.admin_notifications using btree (recipient_id) TABLESPACE pg_default;

create table public.admin_pending_changes (
  id uuid not null default gen_random_uuid (),
  requested_by_admin_id uuid not null,
  requested_by_profile_id uuid not null,
  requested_by_email text not null,
  requested_by_name text null,
  change_type text not null,
  change_category text not null,
  severity text not null,
  resource_type text not null,
  resource_id uuid null,
  resource_name text null,
  action text not null,
  previous_value jsonb null,
  proposed_value jsonb null,
  change_description text not null,
  reason text null,
  justification text null,
  supporting_documents jsonb null,
  is_urgent boolean null default false,
  deadline timestamp with time zone null,
  status text null default 'pending'::text,
  reviewed_by_super_admin_id uuid null,
  reviewed_at timestamp with time zone null,
  review_notes text null,
  rejection_reason text null,
  auto_apply_on_approval boolean null default true,
  applied_at timestamp with time zone null,
  apply_error text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null default (now() + '7 days'::interval),
  constraint admin_pending_changes_pkey primary key (id),
  constraint admin_pending_changes_requested_by_admin_id_fkey foreign KEY (requested_by_admin_id) references admins (id) on delete set null,
  constraint admin_pending_changes_requested_by_email_fkey foreign KEY (requested_by_email) references profiles (email),
  constraint admin_pending_changes_requested_by_profile_id_fkey foreign KEY (requested_by_profile_id) references profiles (id) on delete set null,
  constraint admin_pending_changes_reviewed_by_super_admin_id_fkey foreign KEY (reviewed_by_super_admin_id) references chairmen (id) on delete set null,
  constraint admin_pending_changes_severity_check check (
    (
      severity = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'critical'::text
        ]
      )
    )
  ),
  constraint admin_pending_changes_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'expired'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pending_changes_status on public.admin_pending_changes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pending_changes_requested_by on public.admin_pending_changes using btree (requested_by_profile_id) TABLESPACE pg_default;

create index IF not exists idx_pending_changes_severity on public.admin_pending_changes using btree (severity) TABLESPACE pg_default;

create index IF not exists idx_pending_changes_created on public.admin_pending_changes using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_pending_changes_urgent on public.admin_pending_changes using btree (is_urgent) TABLESPACE pg_default
where
  (is_urgent = true);


create table public.admin_reports (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text not null,
  status text not null default 'generating'::text,
  file_url text null,
  file_size text null,
  generated_by uuid not null,
  created_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  constraint admin_reports_pkey primary key (id),
  constraint admin_reports_generated_by_fkey foreign KEY (generated_by) references auth.users (id),
  constraint admin_reports_generated_by_fkey1 foreign KEY (generated_by) references admins (id),
  constraint admin_reports_status_check check (
    (
      status = any (
        array['generating'::text, 'ready'::text, 'failed'::text]
      )
    )
  ),
  constraint admin_reports_type_check check (
    (
      type = any (
        array[
          'sales'::text,
          'inventory'::text,
          'customers'::text,
          'orders'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.admin_sessions (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  profile_id uuid not null,
  session_token text null,
  ip_address inet not null,
  user_agent text null,
  device_type text null,
  browser text null,
  os text null,
  location jsonb null,
  started_at timestamp with time zone not null default now(),
  last_activity_at timestamp with time zone null default now(),
  ended_at timestamp with time zone null,
  duration_seconds integer null,
  status text null default 'active'::text,
  logout_reason text null,
  created_at timestamp with time zone null default now(),
  constraint admin_sessions_pkey primary key (id),
  constraint admin_sessions_session_token_key unique (session_token),
  constraint admin_sessions_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE,
  constraint admin_sessions_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint admin_sessions_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'idle'::text,
          'ended'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_admin on public.admin_sessions using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_profile on public.admin_sessions using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_status on public.admin_sessions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_started on public.admin_sessions using btree (started_at desc) TABLESPACE pg_default;

create table public.admins (
  id uuid not null default gen_random_uuid (),
  profile_id uuid not null,
  department text null,
  permissions jsonb not null default '["dashboard", "users", "orders", "products", "settings"]'::jsonb,
  is_super_admin boolean not null default false,
  notes text null,
  last_login timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  total_sessions integer null default 0,
  total_time_spent_seconds bigint null default 0,
  last_session_id uuid null,
  last_ip_address inet null,
  last_location jsonb null,
  login_count integer null default 0,
  last_activity_at timestamp with time zone null,
  constraint admins_pkey primary key (id),
  constraint admins_profile_id_key unique (profile_id),
  constraint admins_last_session_id_fkey foreign KEY (last_session_id) references admin_sessions (id),
  constraint admins_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_admins_profile on public.admins using btree (profile_id) TABLESPACE pg_default;


create table public.ads (
  id uuid not null default gen_random_uuid (),
  campaign_id uuid not null,
  seller_id uuid not null,
  product_id uuid null,
  bid_amount numeric(10, 2) null default 0,
  status text null default 'active'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ads_pkey primary key (id),
  constraint ads_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id) on delete CASCADE,
  constraint ads_product_id_fkey foreign KEY (product_id) references products (id),
  constraint ads_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table public.ads (
  id uuid not null default gen_random_uuid (),
  campaign_id uuid not null,
  seller_id uuid not null,
  product_id uuid null,
  bid_amount numeric(10, 2) null default 0,
  status text null default 'active'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ads_pkey primary key (id),
  constraint ads_campaign_id_fkey foreign KEY (campaign_id) references ad_campaigns (id) on delete CASCADE,
  constraint ads_product_id_fkey foreign KEY (product_id) references products (id),
  constraint ads_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table public.app_settings (
  key text not null,
  value text not null,
  updated_at timestamp with time zone null default now(),
  constraint app_settings_pkey primary key (key)
) TABLESPACE pg_default;



create table public.ar_assets (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  variant_id uuid not null,
  asset_type text null,
  file_path text not null,
  public_url text null,
  file_size_bytes bigint null,
  format text null,
  status text null default 'processing'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint ar_assets_pkey primary key (id),
  constraint ar_assets_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint ar_assets_variant_id_fkey foreign KEY (variant_id) references product_variants (id),
  constraint ar_assets_asset_type_check check (
    (
      asset_type = any (
        array[
          '3d_model'::text,
          'tryon_config'::text,
          'texture'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  action text not null,
  resource text null,
  details jsonb null,
  created_at timestamp with time zone null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user on public.audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_created_at on public.audit_logs using btree (created_at desc) TABLESPACE pg_default;


create table public.cart_items (
  id uuid not null default gen_random_uuid (),
  cart_id uuid not null,
  product_id uuid not null,
  size text not null,
  quantity integer not null default 1,
  created_at timestamp with time zone null default now(),
  variant_id uuid not null,
  constraint cart_items_pkey primary key (id),
  constraint cart_items_cart_id_fkey foreign KEY (cart_id) references carts (id) on delete CASCADE,
  constraint cart_items_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint cart_items_variant_id_fkey foreign KEY (variant_id) references product_variants (id) on delete set null,
  constraint cart_items_quantity_check check ((quantity > 0))
) TABLESPACE pg_default;

create index IF not exists idx_cart_items_variant_id on public.cart_items using btree (variant_id) TABLESPACE pg_default;

create index IF not exists idx_cart_items_cart_id on public.cart_items using btree (cart_id) TABLESPACE pg_default;


create table public.carts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  session_id text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  abandoned_email_sent_at timestamp with time zone null,
  constraint carts_pkey primary key (id),
  constraint carts_user_id_key unique (user_id),
  constraint carts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint carts_user_id_fkey1 foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_carts_user_id on public.carts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_carts_session_id on public.carts using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_carts_updated_at on public.carts using btree (updated_at) TABLESPACE pg_default;


create table public.categories (
  id uuid not null default gen_random_uuid (),
  parent_id uuid not null,
  name text not null,
  slug text null,
  icon text null,
  sort_order integer null default 0,
  is_active boolean null default true,
  audiences text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  commission_rate numeric null default 10.0,
  tryon_enabled boolean null default true,
  is_restricted boolean null default false,
  sizing_guide text null,
  constraint categories_pkey primary key (id),
  constraint categories_parent_id_fkey foreign KEY (parent_id) references main_categories (id)
) TABLESPACE pg_default;

create index IF not exists idx_categories_parent on public.categories using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_categories_slug on public.categories using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_categories_active on public.categories using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_categories_slug_fast on public.categories using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_categories_parent_fast on public.categories using btree (parent_id) TABLESPACE pg_default;


create table public.chairman_audit_logs (
  id uuid not null default gen_random_uuid (),
  action text not null,
  category text not null,
  severity text not null,
  user_id uuid not null,
  target_resource text null,
  target_resource_id text null,
  previous_value jsonb null,
  new_value jsonb null,
  ip_address text not null,
  user_agent text null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint chairman_audit_logs_pkey primary key (id),
  constraint chairman_audit_logs_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint chairman_audit_logs_category_check check (
    (
      category = any (
        array[
          'auth'::text,
          'access'::text,
          'data'::text,
          'system'::text,
          'security'::text
        ]
      )
    )
  ),
  constraint chairman_audit_logs_severity_check check (
    (
      severity = any (
        array[
          'info'::text,
          'warning'::text,
          'critical'::text,
          'alert'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chairman_audit_user on public.chairman_audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_chairman_audit_category on public.chairman_audit_logs using btree (category) TABLESPACE pg_default;

create index IF not exists idx_chairman_audit_severity on public.chairman_audit_logs using btree (severity) TABLESPACE pg_default;

create index IF not exists idx_chairman_audit_created on public.chairman_audit_logs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_chairman_audit_action on public.chairman_audit_logs using btree (action) TABLESPACE pg_default;


create table public.chairman_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  ip_address text not null,
  user_agent text null,
  device_fingerprint text not null,
  created_at timestamp with time zone not null default now(),
  last_activity timestamp with time zone null default now(),
  expires_at timestamp with time zone not null,
  is_active boolean not null default true,
  mfa_verified boolean null default false,
  terminated_at timestamp with time zone null,
  termination_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  constraint chairman_sessions_pkey primary key (id),
  constraint chairman_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chairman_sessions_user on public.chairman_sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_chairman_sessions_active on public.chairman_sessions using btree (is_active, expires_at) TABLESPACE pg_default;

create index IF not exists idx_chairman_sessions_fingerprint on public.chairman_sessions using btree (device_fingerprint) TABLESPACE pg_default;


create table public.chairmen (
  id uuid not null default gen_random_uuid (),
  profile_id uuid not null,
  title text null default 'Chairman & CEO'::text,
  full_name text null,
  email text not null,
  phone text null,
  access_level text null default 'full'::text,
  can_override_all boolean null default true,
  company_role text null default 'Owner'::text,
  appointment_date timestamp with time zone null default now(),
  dashboard_widgets jsonb null default '["revenue", "users", "orders", "pending_approvals"]'::jsonb,
  notification_preferences jsonb null default '{"sms": true, "push": true, "email": true}'::jsonb,
  last_login timestamp with time zone null,
  last_ip_address inet null,
  last_device text null,
  previous_session_info jsonb null,
  total_logins integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  security_key_hash text null,
  totp_secret text null,
  is_totp_enabled boolean null default false,
  admin_id uuid null,
  constraint super_admins_pkey primary key (id),
  constraint super_admins_profile_id_key unique (profile_id),
  constraint super_admins_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE,
  constraint super_admins_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint super_admins_access_level_check check ((access_level = 'full'::text))
) TABLESPACE pg_default;


create table public.change_approval_rules (
  id uuid not null default gen_random_uuid (),
  change_type text not null,
  description text null,
  requires_approval boolean null default true,
  minimum_severity text null default 'high'::text,
  allowed_without_approval jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint change_approval_rules_pkey primary key (id),
  constraint change_approval_rules_change_type_key unique (change_type)
) TABLESPACE pg_default;



create table public.cms_content (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  content_type text not null default 'html'::text,
  location text not null,
  is_published boolean null default false,
  published_at timestamp with time zone null,
  published_by uuid not null,
  created_by uuid not null,
  modified_by uuid not null,
  version integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cms_content_pkey primary key (id),
  constraint cms_content_slug_key unique (slug),
  constraint cms_content_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint cms_content_modified_by_fkey foreign KEY (modified_by) references auth.users (id),
  constraint cms_content_published_by_fkey foreign KEY (published_by) references auth.users (id),
  constraint cms_content_content_type_check check (
    (
      content_type = any (
        array[
          'html'::text,
          'markdown'::text,
          'json'::text,
          'text'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_cms_content_slug on public.cms_content using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_cms_content_location on public.cms_content using btree (location) TABLESPACE pg_default;

create index IF not exists idx_cms_content_published on public.cms_content using btree (is_published) TABLESPACE pg_default;


create table public.cms_content_versions (
  id uuid not null default gen_random_uuid (),
  content_id uuid not null,
  version integer not null,
  content jsonb not null,
  modified_by uuid not null,
  created_at timestamp with time zone null default now(),
  constraint cms_content_versions_pkey primary key (id),
  constraint cms_content_versions_content_id_fkey foreign KEY (content_id) references cms_content (id) on delete CASCADE,
  constraint cms_content_versions_modified_by_fkey foreign KEY (modified_by) references auth.users (id),
  constraint cms_content_versions_modified_by_fkey1 foreign KEY (modified_by) references admins (id)
) TABLESPACE pg_default;

create index IF not exists idx_cms_versions_content on public.cms_content_versions using btree (content_id) TABLESPACE pg_default;


create table public.cms_menus (
  id uuid not null default gen_random_uuid (),
  location_key text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cms_menus_pkey primary key (id),
  constraint cms_menus_location_key_key unique (location_key)
) TABLESPACE pg_default;


create table public.collections (
  id uuid not null default gen_random_uuid (),
  title text not null,
  subtitle text null,
  image_url text not null,
  offer_text text null,
  link_url text not null default '/shop'::text,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint collections_pkey primary key (id),
  constraint collections_title_key unique (title)
) TABLESPACE pg_default;


create table public.content_blocks (
  id uuid not null default gen_random_uuid (),
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint content_blocks_pkey primary key (id),
  constraint content_blocks_section_key_key unique (section_key)
) TABLESPACE pg_default;


create table public.content_blocks (
  id uuid not null default gen_random_uuid (),
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint content_blocks_pkey primary key (id),
  constraint content_blocks_section_key_key unique (section_key)
) TABLESPACE pg_default;

create table public.copilot_messages (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint copilot_messages_pkey primary key (id),
  constraint copilot_messages_session_id_fkey foreign KEY (session_id) references copilot_sessions (id) on delete CASCADE,
  constraint copilot_messages_role_check check (
    (
      role = any (array['user'::text, 'assistant'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_copilot_messages_session on public.copilot_messages using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_copilot_messages_created on public.copilot_messages using btree (created_at) TABLESPACE pg_default;


create table public.copilot_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text null default 'New Chat'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint copilot_sessions_pkey primary key (id),
  constraint copilot_sessions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_copilot_sessions_user on public.copilot_sessions using btree (user_id) TABLESPACE pg_default;


create table public.coupons (
  id uuid not null default gen_random_uuid (),
  code text not null,
  store_id uuid null,
  discount_type public.discount_type not null default 'percentage'::discount_type,
  discount_value numeric(10, 2) not null,
  min_order_amount numeric(10, 2) null default 0,
  max_discount_amount numeric(10, 2) null,
  starts_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  usage_limit integer null,
  used_count integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint coupons_pkey primary key (id),
  constraint unique_code_store unique (code, store_id),
  constraint coupons_store_id_fkey foreign KEY (store_id) references stores (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_coupons_code on public.coupons using btree (upper(code)) TABLESPACE pg_default;


create table public.disputes (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  order_item_id uuid not null,
  user_id uuid not null,
  seller_id uuid not null,
  reason text not null,
  status text not null default 'open'::text,
  resolution_notes text null,
  refund_amount numeric(12, 2) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint disputes_pkey primary key (id),
  constraint disputes_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint disputes_order_item_id_fkey foreign KEY (order_item_id) references order_items (id),
  constraint disputes_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint disputes_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;


create table public.feature_flags (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  is_enabled boolean null default false,
  rollout_percentage integer null default 100,
  target_users jsonb null default '[]'::jsonb,
  target_roles text[] null default '{}'::text[],
  conditions jsonb null default '{}'::jsonb,
  modified_by uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint feature_flags_pkey primary key (id),
  constraint feature_flags_name_key unique (name),
  constraint feature_flags_modified_by_fkey foreign KEY (modified_by) references auth.users (id),
  constraint feature_flags_rollout_percentage_check check (
    (
      (rollout_percentage >= 0)
      and (rollout_percentage <= 100)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feature_flags_name on public.feature_flags using btree (name) TABLESPACE pg_default;

create index IF not exists idx_feature_flags_enabled on public.feature_flags using btree (is_enabled) TABLESPACE pg_default;



create table public.garment_assets (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  asset_url text not null,
  asset_type text not null default 'png'::text,
  layer_index integer not null default 2,
  config jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  category text null,
  anchor_points jsonb null default '{}'::jsonb,
  scale_rules jsonb null default '{"L": 1.04, "M": 1.0, "S": 0.96, "XL": 1.08, "XS": 0.92, "XXL": 1.12}'::jsonb,
  thumbnail_url text null,
  status text null default 'pending'::text,
  constraint garment_assets_pkey primary key (id),
  constraint garment_assets_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint garment_assets_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_garment_assets_category on public.garment_assets using btree (category) TABLESPACE pg_default;

create index IF not exists idx_garment_assets_layer on public.garment_assets using btree (layer_index) TABLESPACE pg_default;

create index IF not exists idx_garment_assets_product on public.garment_assets using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_garment_assets_status on public.garment_assets using btree (status) TABLESPACE pg_default
where
  (status = 'approved'::text);


  create table public.generations (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  product_id uuid null,
  image_url text null,
  status text not null default 'completed'::text,
  model_version text null default 'v2.1'::text,
  created_at timestamp with time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint generations_pkey primary key (id),
  constraint generations_product_id_fkey foreign KEY (product_id) references products (id) on delete set null,
  constraint generations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;


create table public.inventory (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  variant_id uuid not null,
  store_id uuid not null,
  quantity integer null default 0,
  reserved integer null default 0,
  low_stock_threshold integer not null default 5,
  sku text null,
  warehouse_id uuid not null,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint inventory_pkey primary key (id),
  constraint inventory_product_id_variant_id_store_id_key unique (product_id, variant_id, store_id),
  constraint inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint inventory_store_id_fkey foreign KEY (store_id) references stores (id),
  constraint inventory_variant_id_fkey foreign KEY (variant_id) references product_variants (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.inventory_logs (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  size text not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text not null,
  updated_by uuid not null,
  created_at timestamp with time zone null default now(),
  constraint inventory_logs_pkey primary key (id),
  constraint inventory_logs_product_id_fkey foreign KEY (product_id) references products (id) on delete set null,
  constraint inventory_logs_updated_by_fkey foreign KEY (updated_by) references profiles (id),
  constraint inventory_logs_updated_by_fkey1 foreign KEY (updated_by) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_inventory_logs_created on public.inventory_logs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_inventory_logs_product on public.inventory_logs using btree (product_id) TABLESPACE pg_default;


create table public.inventory_reservations (
  id uuid not null default gen_random_uuid (),
  size text not null default 'not null'::text,
  quantity integer not null,
  order_id uuid not null default gen_random_uuid (),
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  product_id uuid not null,
  constraint inventory_reservations_pkey primary key (order_id),
  constraint inventory_reservations_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint inventory_reservations_product_id_fkey foreign KEY (product_id) references products (id) on delete set null
) TABLESPACE pg_default;


create table public.ip_whitelist (
  id uuid not null default gen_random_uuid (),
  ip_address text not null,
  ip_range text null,
  description text null,
  created_by uuid null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint ip_whitelist_pkey primary key (id),
  constraint ip_whitelist_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint chk_ip_or_range check (
    (
      (ip_address is not null)
      or (ip_range is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ip_whitelist_active on public.ip_whitelist using btree (is_active) TABLESPACE pg_default;


create table public.login_attempts (
  id uuid not null default gen_random_uuid (),
  identifier text not null,
  ip_address text not null,
  created_at timestamp with time zone null default now(),
  user_id uuid not null default auth.uid (),
  constraint login_attempts_pkey primary key (id),
  constraint login_attempts_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_login_attempts_identifier on public.login_attempts using btree (identifier) TABLESPACE pg_default;

create index IF not exists idx_login_attempts_created on public.login_attempts using btree (created_at) TABLESPACE pg_default;


create table public.loyalty_transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  type text not null,
  points integer not null,
  description text null,
  order_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint loyalty_transactions_pkey primary key (id),
  constraint loyalty_transactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint loyalty_transactions_type_check check (
    (
      type = any (
        array[
          'earned'::text,
          'redeemed'::text,
          'expired'::text,
          'bonus'::text,
          'adjustment'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_loyalty_tx_user on public.loyalty_transactions using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_loyalty_tx_order on public.loyalty_transactions using btree (order_id) TABLESPACE pg_default
where
  (order_id is not null);


  create table public.main_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  image_url text null,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint main_categories_pkey primary key (id),
  constraint main_categories_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_main_categories_active on public.main_categories using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_main_categories_sort on public.main_categories using btree (sort_order) TABLESPACE pg_default;


create table public.marketing_campaigns (
  id uuid not null default gen_random_uuid (),
  store_id uuid not null,
  title text not null,
  type text null,
  status text null default 'draft'::text,
  target_audience text null default 'all'::text,
  content text null,
  subject text null,
  scheduled_for timestamp with time zone null,
  sent_at timestamp with time zone null,
  stats jsonb null default '{"sent": 0, "opened": 0, "clicked": 0}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketing_campaigns_pkey primary key (id),
  constraint marketing_campaigns_store_id_fkey foreign KEY (store_id) references stores (id),
  constraint marketing_campaigns_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'scheduled'::text,
          'sent'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint marketing_campaigns_type_check check (
    (
      type = any (
        array[
          'email'::text,
          'push'::text,
          'sms'::text,
          'notification'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid null,
  sender_id uuid null,
  is_from_store boolean null default false,
  content text not null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_messages_conversation on public.messages using btree (conversation_id) TABLESPACE pg_default;


create table public.mfa_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  totp_enabled boolean null default false,
  totp_secret text null,
  totp_verified_at timestamp with time zone null,
  backup_codes text[] null,
  backup_codes_used integer null default 0,
  recovery_email text null,
  recovery_phone text null,
  last_mfa_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint mfa_settings_pkey primary key (id),
  constraint mfa_settings_user_id_key unique (user_id),
  constraint mfa_settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_mfa_settings_user on public.mfa_settings using btree (user_id) TABLESPACE pg_default;



create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  type text not null,
  title text not null,
  message text null,
  link text null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user on public.notifications using btree (user_id, is_read, created_at desc) TABLESPACE pg_default;


create table public.operations_queue (
  id uuid not null default gen_random_uuid (),
  type text not null,
  status text null default 'pending'::text,
  priority integer null default 0,
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  description text null,
  metadata jsonb null default '{}'::jsonb,
  assigned_to uuid null,
  due_at timestamp with time zone null,
  sla_breached boolean null default false,
  resolved_at timestamp with time zone null,
  resolved_by uuid null,
  resolution_notes text null,
  resolution_type text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint operations_queue_pkey primary key (id),
  constraint operations_queue_assigned_to_fkey foreign KEY (assigned_to) references auth.users (id),
  constraint operations_queue_resolved_by_fkey foreign KEY (resolved_by) references auth.users (id),
  constraint operations_queue_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in_progress'::text,
          'resolved'::text,
          'escalated'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ops_queue_sla on public.operations_queue using btree (due_at) TABLESPACE pg_default
where
  (
    (status = 'pending'::text)
    and (due_at is not null)
  );

create index IF not exists idx_ops_queue_status_priority on public.operations_queue using btree (status, priority desc, created_at) TABLESPACE pg_default;

create index IF not exists idx_ops_queue_type on public.operations_queue using btree (type, status) TABLESPACE pg_default;

create index IF not exists idx_ops_queue_assigned on public.operations_queue using btree (assigned_to) TABLESPACE pg_default
where
  (assigned_to is not null);

create index IF not exists idx_ops_queue_entity on public.operations_queue using btree (entity_type, entity_id) TABLESPACE pg_default;


create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  seller_id uuid not null,
  store_id uuid not null,
  product_id uuid not null,
  variant_id uuid not null,
  product_snapshot jsonb null default '{}'::jsonb,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  commission_rate numeric(5, 2) null default 0,
  commission_amount numeric(12, 2) null default 0,
  seller_amount numeric(12, 2) not null default 0,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_items_product_id_fkey foreign KEY (product_id) references products (id),
  constraint order_items_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint order_items_store_id_fkey foreign KEY (store_id) references stores (id),
  constraint order_items_variant_id_fkey foreign KEY (variant_id) references product_variants (id)
) TABLESPACE pg_default;

create index IF not exists idx_order_items_product_order on public.order_items using btree (product_id, order_id) TABLESPACE pg_default;


create table public.order_status_history (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  order_item_id uuid not null,
  previous_status text not null,
  new_status text not null,
  changed_by uuid not null,
  notes text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint order_status_history_pkey primary key (id),
  constraint order_status_history_changed_by_fkey foreign KEY (changed_by) references auth.users (id),
  constraint order_status_history_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_status_history_order_item_id_fkey foreign KEY (order_item_id) references order_items (id)
) TABLESPACE pg_default;


create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  address_id uuid not null,
  items jsonb null,
  total_amount numeric(10, 2) not null,
  status text not null default 'placed'::text,
  payment_method text not null,
  payment_status text not null default 'pending'::text,
  cancellation_reason text not null,
  shipping_address jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  store_id uuid not null,
  tracking_number text not null,
  coupon_code text null,
  discount_amount numeric(10, 2) null default 0,
  order_number text not null,
  is_paid boolean not null default false,
  confirmed_at timestamp with time zone null,
  shipped_at timestamp with time zone null,
  delivered_at timestamp with time zone null,
  fulfillment_status text null default 'unfulfilled'::text,
  warehouse_id uuid null,
  shipping_cost numeric(10, 2) null default 0,
  tax_amount numeric(10, 2) null default 0,
  constraint orders_pkey primary key (id),
  constraint orders_order_number_key unique (order_number),
  constraint orders_address_id_fkey foreign KEY (address_id) references addresses (id),
  constraint orders_store_id_fkey foreign KEY (store_id) references stores (id) on delete set null,
  constraint orders_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint orders_warehouse_id_fkey foreign KEY (warehouse_id) references seller_warehouses (id),
  constraint orders_fulfillment_status_check check (
    (
      fulfillment_status = any (
        array[
          'unfulfilled'::text,
          'packing'::text,
          'ready_to_ship'::text,
          'shipped'::text,
          'delivered'::text,
          'returned'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_user_id on public.orders using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_store on public.orders using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at_desc on public.orders using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_status_created on public.orders using btree (status, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_store_created on public.orders using btree (store_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_store_status on public.orders using btree (store_id, status) TABLESPACE pg_default;

create index IF not exists idx_orders_order_number on public.orders using btree (order_number) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;


create table public.page_views (
  id uuid not null default gen_random_uuid (),
  path text not null,
  user_id uuid not null,
  session_id text null,
  user_agent text null,
  referrer text null,
  created_at timestamp with time zone null default now(),
  page_path text null,
  device_type text null default 'desktop'::text,
  traffic_source text null default 'direct'::text,
  ip_address inet null,
  country text null,
  city text null,
  constraint page_views_pkey primary key (id),
  constraint page_views_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_page_views_path_date on public.page_views using btree (page_path, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_page_views_path on public.page_views using btree (path, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_page_views_date on public.page_views using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_page_views_created on public.page_views using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_page_views_user on public.page_views using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_page_views_seller_date on public.page_views using btree (user_id, created_at desc) TABLESPACE pg_default;


create table public.payment_commissions (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  order_item_id uuid not null,
  seller_id uuid not null,
  order_amount numeric(12, 2) not null,
  commission_rate numeric(5, 4) not null,
  commission_amount numeric(12, 2) not null,
  commission_tax_rate numeric(5, 4) null default 0.18,
  commission_tax_amount numeric(12, 2) not null,
  total_deduction numeric(12, 2) not null,
  seller_net_amount numeric(12, 2) not null,
  status text not null default 'pending'::text,
  deducted_at timestamp with time zone not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint payment_commissions_pkey primary key (id),
  constraint payment_commissions_order_id_fkey foreign KEY (order_id) references orders (id) on delete RESTRICT,
  constraint payment_commissions_order_item_id_fkey foreign KEY (order_item_id) references order_items (id) on delete RESTRICT,
  constraint payment_commissions_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete RESTRICT,
  constraint payment_commissions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'deducted'::text,
          'reversed'::text,
          'adjusted'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_commissions_order_id on public.payment_commissions using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_commissions_seller_id on public.payment_commissions using btree (seller_id) TABLESPACE pg_default;

create index IF not exists idx_payment_commissions_status on public.payment_commissions using btree (status) TABLESPACE pg_default;


create table public.payment_methods (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  method_type text not null,
  gateway text not null,
  gateway_token text not null,
  card_last_four text null,
  card_brand text null,
  card_expiry_month integer null,
  card_expiry_year integer null,
  card_holder_name text not null,
  upi_id text null,
  bank_code text null,
  bank_name text null,
  display_name text null,
  is_default boolean null default false,
  is_verified boolean null default false,
  is_active boolean null default true,
  last_used_at timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint payment_methods_pkey primary key (id),
  constraint payment_methods_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint payment_methods_method_type_check check (
    (
      method_type = any (
        array[
          'card'::text,
          'upi'::text,
          'netbanking'::text,
          'wallet'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_user_id on public.payment_methods using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_is_default on public.payment_methods using btree (is_default) TABLESPACE pg_default
where
  (is_default = true);


create table public.payment_webhooks (
  id uuid not null default gen_random_uuid (),
  gateway text not null,
  event_type text not null,
  event_id text null,
  payload jsonb not null,
  processed boolean null default false,
  processed_at timestamp with time zone null,
  processing_error text null,
  payment_id uuid null,
  received_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint payment_webhooks_pkey primary key (id),
  constraint payment_webhooks_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_payment_webhooks_gateway on public.payment_webhooks using btree (gateway) TABLESPACE pg_default;

create index IF not exists idx_payment_webhooks_event_type on public.payment_webhooks using btree (event_type) TABLESPACE pg_default;

create index IF not exists idx_payment_webhooks_processed on public.payment_webhooks using btree (processed) TABLESPACE pg_default
where
  (processed = false);

create index IF not exists idx_payment_webhooks_received_at on public.payment_webhooks using btree (received_at desc) TABLESPACE pg_default;


create table public.payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  amount numeric(10, 2) not null,
  currency text null default 'INR'::text,
  gateway text not null default 'razorpay'::text,
  gateway_payment_id text not null,
  gateway_order_id text not null,
  status public.payment_status not null default 'pending'::payment_status,
  method text not null,
  error_code text null,
  error_description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  related_orders uuid[] null default '{}'::uuid[],
  constraint payments_pkey primary key (id),
  constraint payments_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint payments_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_payments_gateway_payment_id on public.payments using btree (gateway_payment_id) TABLESPACE pg_default;

create index IF not exists idx_payments_gateway_order_id on public.payments using btree (gateway_order_id) TABLESPACE pg_default;

create index IF not exists idx_payments_order_id on public.payments using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payments_user_id on public.payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payments_related_orders on public.payments using gin (related_orders) TABLESPACE pg_default;

create index IF not exists idx_payments_status on public.payments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payments_created_at on public.payments using btree (created_at desc) TABLESPACE pg_default;

create table public.payouts (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  wallet_id uuid not null,
  payout_number text not null,
  amount numeric(12, 2) not null,
  currency text null default 'INR'::text,
  status text not null default 'pending'::text,
  bank_snapshot jsonb null,
  transaction_reference text not null,
  period_start timestamp with time zone null,
  period_end timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint payouts_pkey primary key (id),
  constraint payouts_payout_number_key unique (payout_number),
  constraint payouts_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint payouts_wallet_id_fkey foreign KEY (wallet_id) references wallets (id),
  constraint payouts_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.platform_fees (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  store_id uuid not null,
  total_amount numeric(10, 2) not null,
  platform_commission numeric(10, 2) null default 0,
  payment_gateway_fee numeric(10, 2) not null default 0,
  logistics_fee numeric(10, 2) not null default 0,
  tax_on_fees numeric(10, 2) not null default 0,
  seller_payout_amount numeric(10, 2) not null,
  created_at timestamp with time zone null default now(),
  constraint platform_fees_pkey primary key (id),
  constraint platform_fees_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint platform_fees_store_id_fkey foreign KEY (store_id) references stores (id)
) TABLESPACE pg_default;

create index IF not exists idx_platform_fees_store_id on public.platform_fees using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_platform_fees_order_id on public.platform_fees using btree (order_id) TABLESPACE pg_default;


create table public.platform_rules (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  rule_type text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_active boolean null default true,
  priority integer null default 0,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint platform_rules_pkey primary key (id),
  constraint platform_rules_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint platform_rules_updated_by_fkey foreign KEY (updated_by) references auth.users (id),
  constraint platform_rules_rule_type_check check (
    (
      rule_type = any (
        array[
          'commerce'::text,
          'shipping'::text,
          'security'::text,
          'automation'::text,
          'notification'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_platform_rules_active on public.platform_rules using btree (is_active, priority desc) TABLESPACE pg_default;

create index IF not exists idx_platform_rules_type on public.platform_rules using btree (rule_type) TABLESPACE pg_default;


create table public.platform_settings (
  id uuid not null default gen_random_uuid (),
  category text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  value_type text not null default 'string'::text,
  label text not null,
  description text null,
  is_active boolean null default true,
  is_public boolean null default false,
  requires_restart boolean null default false,
  modified_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  constraint platform_settings_pkey primary key (id),
  constraint platform_settings_category_key_key unique (category, key),
  constraint platform_settings_created_by_fkey foreign KEY (created_by) references admins (profile_id),
  constraint platform_settings_modified_by_fkey foreign KEY (modified_by) references auth.users (id),
  constraint platform_settings_value_type_check check (
    (
      value_type = any (
        array[
          'string'::text,
          'number'::text,
          'boolean'::text,
          'json'::text,
          'array'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_platform_settings_category on public.platform_settings using btree (category) TABLESPACE pg_default;

create index IF not exists idx_platform_settings_key on public.platform_settings using btree (key) TABLESPACE pg_default;

create index IF not exists idx_platform_settings_active on public.platform_settings using btree (is_active) TABLESPACE pg_default;


create table public.price_alerts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  product_id uuid not null,
  variant_id uuid null,
  target_price numeric(10, 2) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  last_notified_at timestamp with time zone null,
  constraint price_alerts_pkey primary key (id),
  constraint price_alerts_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint price_alerts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_price_alerts_user on public.price_alerts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_price_alerts_product on public.price_alerts using btree (product_id) TABLESPACE pg_default;


create table public.product_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  image_url text not null,
  discount_text text null,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint product_categories_pkey primary key (id),
  constraint product_categories_slug_key unique (slug)
) TABLESPACE pg_default;


create table public.product_images (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  variant_id uuid not null,
  url text not null,
  alt_text text null,
  display_order integer null default 0,
  is_primary boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint product_images_pkey primary key (id),
  constraint product_images_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_images_variant_id_fkey foreign KEY (variant_id) references product_variants (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.product_inventory (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  size text not null,
  stock integer null default 0,
  updated_at timestamp with time zone null default now(),
  store_id uuid not null,
  measurements jsonb null default '{}'::jsonb,
  variant_id uuid null,
  warehouse_id uuid null,
  color text null,
  sku text null,
  barcode text null,
  constraint product_inventory_pkey primary key (id, product_id),
  constraint product_inventory_product_id_size_color_key unique (product_id, size, color),
  constraint product_inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_inventory_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint product_inventory_variant_id_fkey foreign KEY (variant_id) references product_variants (id)
) TABLESPACE pg_default;

create index IF not exists idx_inventory_variant_id on public.product_inventory using btree (variant_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_warehouse on public.product_inventory using btree (warehouse_id) TABLESPACE pg_default;

create index IF not exists idx_product_inventory_product_id on public.product_inventory using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_store on public.product_inventory using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_product_inventory_warehouse on public.product_inventory using btree (warehouse_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_store_stock on public.product_inventory using btree (store_id, stock) TABLESPACE pg_default
where
  (stock < 10);

create index IF not exists product_inventory_barcode_idx on public.product_inventory using btree (barcode) TABLESPACE pg_default;


create table public.product_media (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  url text not null,
  media_type text not null,
  storage_path text null,
  position integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint product_media_pkey primary key (id),
  constraint product_media_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_media_media_type_check check (
    (
      media_type = any (array['image'::text, 'video'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_media_product_id on public.product_media using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_media_sort on public.product_media using btree (product_id, "position") TABLESPACE pg_default;


create table public.product_relations (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  related_product_id uuid not null,
  relation_type text not null,
  confidence numeric(3, 2) null default 1.0,
  source text null default 'manual'::text,
  created_at timestamp with time zone null default now(),
  constraint product_relations_pkey primary key (id),
  constraint product_relations_product_id_related_product_id_relation_ty_key unique (product_id, related_product_id, relation_type),
  constraint product_relations_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_relations_related_product_id_fkey foreign KEY (related_product_id) references products (id) on delete CASCADE,
  constraint product_relations_relation_type_check check (
    (
      relation_type = any (
        array[
          'matches'::text,
          'similar_style'::text,
          'complete_the_look'::text,
          'often_bought_with'::text,
          'same_collection'::text
        ]
      )
    )
  ),
  constraint product_relations_source_check check (
    (
      source = any (
        array['manual'::text, 'ai'::text, 'sales_pattern'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_relations_product on public.product_relations using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_relations_type on public.product_relations using btree (relation_type) TABLESPACE pg_default;


create table public.product_variants (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  sku text null,
  name text null,
  color text null,
  size text null,
  material text null,
  style text null,
  price_adjustment numeric(12, 2) null default 0,
  image_url text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint product_variants_pkey primary key (id),
  constraint product_variants_sku_key unique (sku),
  constraint product_variants_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_variants_attrs on public.product_variants using btree (product_id, color, size) TABLESPACE pg_default;


create table public.products (
  id uuid not null default gen_random_uuid (),
  name text not null,
  price numeric(10, 2) not null,
  compare_price numeric(10, 2) not null,
  image text not null,
  images text[] null,
  category text not null,
  description text null,
  sizes text[] not null default array[
    'XS'::text,
    'S'::text,
    'M'::text,
    'L'::text,
    'XL'::text,
    'XXL'::text
  ],
  material text not null,
  care_instructions text null,
  rating numeric null default 0,
  review_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  store_id uuid not null,
  videos text[] null default '{}'::text[],
  tryon_asset_ref uuid null,
  physics_profile jsonb null default '{"friction": 0.3, "stiffness": 0.5, "stretch_factor": 0.1, "fabric_weight_gsm": 200}'::jsonb,
  category_id uuid null,
  rating_avg numeric(3, 2) null default 0,
  rating_count integer null default 0,
  sub_category_id uuid null,
  gender text null default 'unisex'::text,
  seller_id uuid null,
  slug text null,
  sku text null,
  base_price numeric(12, 2) null,
  sale_price numeric(12, 2) null,
  is_deleted boolean null default false,
  color text null,
  brand text null,
  pattern text null,
  occasion text null,
  sleeve_length text null,
  neck_type text null,
  fit text null,
  hsn_code text null,
  tax_rate numeric(5, 2) null default 0,
  country_of_origin text null,
  manufacturer_details jsonb null,
  packer_details jsonb null,
  importer_details jsonb null,
  weight_kg numeric(10, 3) null,
  dimensions jsonb null,
  warranty_period text null,
  warranty_summary text null,
  is_returnable boolean null default true,
  return_period_days integer null default 7,
  is_cod_allowed boolean null default true,
  owner_type text null default 'platform'::text,
  owner_id uuid null,
  seo_title text null,
  seo_description text null,
  tags text[] null default array[]::text[],
  image_url text GENERATED ALWAYS as (images[1]) STORED null,
  age_group text null,
  constraint products_pkey primary key (id),
  constraint products_sku_key unique (sku),
  constraint products_id_key unique (id),
  constraint products_tryon_asset_ref_fkey foreign KEY (tryon_asset_ref) references garment_assets (id),
  constraint products_owner_id_fkey foreign KEY (owner_id) references sellers (id),
  constraint products_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete set null,
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint products_store_id_fkey foreign KEY (store_id) references stores (id) on delete set null,
  constraint products_sub_category_id_fkey foreign KEY (sub_category_id) references sub_categories (id),
  constraint products_owner_type_check check (
    (
      owner_type = any (array['platform'::text, 'seller'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_products_category_gender on public.products using btree (category, gender) TABLESPACE pg_default;

create index IF not exists idx_products_category on public.products using btree (category) TABLESPACE pg_default;

create index IF not exists idx_products_created_at_active on public.products using btree (created_at desc) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_rating_active on public.products using btree (rating desc) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_category_price on public.products using btree (category_id, price) TABLESPACE pg_default;

create index IF not exists idx_products_store_id on public.products using btree (store_id) TABLESPACE pg_default;

create index IF not exists products_slug_idx on public.products using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_products_owner on public.products using btree (owner_type, owner_id) TABLESPACE pg_default;

create index IF not exists idx_products_store on public.products using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_products_created_active on public.products using btree (created_at desc) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_price_sort on public.products using btree (price) TABLESPACE pg_default;

create index IF not exists idx_products_rating_sort on public.products using btree (rating desc) TABLESPACE pg_default;

create index IF not exists idx_products_sub_category on public.products using btree (sub_category_id) TABLESPACE pg_default;

create index IF not exists idx_products_gender on public.products using btree (gender) TABLESPACE pg_default;

create index IF not exists idx_products_seller_id on public.products using btree (seller_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_products_slug on public.products using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_products_sub_category_id on public.products using btree (sub_category_id) TABLESPACE pg_default;

create index IF not exists idx_products_rating on public.products using btree (rating desc) TABLESPACE pg_default;

create index IF not exists idx_products_age_group on public.products using btree (age_group) TABLESPACE pg_default;



create table public.profiles (
  id uuid not null,
  email text not null,
  display_name text null,
  avatar_url text null,
  phone text null,
  role text null default 'customer'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  full_name text null,
  welcome_email_sent_at timestamp with time zone null,
  loyalty_points integer null default 0,
  tier text null default 'Bronze'::text,
  lifetime_points integer null default 0,
  current_streak integer null default 0,
  last_checkin timestamp with time zone null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_email_key1 unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_tier_check check (
    (
      tier = any (
        array[
          'Bronze'::text,
          'Silver'::text,
          'Gold'::text,
          'Platinum'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_role on public.profiles using btree (role) TABLESPACE pg_default;

create index IF not exists idx_profiles_loyalty_points on public.profiles using btree (loyalty_points desc) TABLESPACE pg_default
where
  (loyalty_points > 0);

create index IF not exists idx_profiles_created_at on public.profiles using btree (created_at desc) TABLESPACE pg_default;


create table public.quick_actions (
  id uuid not null default gen_random_uuid (),
  name text not null,
  label text not null,
  description text null,
  action_type text not null,
  target text not null,
  icon text null,
  color text null,
  is_enabled boolean null default true,
  requires_confirmation boolean null default false,
  confirmation_message text null,
  roles_allowed text[] null default '{super_admin,admin}'::text[],
  sort_order integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint quick_actions_pkey primary key (id),
  constraint quick_actions_name_key unique (name),
  constraint quick_actions_action_type_check check (
    (
      action_type = any (
        array[
          'toggle'::text,
          'trigger'::text,
          'navigate'::text,
          'api_call'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.rate_limit_logs (
  id uuid not null default gen_random_uuid (),
  identifier text not null,
  action text not null,
  created_at timestamp with time zone null default now(),
  constraint rate_limit_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_rate_limit_identifier on public.rate_limit_logs using btree (identifier, action) TABLESPACE pg_default;

create index IF not exists idx_rate_limit_created on public.rate_limit_logs using btree (created_at) TABLESPACE pg_default;


create table public.referral_usages (
  id uuid not null default gen_random_uuid (),
  referrer_id uuid not null,
  referred_user_id uuid not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  constraint referral_usages_pkey primary key (id),
  constraint referral_usages_referred_user_id_key unique (referred_user_id),
  constraint referral_usages_referred_user_id_fkey foreign KEY (referred_user_id) references profiles (id),
  constraint referral_usages_referrer_id_fkey foreign KEY (referrer_id) references profiles (id),
  constraint referral_usages_status_check check (
    (
      status = any (array['pending'::text, 'completed'::text])
    )
  )
) TABLESPACE pg_default;


create table public.referrals (
  code text not null,
  owner_id uuid not null,
  usage_count integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint referrals_pkey primary key (code),
  constraint referrals_owner_id_key unique (owner_id),
  constraint referrals_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.refunds (
  id uuid not null default gen_random_uuid (),
  refund_number text not null,
  payment_id uuid not null,
  order_id uuid not null,
  return_id uuid not null,
  gateway_refund_id text not null,
  amount numeric(12, 2) not null,
  currency text null default 'INR'::text,
  refund_type text not null,
  status text null default 'pending'::text,
  failure_reason text null,
  processed_at timestamp with time zone null,
  reason text null,
  internal_notes text null,
  initiated_by uuid null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint refunds_pkey primary key (id),
  constraint refunds_refund_number_key unique (refund_number),
  constraint refunds_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete RESTRICT,
  constraint refunds_initiated_by_fkey foreign KEY (initiated_by) references auth.users (id),
  constraint refunds_order_id_fkey foreign KEY (order_id) references orders (id) on delete RESTRICT,
  constraint refunds_return_id_fkey foreign KEY (return_id) references returns (id) on delete set null,
  constraint refunds_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint refunds_refund_type_check check (
    (
      refund_type = any (
        array[
          'full'::text,
          'partial'::text,
          'cancellation'::text,
          'return'::text,
          'dispute'::text,
          'goodwill'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_refunds_payment_id on public.refunds using btree (payment_id) TABLESPACE pg_default;

create index IF not exists idx_refunds_order_id on public.refunds using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_refunds_return_id on public.refunds using btree (return_id) TABLESPACE pg_default;

create index IF not exists idx_refunds_status on public.refunds using btree (status) TABLESPACE pg_default;


create table public.return_items (
  id uuid not null default gen_random_uuid (),
  return_id uuid not null,
  order_item_id uuid not null,
  quantity integer not null default 1,
  condition text null,
  status text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  seller_id uuid not null,
  images text[] null default '{}'::text[],
  comment text null,
  constraint return_items_pkey primary key (id),
  constraint return_items_order_item_id_fkey foreign KEY (order_item_id) references order_items (id),
  constraint return_items_return_id_fkey foreign KEY (return_id) references returns (id) on delete CASCADE,
  constraint return_items_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;



create table public.returns (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  reason text not null,
  description text null,
  status text null default 'requested'::text,
  admin_notes text null,
  refund_amount numeric(12, 2) null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  metadata jsonb null default '{}'::jsonb,
  seller_id uuid not null,
  constraint returns_pkey primary key (id),
  constraint returns_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint returns_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint returns_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;


create table public.reviews (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  product_id uuid not null,
  rating integer not null,
  title text null,
  content text null,
  images text[] null,
  verified_purchase boolean null default false,
  is_approved boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  seller_reply text null,
  replied_at timestamp with time zone null,
  fit_rating text null,
  size_purchased text null,
  helpful_votes integer null default 0,
  constraint reviews_pkey primary key (id),
  constraint reviews_product_id_fkey foreign KEY (product_id) references products (id),
  constraint reviews_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint reviews_fit_rating_check check (
    (
      fit_rating = any (
        array[
          'runs_small'::text,
          'true_to_size'::text,
          'runs_large'::text
        ]
      )
    )
  ),
  constraint reviews_rating_check1 check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_reviews_product_id on public.reviews using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_reviews_product on public.reviews using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_reviews_user on public.reviews using btree (user_id) TABLESPACE pg_default;


create table public.search_index (
  product_id uuid not null,
  store_id uuid not null,
  title text not null,
  description text null,
  category text null,
  tags text[] null,
  price numeric null,
  sizes text[] null,
  is_in_stock boolean null default true,
  is_tryon_enabled boolean null default false,
  boost_score integer null default 0,
  search_vector tsvector null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  category_slug text null,
  gender text null,
  color text null,
  brand text null,
  rating numeric null default 0,
  review_count integer null default 0,
  pattern text null,
  occasion text null,
  sleeve_length text null,
  neck_type text null,
  fit text null,
  material text null,
  age_group text null,
  constraint search_index_pkey primary key (product_id),
  constraint search_index_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_search_index_store_price on public.search_index using btree (store_id, price) TABLESPACE pg_default;

create index IF not exists idx_search_index_category_slug on public.search_index using btree (category_slug) TABLESPACE pg_default;

create index IF not exists idx_search_index_gender on public.search_index using btree (gender) TABLESPACE pg_default;

create index IF not exists idx_search_index_color on public.search_index using btree (color) TABLESPACE pg_default;

create index IF not exists idx_search_index_brand on public.search_index using btree (brand) TABLESPACE pg_default;

create index IF not exists idx_search_index_sizes on public.search_index using gin (sizes) TABLESPACE pg_default;

create index IF not exists idx_search_index_created_at on public.search_index using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_search_index_rating on public.search_index using btree (rating) TABLESPACE pg_default;

create index IF not exists idx_search_index_price on public.search_index using btree (price) TABLESPACE pg_default;

create index IF not exists idx_search_index_pattern on public.search_index using btree (pattern) TABLESPACE pg_default;

create index IF not exists idx_search_index_occasion on public.search_index using btree (occasion) TABLESPACE pg_default;

create index IF not exists idx_search_index_sleeve on public.search_index using btree (sleeve_length) TABLESPACE pg_default;

create index IF not exists idx_search_index_neck on public.search_index using btree (neck_type) TABLESPACE pg_default;

create index IF not exists idx_search_index_fit on public.search_index using btree (fit) TABLESPACE pg_default;

create index IF not exists idx_search_index_material on public.search_index using btree (material) TABLESPACE pg_default;

create index IF not exists idx_search_index_age_group on public.search_index using btree (age_group) TABLESPACE pg_default;


create table public.search_logs (
  id uuid not null default gen_random_uuid (),
  query text not null,
  user_id uuid not null,
  results_count integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint search_logs_pkey primary key (id),
  constraint search_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint search_logs_user_id_fkey1 foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_search_logs_query on public.search_logs using btree (query) TABLESPACE pg_default;

create index IF not exists idx_search_logs_created_at on public.search_logs using btree (created_at) TABLESPACE pg_default;


create table public.search_synonyms (
  id uuid not null default gen_random_uuid (),
  term text not null,
  synonyms text[] not null,
  created_at timestamp with time zone null default now(),
  constraint search_synonyms_pkey primary key (id),
  constraint search_synonyms_term_key unique (term)
) TABLESPACE pg_default;


create table public.security_alerts (
  id uuid not null default gen_random_uuid (),
  alert_type text not null,
  severity text not null,
  title text not null,
  description text null,
  user_id uuid null,
  ip_address text null,
  is_resolved boolean null default false,
  resolved_by uuid null,
  resolved_at timestamp with time zone null,
  resolution_notes text null,
  created_at timestamp with time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint security_alerts_pkey primary key (id),
  constraint security_alerts_resolved_by_fkey foreign KEY (resolved_by) references auth.users (id),
  constraint security_alerts_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint security_alerts_severity_check check (
    (
      severity = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'critical'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_security_alerts_unresolved on public.security_alerts using btree (is_resolved, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_security_alerts_severity on public.security_alerts using btree (severity) TABLESPACE pg_default;


create table public.security_keys (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  key_type text not null,
  key_hash text not null,
  salt text not null,
  created_at timestamp with time zone null default now(),
  last_used_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  usage_count integer null default 0,
  max_uses integer null,
  constraint security_keys_pkey primary key (id),
  constraint security_keys_user_id_key_type_key unique (user_id, key_type),
  constraint security_keys_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint security_keys_key_type_check check (
    (
      key_type = any (
        array[
          'master'::text,
          'backup'::text,
          'recovery'::text,
          'api'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_security_keys_user on public.security_keys using btree (user_id) TABLESPACE pg_default;


create table public.seller_bank_details (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  account_holder_name text not null,
  account_number text not null,
  ifsc_code text not null,
  bank_name text not null,
  branch_name text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_verified boolean null default false,
  is_default boolean null default false,
  constraint seller_bank_details_pkey primary key (id, account_number),
  constraint seller_bank_details_account_number_key unique (account_number),
  constraint seller_bank_details_seller_id_key unique (seller_id),
  constraint seller_bank_details_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete CASCADE
) TABLESPACE pg_default;



create table public.seller_documents (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  document_type text not null,
  url text not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null,
  constraint seller_documents_pkey primary key (id),
  constraint seller_documents_seller_id_key unique (seller_id),
  constraint seller_documents_url_key unique (url),
  constraint seller_documents_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.seller_payouts (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  store_id uuid not null,
  amount numeric(10, 2) not null,
  period_start timestamp with time zone null,
  period_end timestamp with time zone null,
  transaction_reference text null,
  status public.payout_status null default 'pending'::payout_status,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  wallet_id uuid null,
  bank_snapshot jsonb null,
  payout_number text null,
  constraint seller_payouts_pkey primary key (id),
  constraint seller_payouts_seller_id_fkey foreign KEY (seller_id) references profiles (id),
  constraint seller_payouts_store_id_fkey foreign KEY (store_id) references stores (id),
  constraint seller_payouts_wallet_id_fkey foreign KEY (wallet_id) references wallets (id)
) TABLESPACE pg_default;

create index IF not exists idx_seller_payouts_store on public.seller_payouts using btree (store_id) TABLESPACE pg_default;

create index IF not exists idx_seller_payouts_status on public.seller_payouts using btree (status) TABLESPACE pg_default;



create table public.seller_performance (
  seller_id uuid not null,
  risk_score integer null default 0,
  risk_level text GENERATED ALWAYS as (
    case
      when (risk_score < 20) then 'low'::text
      when (risk_score < 50) then 'medium'::text
      when (risk_score < 80) then 'high'::text
      else 'critical'::text
    end
  ) STORED null,
  return_rate numeric(5, 2) null default 0.00,
  cancellation_rate numeric(5, 2) null default 0.00,
  late_shipment_rate numeric(5, 2) null default 0.00,
  customer_rating numeric(3, 2) null default 5.00,
  total_sales numeric(15, 2) null default 0,
  total_payouts numeric(15, 2) null default 0,
  pending_payouts numeric(15, 2) null default 0,
  dispute_count integer null default 0,
  last_audit_date timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  constraint seller_performance_pkey primary key (seller_id),
  constraint seller_performance_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete CASCADE,
  constraint seller_performance_customer_rating_check check (
    (
      (customer_rating >= (0)::numeric)
      and (customer_rating <= (5)::numeric)
    )
  ),
  constraint seller_performance_risk_score_check check (
    (
      (risk_score >= 0)
      and (risk_score <= 100)
    )
  ),
  constraint valid_rates check (
    (
      (return_rate >= (0)::numeric)
      and (return_rate <= (100)::numeric)
      and (cancellation_rate >= (0)::numeric)
      and (cancellation_rate <= (100)::numeric)
      and (late_shipment_rate >= (0)::numeric)
      and (late_shipment_rate <= (100)::numeric)
    )
  )
) TABLESPACE pg_default;


create table public.seller_permissions (
  id uuid not null default gen_random_uuid (),
  staff_id uuid null,
  permission text not null,
  created_at timestamp with time zone null default now(),
  constraint seller_permissions_pkey primary key (id),
  constraint seller_permissions_staff_id_fkey foreign KEY (staff_id) references seller_staff (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.seller_profiles (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  business_name text null,
  business_address jsonb null default '{}'::jsonb,
  support_email text null,
  support_phone text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint seller_profiles_pkey primary key (id),
  constraint seller_profiles_seller_id_key unique (seller_id),
  constraint seller_profiles_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.seller_settings (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  store_name text not null,
  support_email text null,
  support_phone text null,
  selling_enabled boolean null default true,
  cod_enabled boolean null default true,
  enable_upi boolean null default true,
  low_stock_threshold integer not null default 5,
  allow_backorders boolean null default false,
  auto_disable_on_zero boolean null default true,
  inventory_locked boolean not null default false,
  confirm_large_changes_above integer not null default 10,
  disabled_categories text[] null,
  default_processing_days integer null default 2,
  order_cutoff_time text null default '16:00'::text,
  require_change_reason boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  global_discount numeric(5, 2) not null default '5'::numeric,
  discount_type text null,
  discount_start timestamp with time zone null,
  discount_end timestamp with time zone null,
  processing_days text[] null,
  gstin text null,
  pickup_address_id uuid null,
  constraint seller_settings_pkey primary key (id, seller_id),
  constraint seller_settings_id_key unique (id),
  constraint seller_settings_seller_id_key unique (seller_id),
  constraint seller_settings_pickup_address_id_fkey foreign KEY (pickup_address_id) references addresses (id),
  constraint seller_settings_seller_id_fkey2 foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;

create index IF not exists idx_seller_settings_pickup_address on public.seller_settings using btree (pickup_address_id) TABLESPACE pg_default;


create table public.seller_staff (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  user_id uuid not null,
  role text not null,
  is_active boolean null default true,
  joined_at timestamp with time zone null default now(),
  constraint seller_staff_pkey primary key (id),
  constraint seller_staff_seller_id_user_id_key unique (seller_id, user_id),
  constraint seller_staff_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint seller_staff_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint seller_staff_user_id_fkey1 foreign KEY (user_id) references profiles (id),
  constraint seller_staff_role_check check (
    (
      role = any (
        array[
          'owner'::text,
          'manager'::text,
          'editor'::text,
          'support'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.seller_team_members (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  user_id uuid not null,
  role text not null,
  permissions jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  custom_title text null,
  invited_at timestamp with time zone null default CURRENT_TIMESTAMP,
  accepted_at timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint seller_team_members_pkey primary key (id),
  constraint seller_team_members_seller_id_user_id_key unique (seller_id, user_id),
  constraint seller_team_members_seller_id_fkey foreign KEY (seller_id) references sellers (id) on delete CASCADE,
  constraint seller_team_members_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint seller_team_members_role_check check (
    (
      role = any (
        array[
          'owner'::text,
          'admin'::text,
          'manager'::text,
          'support'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.seller_transactions (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  order_id uuid null,
  type text not null,
  amount numeric(10, 2) not null,
  description text null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  constraint seller_transactions_pkey primary key (id),
  constraint seller_transactions_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint seller_transactions_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint seller_transactions_status_check check (
    (
      status = any (
        array['pending'::text, 'cleared'::text, 'failed'::text]
      )
    )
  ),
  constraint seller_transactions_type_check check (
    (
      type = any (
        array[
          'sale'::text,
          'commission'::text,
          'refund'::text,
          'payout'::text,
          'adjustment'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.seller_warehouses (
  id uuid not null default gen_random_uuid (),
  seller_id uuid not null,
  name text not null,
  address_line1 text not null,
  address_line2 text null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text null default 'IN'::text,
  is_primary boolean null default false,
  contact_phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint seller_warehouses_pkey primary key (id),
  constraint seller_warehouses_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;



create table public.sellers (
  id uuid not null default gen_random_uuid (),
  profile_id uuid not null,
  business_name text null,
  gstin text null,
  pan_number text null,
  pickup_address_id uuid null,
  status text null default 'pending'::text,
  onboarding_step text null default 'details'::text,
  verified_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  seller_type public.seller_type null default 'individual'::seller_type,
  kyc_status public.kyc_status null default 'not_started'::kyc_status,
  is_active boolean null default false,
  commission_rate numeric(5, 2) null default 10.00,
  seller_tier public.seller_tier null default 'bronze'::seller_tier,
  constraint sellers_pkey primary key (id),
  constraint sellers_profile_id_key unique (profile_id),
  constraint sellers_pickup_address_id_fkey foreign KEY (pickup_address_id) references addresses (id),
  constraint sellers_profile_id_fkey foreign KEY (profile_id) references profiles (id),
  constraint sellers_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint check_onboarding_step check (
    (
      onboarding_step = any (
        array[
          'details'::text,
          'business_profile'::text,
          'operations'::text,
          'financials'::text,
          'complete'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_sellers_profile on public.sellers using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_sellers_status on public.sellers using btree (status) TABLESPACE pg_default;


create table public.session_activity (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  action text not null,
  endpoint text null,
  method text null,
  status_code integer null,
  response_time_ms integer null,
  created_at timestamp with time zone null default now(),
  constraint session_activity_pkey primary key (id),
  constraint session_activity_session_id_fkey foreign KEY (session_id) references chairman_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_session_activity_session on public.session_activity using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_session_activity_created on public.session_activity using btree (created_at desc) TABLESPACE pg_default;


create table public.settlements (
  id uuid not null default gen_random_uuid (),
  payout_id uuid null,
  seller_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  amount numeric(12, 2) not null,
  type text not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint settlements_pkey primary key (id),
  constraint settlements_payout_id_fkey foreign KEY (payout_id) references payouts (id),
  constraint settlements_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table public.shipments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  seller_id uuid not null,
  carrier text not null,
  tracking_number text not null,
  tracking_url text null,
  status text null default 'pending'::text,
  shipped_at timestamp with time zone null default CURRENT_TIMESTAMP,
  estimated_delivery timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint shipments_pkey primary key (id),
  constraint shipments_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint shipments_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table public.shipping_profiles (
  id uuid not null default gen_random_uuid (),
  seller_id uuid null,
  name text not null,
  processing_time_min_days integer null default 1,
  processing_time_max_days integer null default 3,
  shipping_fee numeric(10, 2) null default 0,
  free_shipping_threshold numeric(10, 2) null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint shipping_profiles_pkey primary key (id),
  constraint shipping_profiles_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table public.store_members (
  id uuid not null default gen_random_uuid (),
  store_id uuid null,
  user_id uuid null,
  role text null default 'support'::text,
  joined_at timestamp with time zone null default now(),
  constraint store_members_pkey primary key (id),
  constraint store_members_store_id_user_id_key unique (store_id, user_id),
  constraint store_members_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint store_members_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint store_members_role_check check (
    (
      role = any (
        array['owner'::text, 'manager'::text, 'support'::text]
      )
    )
  )
) TABLESPACE pg_default;


create table public.store_settings (
  id uuid not null default gen_random_uuid (),
  store_open boolean null default true,
  pause_message text null,
  maintenance_banner_enabled boolean null default false,
  maintenance_banner_text text null,
  shipping_threshold integer null default 0,
  standard_shipping_rate integer null default 0,
  tax_rate integer null default 0,
  seo_title text null,
  seo_description text null,
  ga4_id text null,
  hero_headline text null,
  hero_subheadline text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  navigation jsonb null default '[{"url": "/shop", "label": "Shop"}, {"url": "/about", "label": "Our Story"}]'::jsonb,
  footer_content jsonb null default '{"about_text": "Experience the future of fashion with our virtual try-on technology. Shop confidently and find your perfect fit.", "shop_links": [{"url": "/shop", "label": "All Products"}, {"url": "/shop?sort=newest", "label": "New Arrivals"}, {"url": "/shop?sort=best_selling", "label": "Best Sellers"}], "legal_links": [{"url": "/privacy", "label": "Privacy Policy"}, {"url": "/terms", "label": "Terms of Service"}, {"url": "/cookies", "label": "Cookie Policy"}], "social_links": {"twitter": "#", "facebook": "#", "linkedin": "#", "instagram": "#"}, "support_links": [{"url": "/contact", "label": "Contact Us"}, {"url": "/faq", "label": "FAQs"}, {"url": "/shipping", "label": "Shipping & Returns"}, {"url": "/track-order", "label": "Track Order"}]}'::jsonb,
  store_id uuid null,
  constraint store_settings_pkey primary key (id),
  constraint store_settings_store_id_key unique (store_id),
  constraint store_settings_store_id_fkey foreign KEY (store_id) references stores (id)
) TABLESPACE pg_default;



create table public.stores (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  name text not null,
  description text null,
  logo_url text null,
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  seller_id uuid not null,
  brand_color text null default '#000000'::text,
  cover_image text null,
  bio text null,
  logo text null,
  social_links jsonb null default '{}'::jsonb,
  is_default boolean null default false,
  slug text null,
  banner_url text null,
  support_email text null,
  support_phone text null,
  return_policy text null,
  shipping_policy text null,
  is_verified boolean null default false,
  constraint stores_pkey primary key (id),
  constraint stores_seller_id_key unique (seller_id),
  constraint stores_slug_key unique (slug),
  constraint stores_owner_id_key unique (owner_id),
  constraint stores_id_key unique (id),
  constraint stores_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint stores_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE,
  constraint stores_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'suspended'::text,
          'pending'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_stores_slug on public.stores using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_stores_owner on public.stores using btree (owner_id) TABLESPACE pg_default;


create table public.sub_categories (
  id uuid not null default gen_random_uuid (),
  main_category_id uuid not null,
  name text not null,
  slug text not null,
  icon text null,
  audiences text[] null default '{}'::text[],
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  image_url text null,
  constraint sub_categories_pkey primary key (id),
  constraint sub_categories_main_category_id_slug_key unique (main_category_id, slug),
  constraint sub_categories_main_category_id_fkey foreign KEY (main_category_id) references main_categories (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_sub_categories_main on public.sub_categories using btree (main_category_id) TABLESPACE pg_default;

create index IF not exists idx_sub_categories_active on public.sub_categories using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_sub_categories_audiences on public.sub_categories using gin (audiences) TABLESPACE pg_default;



create table public.system_alerts (
  id uuid not null default gen_random_uuid (),
  type text not null,
  source text not null,
  title text not null,
  message text not null,
  metadata jsonb null default '{}'::jsonb,
  is_acknowledged boolean null default false,
  acknowledged_by uuid null,
  acknowledged_at timestamp with time zone null,
  acknowledgement_notes text null,
  is_auto_resolved boolean null default false,
  resolved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint system_alerts_pkey primary key (id),
  constraint system_alerts_acknowledged_by_fkey foreign KEY (acknowledged_by) references auth.users (id),
  constraint system_alerts_type_check check (
    (
      type = any (
        array[
          'critical'::text,
          'error'::text,
          'warning'::text,
          'info'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_system_alerts_active on public.system_alerts using btree (type, created_at desc) TABLESPACE pg_default
where
  (is_acknowledged = false);

create index IF not exists idx_system_alerts_source on public.system_alerts using btree (source, created_at desc) TABLESPACE pg_default;


create table public.system_errors (
  id uuid not null default gen_random_uuid (),
  error_message text not null,
  stack_trace text null,
  severity text null default 'error'::text,
  status text null default 'open'::text,
  path text null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  resolved_at timestamp with time zone null,
  constraint system_errors_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_system_errors_status on public.system_errors using btree (status) TABLESPACE pg_default;

create index IF not exists idx_system_errors_created_at on public.system_errors using btree (created_at desc) TABLESPACE pg_default;


create table public.team_invitations (
  id uuid not null default gen_random_uuid (),
  store_id uuid null,
  email text not null,
  role text null default 'support'::text,
  token text not null,
  expires_at timestamp with time zone not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  status text null default 'pending'::text,
  constraint team_invitations_pkey primary key (id),
  constraint team_invitations_token_key unique (token),
  constraint team_invitations_created_by_fkey foreign KEY (created_by) references profiles (id),
  constraint team_invitations_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint team_invitations_role_check check (
    (
      role = any (array['manager'::text, 'support'::text])
    )
  ),
  constraint team_invitations_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'expired'::text,
          'revoked'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;



create table public.tryon_audit_logs (
  id uuid not null default gen_random_uuid (),
  session_id uuid null,
  action_type text not null,
  payload jsonb null,
  recorded_at timestamp with time zone null default now(),
  constraint tryon_audit_logs_pkey primary key (id),
  constraint tryon_audit_logs_session_id_fkey foreign KEY (session_id) references tryon_sessions (id)
) TABLESPACE pg_default;


create table public.tryon_events (
  id uuid not null default gen_random_uuid (),
  store_id uuid not null,
  product_id uuid null,
  device_type text null,
  garment_layer integer null,
  created_at timestamp with time zone null default now(),
  constraint tryon_events_pkey primary key (id),
  constraint tryon_events_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;



create table public.tryon_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  session_device_id text null,
  avatar_config jsonb not null default '{}'::jsonb,
  selected_items jsonb not null default '{}'::jsonb,
  last_active_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tryon_sessions_pkey primary key (id),
  constraint tryon_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_avatars (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name text null default 'My Avatar'::text,
  body_data jsonb not null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_avatars_pkey primary key (id),
  constraint user_avatars_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_closet_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  image_url text not null,
  category text null,
  processed boolean null default false,
  processed_image_url text null,
  created_at timestamp with time zone null default now(),
  constraint user_closet_items_pkey primary key (id),
  constraint user_closet_items_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_closet_items_category_check check (
    (
      category = any (
        array[
          'tops'::text,
          'bottoms'::text,
          'dresses'::text,
          'outerwear'::text,
          'shoes'::text,
          'accessories'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.user_preferences (
  user_id uuid not null,
  preferences jsonb null default '{}'::jsonb,
  updated_at timestamp with time zone null default now(),
  constraint user_preferences_pkey primary key (user_id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_settings (
  user_id uuid not null,
  email_order_updates boolean null default true,
  email_promotions boolean null default false,
  email_weekly_digest boolean null default false,
  email_new_arrivals boolean null default false,
  language text null default 'en'::text,
  measurement_unit text null default 'metric'::text,
  currency text null default 'INR'::text,
  preferred_top_size text null,
  preferred_bottom_size text null,
  preferred_dress_size text null,
  updated_at timestamp with time zone null default now(),
  constraint user_settings_pkey primary key (user_id),
  constraint user_settings_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_style_profiles (
  user_id uuid not null,
  preferred_categories text[] null default '{}'::text[],
  preferred_colors text[] null default '{}'::text[],
  preferred_fit text null default 'regular'::text,
  preferred_style text null default 'casual'::text,
  avg_price_range numrange null default '[500,3000]'::numrange,
  body_type text null,
  style_vector jsonb null default '{}'::jsonb,
  total_views integer null default 0,
  total_purchases integer null default 0,
  last_updated timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint user_style_profiles_pkey primary key (user_id),
  constraint user_style_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_style_profiles_last_updated on public.user_style_profiles using btree (last_updated desc) TABLESPACE pg_default;

create table public.wallet_holds (
  id uuid not null default gen_random_uuid (),
  wallet_id uuid not null,
  seller_id uuid null,
  amount numeric(12, 2) not null,
  reason text null,
  reference_id uuid null,
  is_active boolean null default true,
  released_at timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint wallet_holds_pkey primary key (id),
  constraint wallet_holds_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint wallet_holds_wallet_id_fkey foreign KEY (wallet_id) references wallets (id)
) TABLESPACE pg_default;


create table public.wallet_transactions (
  id uuid not null default gen_random_uuid (),
  wallet_id uuid not null,
  type text not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  description text null,
  reference_id uuid null,
  reference_type text null,
  status text null default 'completed'::text,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint wallet_transactions_pkey primary key (id),
  constraint wallet_transactions_wallet_id_fkey foreign KEY (wallet_id) references wallets (id),
  constraint wallet_transactions_type_check check (
    (
      type = any (
        array[
          'credit'::text,
          'debit'::text,
          'payout'::text,
          'adjustment'::text,
          'refund'::text,
          'fee'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_wallet_transactions_wallet_id on public.wallet_transactions using btree (wallet_id) TABLESPACE pg_default;



create table public.wallets (
  id uuid not null default gen_random_uuid (),
  seller_id uuid null,
  currency text null default 'INR'::text,
  available_balance numeric(12, 2) null default 0,
  pending_balance numeric(12, 2) null default 0,
  on_hold_balance numeric(12, 2) null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  user_id uuid null,
  balance numeric(10, 2) null default 0.00,
  is_active boolean null default true,
  constraint wallets_pkey primary key (id),
  constraint wallets_seller_id_key unique (seller_id),
  constraint wallets_user_id_key unique (user_id),
  constraint wallets_seller_id_fkey foreign KEY (seller_id) references sellers (id),
  constraint wallets_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint wallets_balance_check check ((balance >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_wallets_user_id on public.wallets using btree (user_id) TABLESPACE pg_default;


create table public.warehouse_inventory (
  id uuid not null default gen_random_uuid (),
  warehouse_id uuid null,
  product_id uuid null,
  quantity integer not null default 0,
  updated_at timestamp with time zone null default now(),
  constraint warehouse_inventory_pkey primary key (id),
  constraint warehouse_inventory_warehouse_id_product_id_key unique (warehouse_id, product_id),
  constraint warehouse_inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint warehouse_inventory_warehouse_id_fkey foreign KEY (warehouse_id) references seller_warehouses (id) on delete CASCADE
) TABLESPACE pg_default;



create table public.wishlists (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  product_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint wishlists_pkey primary key (id),
  constraint wishlists_user_id_product_id_key unique (user_id, product_id),
  constraint wishlists_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint wishlists_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_wishlists_user_id on public.wishlists using btree (user_id) TABLESPACE pg_default;


create table analytics.product_performance (
  id uuid not null default gen_random_uuid (),
  product_id uuid null,
  seller_id uuid null,
  date_range text null,
  start_date date null,
  views integer null default 0,
  carts integer null default 0,
  orders integer null default 0,
  revenue numeric(12, 2) null default 0,
  tryon_count integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint product_performance_pkey primary key (id),
  constraint product_performance_product_id_fkey foreign KEY (product_id) references products (id),
  constraint product_performance_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table analytics.seller_daily_metrics (
  id uuid not null default gen_random_uuid (),
  seller_id uuid null,
  date date not null,
  total_sales numeric(12, 2) null default 0,
  total_orders integer null default 0,
  total_units integer null default 0,
  total_visits integer null default 0,
  conversion_rate numeric(5, 2) null default 0,
  return_count integer null default 0,
  return_value numeric(12, 2) null default 0,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint seller_daily_metrics_pkey primary key (id),
  constraint seller_daily_metrics_seller_id_date_key unique (seller_id, date),
  constraint seller_daily_metrics_seller_id_fkey foreign KEY (seller_id) references sellers (id)
) TABLESPACE pg_default;


create table auth.audit_log_entries (
  instance_id uuid null,
  id uuid not null,
  payload json null,
  created_at timestamp with time zone null,
  ip_address character varying(64) not null default ''::character varying,
  constraint audit_log_entries_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists audit_logs_instance_id_idx on auth.audit_log_entries using btree (instance_id) TABLESPACE pg_default;


create table auth.flow_state (
  id uuid not null,
  user_id uuid null,
  auth_code text null,
  code_challenge_method auth.code_challenge_method null,
  code_challenge text null,
  provider_type text not null,
  provider_access_token text null,
  provider_refresh_token text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  authentication_method text not null,
  auth_code_issued_at timestamp with time zone null,
  invite_token text null,
  referrer text null,
  oauth_client_state_id uuid null,
  linking_target_id uuid null,
  email_optional boolean not null default false,
  constraint flow_state_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_auth_code on auth.flow_state using btree (auth_code) TABLESPACE pg_default;

create index IF not exists idx_user_id_auth_method on auth.flow_state using btree (user_id, authentication_method) TABLESPACE pg_default;

create index IF not exists flow_state_created_at_idx on auth.flow_state using btree (created_at desc) TABLESPACE pg_default;


create table auth.identities (
  provider_id text not null,
  user_id uuid not null,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamp with time zone null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  email text GENERATED ALWAYS as (lower((identity_data ->> 'email'::text))) STORED null,
  id uuid not null default gen_random_uuid (),
  constraint identities_pkey primary key (id),
  constraint identities_provider_id_provider_unique unique (provider_id, provider),
  constraint identities_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists identities_user_id_idx on auth.identities using btree (user_id) TABLESPACE pg_default;

create index IF not exists identities_email_idx on auth.identities using btree (email text_pattern_ops) TABLESPACE pg_default;


create table auth.instances (
  id uuid not null,
  uuid uuid null,
  raw_base_config text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  constraint instances_pkey primary key (id)
) TABLESPACE pg_default;


create table auth.mfa_amr_claims (
  session_id uuid not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  authentication_method text not null,
  id uuid not null,
  constraint amr_id_pk primary key (id),
  constraint mfa_amr_claims_session_id_authentication_method_pkey unique (session_id, authentication_method),
  constraint mfa_amr_claims_session_id_fkey foreign KEY (session_id) references auth.sessions (id) on delete CASCADE
) TABLESPACE pg_default;


create table auth.mfa_challenges (
  id uuid not null,
  factor_id uuid not null,
  created_at timestamp with time zone not null,
  verified_at timestamp with time zone null,
  ip_address inet not null,
  otp_code text null,
  web_authn_session_data jsonb null,
  constraint mfa_challenges_pkey primary key (id),
  constraint mfa_challenges_auth_factor_id_fkey foreign KEY (factor_id) references auth.mfa_factors (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists mfa_challenge_created_at_idx on auth.mfa_challenges using btree (created_at desc) TABLESPACE pg_default;



create table auth.mfa_factors (
  id uuid not null,
  user_id uuid not null,
  friendly_name text null,
  factor_type auth.factor_type not null,
  status auth.factor_status not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  secret text null,
  phone text null,
  last_challenged_at timestamp with time zone null,
  web_authn_credential jsonb null,
  web_authn_aaguid uuid null,
  last_webauthn_challenge_data jsonb null,
  constraint mfa_factors_pkey primary key (id),
  constraint mfa_factors_last_challenged_at_key unique (last_challenged_at),
  constraint mfa_factors_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists mfa_factors_user_friendly_name_unique on auth.mfa_factors using btree (friendly_name, user_id) TABLESPACE pg_default
where
  (
    TRIM(
      both
      from
        friendly_name
    ) <> ''::text
  );

create index IF not exists factor_id_created_at_idx on auth.mfa_factors using btree (user_id, created_at) TABLESPACE pg_default;

create index IF not exists mfa_factors_user_id_idx on auth.mfa_factors using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_phone_factor_per_user on auth.mfa_factors using btree (user_id, phone) TABLESPACE pg_default;



create table auth.oauth_authorizations (
  id uuid not null,
  authorization_id text not null,
  client_id uuid not null,
  user_id uuid null,
  redirect_uri text not null,
  scope text not null,
  state text null,
  resource text null,
  code_challenge text null,
  code_challenge_method auth.code_challenge_method null,
  response_type auth.oauth_response_type not null default 'code'::auth.oauth_response_type,
  status auth.oauth_authorization_status not null default 'pending'::auth.oauth_authorization_status,
  authorization_code text null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + '00:03:00'::interval),
  approved_at timestamp with time zone null,
  nonce text null,
  constraint oauth_authorizations_pkey primary key (id),
  constraint oauth_authorizations_authorization_code_key unique (authorization_code),
  constraint oauth_authorizations_authorization_id_key unique (authorization_id),
  constraint oauth_authorizations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint oauth_authorizations_client_id_fkey foreign KEY (client_id) references auth.oauth_clients (id) on delete CASCADE,
  constraint oauth_authorizations_expires_at_future check ((expires_at > created_at)),
  constraint oauth_authorizations_nonce_length check ((char_length(nonce) <= 255)),
  constraint oauth_authorizations_code_challenge_length check ((char_length(code_challenge) <= 128)),
  constraint oauth_authorizations_redirect_uri_length check ((char_length(redirect_uri) <= 2048)),
  constraint oauth_authorizations_resource_length check ((char_length(resource) <= 2048)),
  constraint oauth_authorizations_scope_length check ((char_length(scope) <= 4096)),
  constraint oauth_authorizations_state_length check ((char_length(state) <= 4096)),
  constraint oauth_authorizations_authorization_code_length check ((char_length(authorization_code) <= 255))
) TABLESPACE pg_default;

create index IF not exists oauth_auth_pending_exp_idx on auth.oauth_authorizations using btree (expires_at) TABLESPACE pg_default
where
  (
    status = 'pending'::auth.oauth_authorization_status
  );



  create table auth.oauth_client_states (
  id uuid not null,
  provider_type text not null,
  code_verifier text null,
  created_at timestamp with time zone not null,
  constraint oauth_client_states_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_oauth_client_states_created_at on auth.oauth_client_states using btree (created_at) TABLESPACE pg_default;


create table auth.oauth_clients (
  id uuid not null,
  client_secret_hash text null,
  registration_type auth.oauth_registration_type not null,
  redirect_uris text not null,
  grant_types text not null,
  client_name text null,
  client_uri text null,
  logo_uri text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  client_type auth.oauth_client_type not null default 'confidential'::auth.oauth_client_type,
  token_endpoint_auth_method text not null,
  constraint oauth_clients_pkey primary key (id),
  constraint oauth_clients_client_name_length check ((char_length(client_name) <= 1024)),
  constraint oauth_clients_client_uri_length check ((char_length(client_uri) <= 2048)),
  constraint oauth_clients_logo_uri_length check ((char_length(logo_uri) <= 2048)),
  constraint oauth_clients_token_endpoint_auth_method_check check (
    (
      token_endpoint_auth_method = any (
        array[
          'client_secret_basic'::text,
          'client_secret_post'::text,
          'none'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists oauth_clients_deleted_at_idx on auth.oauth_clients using btree (deleted_at) TABLESPACE pg_default;


create table auth.oauth_consents (
  id uuid not null,
  user_id uuid not null,
  client_id uuid not null,
  scopes text not null,
  granted_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone null,
  constraint oauth_consents_pkey primary key (id),
  constraint oauth_consents_user_client_unique unique (user_id, client_id),
  constraint oauth_consents_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint oauth_consents_client_id_fkey foreign KEY (client_id) references auth.oauth_clients (id) on delete CASCADE,
  constraint oauth_consents_scopes_length check ((char_length(scopes) <= 2048)),
  constraint oauth_consents_revoked_after_granted check (
    (
      (revoked_at is null)
      or (revoked_at >= granted_at)
    )
  ),
  constraint oauth_consents_scopes_not_empty check (
    (
      char_length(
        TRIM(
          both
          from
            scopes
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists oauth_consents_active_user_client_idx on auth.oauth_consents using btree (user_id, client_id) TABLESPACE pg_default
where
  (revoked_at is null);

create index IF not exists oauth_consents_user_order_idx on auth.oauth_consents using btree (user_id, granted_at desc) TABLESPACE pg_default;

create index IF not exists oauth_consents_active_client_idx on auth.oauth_consents using btree (client_id) TABLESPACE pg_default
where
  (revoked_at is null);



create table auth.one_time_tokens (
  id uuid not null,
  user_id uuid not null,
  token_type auth.one_time_token_type not null,
  token_hash text not null,
  relates_to text not null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint one_time_tokens_pkey primary key (id),
  constraint one_time_tokens_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint one_time_tokens_token_hash_check check ((char_length(token_hash) > 0))
) TABLESPACE pg_default;

create index IF not exists one_time_tokens_token_hash_hash_idx on auth.one_time_tokens using hash (token_hash) TABLESPACE pg_default;

create index IF not exists one_time_tokens_relates_to_hash_idx on auth.one_time_tokens using hash (relates_to) TABLESPACE pg_default;

create unique INDEX IF not exists one_time_tokens_user_id_token_type_key on auth.one_time_tokens using btree (user_id, token_type) TABLESPACE pg_default;


create table auth.refresh_tokens (
  instance_id uuid null,
  id bigserial not null,
  token character varying(255) null,
  user_id character varying(255) null,
  revoked boolean null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  parent character varying(255) null,
  session_id uuid null,
  constraint refresh_tokens_pkey primary key (id),
  constraint refresh_tokens_token_unique unique (token),
  constraint refresh_tokens_session_id_fkey foreign KEY (session_id) references auth.sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists refresh_tokens_instance_id_idx on auth.refresh_tokens using btree (instance_id) TABLESPACE pg_default;

create index IF not exists refresh_tokens_instance_id_user_id_idx on auth.refresh_tokens using btree (instance_id, user_id) TABLESPACE pg_default;

create index IF not exists refresh_tokens_parent_idx on auth.refresh_tokens using btree (parent) TABLESPACE pg_default;

create index IF not exists refresh_tokens_session_id_revoked_idx on auth.refresh_tokens using btree (session_id, revoked) TABLESPACE pg_default;

create index IF not exists refresh_tokens_updated_at_idx on auth.refresh_tokens using btree (updated_at desc) TABLESPACE pg_default;


create table auth.saml_providers (
  id uuid not null,
  sso_provider_id uuid not null,
  entity_id text not null,
  metadata_xml text not null,
  metadata_url text null,
  attribute_mapping jsonb null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  name_id_format text null,
  constraint saml_providers_pkey primary key (id),
  constraint saml_providers_entity_id_key unique (entity_id),
  constraint saml_providers_sso_provider_id_fkey foreign KEY (sso_provider_id) references auth.sso_providers (id) on delete CASCADE,
  constraint entity_id not empty check ((char_length(entity_id) > 0)),
  constraint metadata_url not empty check (
    (
      (metadata_url = null::text)
      or (char_length(metadata_url) > 0)
    )
  ),
  constraint metadata_xml not empty check ((char_length(metadata_xml) > 0))
) TABLESPACE pg_default;

create index IF not exists saml_providers_sso_provider_id_idx on auth.saml_providers using btree (sso_provider_id) TABLESPACE pg_default;



create table auth.saml_relay_states (
  id uuid not null,
  sso_provider_id uuid not null,
  request_id text not null,
  for_email text null,
  redirect_to text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  flow_state_id uuid null,
  constraint saml_relay_states_pkey primary key (id),
  constraint saml_relay_states_flow_state_id_fkey foreign KEY (flow_state_id) references auth.flow_state (id) on delete CASCADE,
  constraint saml_relay_states_sso_provider_id_fkey foreign KEY (sso_provider_id) references auth.sso_providers (id) on delete CASCADE,
  constraint request_id not empty check ((char_length(request_id) > 0))
) TABLESPACE pg_default;

create index IF not exists saml_relay_states_sso_provider_id_idx on auth.saml_relay_states using btree (sso_provider_id) TABLESPACE pg_default;

create index IF not exists saml_relay_states_for_email_idx on auth.saml_relay_states using btree (for_email) TABLESPACE pg_default;

create index IF not exists saml_relay_states_created_at_idx on auth.saml_relay_states using btree (created_at desc) TABLESPACE pg_default;



create table auth.schema_migrations (
  version character varying(255) not null,
  constraint schema_migrations_pkey primary key (version)
) TABLESPACE pg_default;



create table auth.sessions (
  id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  factor_id uuid null,
  aal auth.aal_level null,
  not_after timestamp with time zone null,
  refreshed_at timestamp without time zone null,
  user_agent text null,
  ip inet null,
  tag text null,
  oauth_client_id uuid null,
  refresh_token_hmac_key text null,
  refresh_token_counter bigint null,
  scopes text null,
  constraint sessions_pkey primary key (id),
  constraint sessions_oauth_client_id_fkey foreign KEY (oauth_client_id) references auth.oauth_clients (id) on delete CASCADE,
  constraint sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint sessions_scopes_length check ((char_length(scopes) <= 4096))
) TABLESPACE pg_default;

create index IF not exists user_id_created_at_idx on auth.sessions using btree (user_id, created_at) TABLESPACE pg_default;

create index IF not exists sessions_user_id_idx on auth.sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists sessions_not_after_idx on auth.sessions using btree (not_after desc) TABLESPACE pg_default;

create index IF not exists sessions_oauth_client_id_idx on auth.sessions using btree (oauth_client_id) TABLESPACE pg_default;



create table auth.users (
  instance_id uuid null,
  id uuid not null,
  aud character varying(255) null,
  role character varying(255) null,
  email character varying(255) null,
  encrypted_password character varying(255) null,
  email_confirmed_at timestamp with time zone null,
  invited_at timestamp with time zone null,
  confirmation_token character varying(255) null,
  confirmation_sent_at timestamp with time zone null,
  recovery_token character varying(255) null,
  recovery_sent_at timestamp with time zone null,
  email_change_token_new character varying(255) null,
  email_change character varying(255) null,
  email_change_sent_at timestamp with time zone null,
  last_sign_in_at timestamp with time zone null,
  raw_app_meta_data jsonb null,
  raw_user_meta_data jsonb null,
  is_super_admin boolean null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  phone text null default null::character varying,
  phone_confirmed_at timestamp with time zone null,
  phone_change text null default ''::character varying,
  phone_change_token character varying(255) null default ''::character varying,
  phone_change_sent_at timestamp with time zone null,
  confirmed_at timestamp with time zone GENERATED ALWAYS as (LEAST(email_confirmed_at, phone_confirmed_at)) STORED null,
  email_change_token_current character varying(255) null default ''::character varying,
  email_change_confirm_status smallint null default 0,
  banned_until timestamp with time zone null,
  reauthentication_token character varying(255) null default ''::character varying,
  reauthentication_sent_at timestamp with time zone null,
  is_sso_user boolean not null default false,
  deleted_at timestamp with time zone null,
  is_anonymous boolean not null default false,
  constraint users_pkey primary key (id),
  constraint users_phone_key unique (phone),
  constraint users_email_change_confirm_status_check check (
    (
      (email_change_confirm_status >= 0)
      and (email_change_confirm_status <= 2)
    )
  )
) TABLESPACE pg_default;

create index IF not exists users_instance_id_idx on auth.users using btree (instance_id) TABLESPACE pg_default;

create index IF not exists users_instance_id_email_idx on auth.users using btree (instance_id, lower((email)::text)) TABLESPACE pg_default;

create unique INDEX IF not exists confirmation_token_idx on auth.users using btree (confirmation_token) TABLESPACE pg_default
where
  ((confirmation_token)::text !~ '^[0-9 ]*$'::text);

create unique INDEX IF not exists recovery_token_idx on auth.users using btree (recovery_token) TABLESPACE pg_default
where
  ((recovery_token)::text !~ '^[0-9 ]*$'::text);

create unique INDEX IF not exists email_change_token_current_idx on auth.users using btree (email_change_token_current) TABLESPACE pg_default
where
  (
    (email_change_token_current)::text !~ '^[0-9 ]*$'::text
  );

create unique INDEX IF not exists email_change_token_new_idx on auth.users using btree (email_change_token_new) TABLESPACE pg_default
where
  (
    (email_change_token_new)::text !~ '^[0-9 ]*$'::text
  );

create unique INDEX IF not exists reauthentication_token_idx on auth.users using btree (reauthentication_token) TABLESPACE pg_default
where
  (
    (reauthentication_token)::text !~ '^[0-9 ]*$'::text
  );

create unique INDEX IF not exists users_email_partial_key on auth.users using btree (email) TABLESPACE pg_default
where
  (is_sso_user = false);

create index IF not exists users_is_anonymous_idx on auth.users using btree (is_anonymous) TABLESPACE pg_default;

create trigger on_auth_user_created
after INSERT on auth.users for EACH row
execute FUNCTION handle_new_user ();


create table auth.sso_providers (
  id uuid not null,
  resource_id text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  disabled boolean null,
  constraint sso_providers_pkey primary key (id),
  constraint resource_id not empty check (
    (
      (resource_id = null::text)
      or (char_length(resource_id) > 0)
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists sso_providers_resource_id_idx on auth.sso_providers using btree (lower(resource_id)) TABLESPACE pg_default;

create index IF not exists sso_providers_resource_id_pattern_idx on auth.sso_providers using btree (resource_id text_pattern_ops) TABLESPACE pg_default;



create table auth.sso_domains (
  id uuid not null,
  sso_provider_id uuid not null,
  domain text not null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  constraint sso_domains_pkey primary key (id),
  constraint sso_domains_sso_provider_id_fkey foreign KEY (sso_provider_id) references auth.sso_providers (id) on delete CASCADE,
  constraint domain not empty check ((char_length(domain) > 0))
) TABLESPACE pg_default;

create index IF not exists sso_domains_sso_provider_id_idx on auth.sso_domains using btree (sso_provider_id) TABLESPACE pg_default;

create unique INDEX IF not exists sso_domains_domain_idx on auth.sso_domains using btree (lower(domain)) TABLESPACE pg_default;



create table realtime.messages (
  topic text not null,
  extension text not null,
  payload jsonb null,
  event text null,
  private boolean null default false,
  updated_at timestamp without time zone not null default now(),
  inserted_at timestamp without time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  constraint messages_pkey primary key (id, inserted_at)
)
partition by
  RANGE (inserted_at);

create index IF not exists messages_inserted_at_topic_index on only realtime.messages using btree (inserted_at desc, topic)
where
  (
    (extension = 'broadcast'::text)
    and (private is true)
  );


create table realtime.subscription (
  id bigint generated always as identity not null,
  subscription_id uuid not null,
  entity regclass not null,
  filters realtime.user_defined_filter[] not null default '{}'::realtime.user_defined_filter[],
  claims jsonb not null,
  claims_role regrole GENERATED ALWAYS as (realtime.to_regrole ((claims ->> 'role'::text))) STORED not null,
  created_at timestamp without time zone not null default timezone ('utc'::text, now()),
  action_filter text null default '*'::text,
  constraint pk_subscription primary key (id),
  constraint subscription_action_filter_check check (
    (
      action_filter = any (
        array[
          '*'::text,
          'INSERT'::text,
          'UPDATE'::text,
          'DELETE'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists ix_realtime_subscription_entity on realtime.subscription using btree (entity) TABLESPACE pg_default;

create unique INDEX IF not exists subscription_subscription_id_entity_filters_action_filter_key on realtime.subscription using btree (subscription_id, entity, filters, action_filter) TABLESPACE pg_default;

create trigger tr_check_filters BEFORE INSERT
or
update on realtime.subscription for EACH row
execute FUNCTION realtime.subscription_check_filters ();


create table storage.buckets (
  id text not null,
  name text not null,
  owner uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  public boolean null default false,
  avif_autodetection boolean null default false,
  file_size_limit bigint null,
  allowed_mime_types text[] null,
  owner_id text null,
  type storage.buckettype not null default 'STANDARD'::storage.buckettype,
  constraint buckets_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists bname on storage.buckets using btree (name) TABLESPACE pg_default;

create trigger enforce_bucket_name_length_trigger BEFORE INSERT
or
update OF name on storage.buckets for EACH row
execute FUNCTION storage.enforce_bucket_name_length ();

create trigger protect_buckets_delete BEFORE DELETE on storage.buckets for EACH STATEMENT
execute FUNCTION storage.protect_delete ();


create table storage.buckets_analytics (
  name text not null,
  type storage.buckettype not null default 'ANALYTICS'::storage.buckettype,
  format text not null default 'ICEBERG'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  deleted_at timestamp with time zone null,
  constraint buckets_analytics_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists buckets_analytics_unique_name_idx on storage.buckets_analytics using btree (name) TABLESPACE pg_default
where
  (deleted_at is null);


create table storage.buckets_vectors (
  id text not null,
  type storage.buckettype not null default 'VECTOR'::storage.buckettype,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint buckets_vectors_pkey primary key (id)
) TABLESPACE pg_default;


create table storage.objects (
  id uuid not null default gen_random_uuid (),
  bucket_id text null,
  name text null,
  owner uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_accessed_at timestamp with time zone null default now(),
  metadata jsonb null,
  path_tokens ARRAY GENERATED ALWAYS as (string_to_array(name, '/'::text)) STORED null,
  version text null,
  owner_id text null,
  user_metadata jsonb null,
  constraint objects_pkey primary key (id),
  constraint objects_bucketId_fkey foreign KEY (bucket_id) references storage.buckets (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists bucketid_objname on storage.objects using btree (bucket_id, name) TABLESPACE pg_default;

create index IF not exists name_prefix_search on storage.objects using btree (name text_pattern_ops) TABLESPACE pg_default;

create index IF not exists idx_objects_bucket_id_name on storage.objects using btree (bucket_id, name collate "C") TABLESPACE pg_default;

create index IF not exists idx_objects_bucket_id_name_lower on storage.objects using btree (bucket_id, lower(name) collate "C") TABLESPACE pg_default;

create trigger protect_objects_delete BEFORE DELETE on storage.objects for EACH STATEMENT
execute FUNCTION storage.protect_delete ();

create trigger update_objects_updated_at BEFORE
update on storage.objects for EACH row
execute FUNCTION storage.update_updated_at_column ();


create table storage.s3_multipart_uploads_parts (
  id uuid not null default gen_random_uuid (),
  upload_id text not null,
  size bigint not null default 0,
  part_number integer not null,
  bucket_id text not null,
  key text not null,
  etag text not null,
  owner_id text null,
  version text not null,
  created_at timestamp with time zone not null default now(),
  constraint s3_multipart_uploads_parts_pkey primary key (id),
  constraint s3_multipart_uploads_parts_bucket_id_fkey foreign KEY (bucket_id) references storage.buckets (id),
  constraint s3_multipart_uploads_parts_upload_id_fkey foreign KEY (upload_id) references storage.s3_multipart_uploads (id) on delete CASCADE
) TABLESPACE pg_default;


create table storage.vector_indexes (
  id text not null default gen_random_uuid (),
  name text not null,
  bucket_id text not null,
  data_type text not null,
  dimension integer not null,
  distance_metric text not null,
  metadata_configuration jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vector_indexes_pkey primary key (id),
  constraint vector_indexes_bucket_id_fkey foreign KEY (bucket_id) references storage.buckets_vectors (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists vector_indexes_name_bucket_id_idx on storage.vector_indexes using btree (name, bucket_id) TABLESPACE pg_default;


create table storage.s3_multipart_uploads (
  id text not null,
  in_progress_size bigint not null default 0,
  upload_signature text not null,
  bucket_id text not null,
  key text not null,
  version text not null,
  owner_id text null,
  created_at timestamp with time zone not null default now(),
  user_metadata jsonb null,
  constraint s3_multipart_uploads_pkey primary key (id),
  constraint s3_multipart_uploads_bucket_id_fkey foreign KEY (bucket_id) references storage.buckets (id)
) TABLESPACE pg_default;

create index IF not exists idx_multipart_uploads_list on storage.s3_multipart_uploads using btree (bucket_id, key, created_at) TABLESPACE pg_default;


create table vault.secrets (
  id uuid not null default gen_random_uuid (),
  name text null,
  description text not null default ''::text,
  secret text not null,
  key_id uuid null,
  nonce bytea null default vault._crypto_aead_det_noncegen (),
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint secrets_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists secrets_name_idx on vault.secrets using btree (name) TABLESPACE pg_default
where
  (name is not null);


create view vault.decrypted_secrets as
select
  id,
  name,
  description,
  secret,
  convert_from(
    vault._crypto_aead_det_decrypt (
      message => decode(secret, 'base64'::text),
      additional => convert_to(id::text, 'utf8'::name),
      key_id => 0::bigint,
      context => '\x7067736f6469756d'::bytea,
      nonce => nonce
    ),
    'utf8'::name
  ) as decrypted_secret,
  key_id,
  nonce,
  created_at,
  updated_at
from
  vault.secrets s;



