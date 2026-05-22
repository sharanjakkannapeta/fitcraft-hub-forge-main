-- Migration: Admin Dashboard Schema
-- Drops existing tables that conflict to recreate with requested structure
drop table if exists public.transactions cascade;
drop table if exists public.email_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.settings cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.customers cascade;
drop table if exists public.admins cascade;

-- Admins Table
create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;
create policy "Admins can do everything" on public.admins for all using (
  auth.uid() in (select id from public.admins)
) with check (
  auth.uid() in (select id from public.admins)
);
-- Allow first admin to be created if none exist? We will just insert them manually or let postgres function do it.
create policy "Allow insert if no admins exist" on public.admins for insert with check (
  not exists (select 1 from public.admins)
);

-- Customers Table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  phone text,
  address text,
  city text,
  state text,
  country text,
  pincode text,
  is_blocked boolean default false,
  created_at timestamptz default now()
);
alter table public.customers enable row level security;
create policy "Admin full access on customers" on public.customers for all using (auth.uid() in (select id from public.admins));

-- Products Table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  price numeric,
  sale_price numeric,
  category text,
  images text[],
  stock integer default 0,
  low_stock_threshold integer default 10,
  supplier_type text check (supplier_type in ('india', 'zendrop')),
  zendrop_product_id text,
  zendrop_variant_id text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.products enable row level security;
create policy "Admin full access on products" on public.products for all using (auth.uid() in (select id from public.admins));
create policy "Public read products" on public.products for select using (is_active = true);

-- Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references public.customers(id) on delete set null,
  total_amount numeric,
  currency text check (currency in ('INR', 'USD')),
  payment_method text,
  payment_status text check (payment_status in ('paid', 'unpaid', 'refunded')),
  order_status text check (order_status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  order_source text check (order_source in ('india_supplier', 'zendrop')),
  zendrop_order_id text,
  tracking_number text,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Admin full access on orders" on public.orders for all using (auth.uid() in (select id from public.admins));

-- Order Items Table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  quantity integer,
  unit_price numeric,
  created_at timestamptz default now()
);
alter table public.order_items enable row level security;
create policy "Admin full access on order items" on public.order_items for all using (auth.uid() in (select id from public.admins));

-- Suppliers Table
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  whatsapp text,
  type text check (type in ('india', 'zendrop')),
  products_handled text[],
  created_at timestamptz default now()
);
alter table public.suppliers enable row level security;
create policy "Admin full access on suppliers" on public.suppliers for all using (auth.uid() in (select id from public.admins));

-- Coupons Table
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'flat')),
  discount_value numeric,
  min_order_value numeric,
  usage_limit integer,
  used_count integer default 0,
  expiry_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.coupons enable row level security;
create policy "Admin full access on coupons" on public.coupons for all using (auth.uid() in (select id from public.admins));
create policy "Public read coupons" on public.coupons for select using (is_active = true);

-- Notifications Table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text,
  type text check (type in ('order', 'stock', 'payment', 'api_error')),
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Admin full access on notifications" on public.notifications for all using (auth.uid() in (select id from public.admins));

-- Email Logs Table
create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text,
  subject text,
  type text,
  status text check (status in ('sent', 'failed', 'pending')),
  created_at timestamptz default now()
);
alter table public.email_logs enable row level security;
create policy "Admin full access on email_logs" on public.email_logs for all using (auth.uid() in (select id from public.admins));

-- Transactions Table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  amount numeric,
  currency text,
  payment_method text,
  payment_gateway text,
  transaction_id text,
  status text,
  created_at timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "Admin full access on transactions" on public.transactions for all using (auth.uid() in (select id from public.admins));

-- Settings Table (for API keys, store name, etc.)
create table public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.settings enable row level security;
create policy "Admin full access on settings" on public.settings for all using (auth.uid() in (select id from public.admins));

-- Enable realtime
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table notifications;

-- Updated at triggers for orders and settings
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_orders
before update on public.orders
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_settings
before update on public.settings
for each row execute procedure public.handle_updated_at();
