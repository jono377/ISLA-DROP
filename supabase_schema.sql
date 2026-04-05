-- ============================================================
-- Isla Drop - Supabase Schema (Fixed)
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- PROFILES
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('customer','driver','ops')) default 'customer',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- CUSTOMERS
create table public.customers (
  id                uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text unique,
  age_verified      boolean default false,
  age_verified_at   timestamptz,
  onfido_check_id   text,
  dob               date,
  id_document_type  text,
  total_orders      int default 0,
  created_at        timestamptz default now()
);

alter table public.customers enable row level security;
create policy "Customers read own record" on public.customers for select using (auth.uid() = id);
create policy "Customers update own record" on public.customers for update using (auth.uid() = id);

-- DRIVERS
create table public.drivers (
  id               uuid primary key references public.profiles(id) on delete cascade,
  vehicle_type     text default 'scooter',
  vehicle_plate    text,
  is_online        boolean default false,
  current_location geography(Point, 4326),
  last_seen        timestamptz,
  rating           numeric(3,2) default 5.00,
  total_deliveries int default 0,
  earnings_today   numeric(10,2) default 0,
  created_at       timestamptz default now()
);

alter table public.drivers enable row level security;
create policy "Drivers read own record" on public.drivers for select using (auth.uid() = id);
create policy "Drivers update own record" on public.drivers for update using (auth.uid() = id);
create policy "Ops can read all drivers" on public.drivers for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ops')
);

-- PRODUCTS
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  category          text not null check (category in ('wine','beer','spirits','champagne','soft_drinks','ice_mixers')),
  price             numeric(10,2) not null,
  image_url         text,
  emoji             text,
  stock             int default 100,
  is_active         boolean default true,
  is_age_restricted boolean default true,
  created_at        timestamptz default now()
);

alter table public.products enable row level security;
create policy "Anyone can read active products" on public.products for select using (is_active = true);
create policy "Ops can manage products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ops')
);

-- ORDERS
-- IMPORTANT: Sequence must be created BEFORE the orders table
create sequence if not exists order_seq start 800;

create type order_status as enum (
  'pending', 'age_check', 'confirmed', 'preparing',
  'assigned', 'picked_up', 'en_route', 'delivered', 'cancelled'
);

create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  order_number             text unique not null default 'IBZ-' || to_char(nextval('order_seq'), 'FM0000'),
  customer_id              uuid not null references public.customers(id),
  driver_id                uuid references public.drivers(id),
  status                   order_status default 'pending',

  delivery_lat             double precision not null,
  delivery_lng             double precision not null,
  delivery_address         text,
  delivery_notes           text,
  what3words               text,

  subtotal                 numeric(10,2) not null,
  delivery_fee             numeric(10,2) default 3.50,
  total                    numeric(10,2) not null,
  stripe_payment_intent_id text unique,
  paid_at                  timestamptz,

  estimated_minutes        int,
  accepted_at              timestamptz,
  picked_up_at             timestamptz,
  delivered_at             timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Customers read own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "Drivers read assigned orders" on public.orders for select using (auth.uid() = driver_id);
create policy "Ops read all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ops')
);
create policy "Customers create orders" on public.orders for insert with check (auth.uid() = customer_id);
create policy "Drivers update assigned" on public.orders for update using (auth.uid() = driver_id);
create policy "Ops update all" on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ops')
);

-- ORDER ITEMS
create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity   int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;
create policy "Read if can read order" on public.order_items for select using (
  exists (
    select 1 from public.orders o where o.id = order_id
    and (
      o.customer_id = auth.uid()
      or o.driver_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'ops')
    )
  )
);
create policy "Insert with order" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- DRIVER LOCATION HISTORY
create table public.driver_locations (
  id          bigint generated always as identity primary key,
  driver_id   uuid not null references public.drivers(id),
  location    geography(Point, 4326) not null,
  recorded_at timestamptz default now()
);

create index on public.driver_locations (driver_id, recorded_at desc);

-- REALTIME
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.drivers;
alter publication supabase_realtime add table public.driver_locations;

-- SEED PRODUCTS
insert into public.products (name, description, category, price, emoji, is_age_restricted) values
  ('Moet & Chandon Brut',   '750ml - Chilled',           'champagne',  42.00, '🍾', true),
  ('Dom Perignon 2015',     '750ml - Vintage',           'champagne', 185.00, '🥂', true),
  ('Whispering Angel Rose', '750ml - Cotes de Provence', 'wine',       36.00, '🍷', true),
  ('Tanqueray London Dry',  '70cl',                      'spirits',    28.00, '🥃', true),
  ('Grey Goose Vodka',      '70cl - French',             'spirits',    34.00, '🍸', true),
  ('Hendricks Gin',         '70cl - Scottish',           'spirits',    32.00, '🌹', true),
  ('Corona Extra Pack',     '24 x 330ml - Ice cold',     'beer',       22.00, '🍺', true),
  ('Estrella Damm',         '12 x 330ml - Barcelona',    'beer',       14.00, '🍻', true),
  ('Aperol Spritz Kit',     'Aperol + Prosecco + Soda',  'spirits',    31.00, '🍊', true),
  ('Ice Bag Large',         '5kg - Crushed',             'ice_mixers',  6.00, '🧊', false),
  ('Fever-Tree Tonic 6pk',  '6 x 200ml',                'ice_mixers',  9.00, '💧', false),
  ('San Pellegrino 6pk',    '6 x 750ml - Sparkling',    'soft_drinks',  8.00, '🫧', false);

-- ============================================================
-- CONCIERGE BOOKINGS
-- ============================================================

create table public.concierge_bookings (
  id              uuid primary key default gen_random_uuid(),
  booking_ref     text unique not null default 'CB-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_id     uuid references public.profiles(id) on delete set null,
  customer_email  text not null,
  customer_name   text not null,

  -- Service details
  service_id      text not null,
  service_name    text not null,
  service_category text not null,
  partner         text not null,
  location        text,
  location_lat    numeric,
  location_lng    numeric,

  -- Booking details
  booking_date    date not null,
  guests          int default 1,
  special_notes   text,
  price_per_unit  numeric(10,2) not null,
  total_price     numeric(10,2) not null,
  commission_rate numeric(4,2) default 0.10,
  commission_amount numeric(10,2),

  -- Status
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','cancelled','completed')),
  ai_notes        text,           -- Claude AI processing notes
  ops_notes       text,           -- Manual ops notes
  confirmation_sent_at timestamptz,
  confirmed_at    timestamptz,
  cancelled_at    timestamptz,
  cancellation_reason text,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.concierge_bookings enable row level security;

-- Customers can see their own bookings
create policy "Customers read own bookings"
  on public.concierge_bookings for select
  using (customer_id = auth.uid());

-- Customers can create bookings
create policy "Customers create bookings"
  on public.concierge_bookings for insert
  with check (true);

-- Ops can see and update all bookings
create policy "Ops full access to concierge bookings"
  on public.concierge_bookings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ops'));

-- Auto-update updated_at
create or replace function update_concierge_booking_timestamp()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger set_concierge_booking_updated_at
  before update on public.concierge_bookings
  for each row execute function update_concierge_booking_timestamp();

-- Commission calculation trigger
create or replace function calculate_commission()
returns trigger as $$
begin
  new.commission_amount = round(new.total_price * new.commission_rate, 2);
  return new;
end;
$$ language plpgsql;

create trigger auto_calculate_commission
  before insert or update on public.concierge_bookings
  for each row execute function calculate_commission();

-- ============================================================
-- STOCK MANAGEMENT
-- ============================================================

create table public.stock (
  id              uuid primary key default gen_random_uuid(),
  product_id      text unique not null,
  product_name    text not null,
  category        text not null,
  current_qty     int not null default 0,
  min_qty         int not null default 10,
  max_qty         int not null default 100,
  reorder_point   int not null default 25,   -- qty to trigger alert
  alert_threshold numeric(4,2) default 0.25, -- % remaining to alert (AI adjusts)
  unit_cost       numeric(10,2) default 0,
  units_sold_today int default 0,
  units_sold_week  int default 0,
  units_sold_total int default 0,
  velocity        text default 'normal'
                  check (velocity in ('slow','normal','fast','critical')),
  last_restocked  timestamptz,
  last_sold       timestamptz,
  alert_sent_at   timestamptz,
  notes           text,
  updated_at      timestamptz default now()
);

alter table public.stock enable row level security;

create policy "Ops can manage stock"
  on public.stock for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ops'));

create policy "Drivers can read stock"
  on public.stock for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'driver'));

-- Auto-update timestamp
create trigger set_stock_updated_at
  before update on public.stock
  for each row execute function update_concierge_booking_timestamp();

-- ── STOCK ALERTS LOG ──────────────────────────────────────────
create table public.stock_alerts (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,
  product_name text not null,
  alert_type  text not null check (alert_type in ('low','critical','out_of_stock','restocked')),
  qty_at_alert int,
  pct_at_alert numeric(5,2),
  message     text,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

alter table public.stock_alerts enable row level security;
create policy "Ops can manage alerts" on public.stock_alerts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ops'));

-- ── Add delivery PIN to orders ────────────────────────────────
-- Run this if orders table already exists:
alter table public.orders add column if not exists delivery_pin int;
alter table public.orders add column if not exists warehouse_confirmed_at timestamptz;

-- Auto-generate 4-digit PIN on order creation
create or replace function generate_delivery_pin()
returns trigger as $$
begin
  new.delivery_pin = floor(random() * 9000 + 1000)::int;
  return new;
end;
$$ language plpgsql;

create trigger auto_delivery_pin
  before insert on public.orders
  for each row execute function generate_delivery_pin();

-- Update status check to include new states
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','assigned','warehouse_confirmed','en_route','delivered','cancelled'));

-- ── CUSTOMER CREDIT ───────────────────────────────────────────
create table public.customer_credit (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  amount      numeric(10,2) not null,
  type        text not null check (type in ('credit','used','refund','bonus')),
  description text,
  order_id    uuid,
  created_at  timestamptz default now()
);
alter table public.customer_credit enable row level security;
create policy "Customers read own credit" on public.customer_credit
  for select using (customer_id = auth.uid());
create policy "Ops manage credit" on public.customer_credit
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ops'));

-- ── SUPPORT TICKETS (for cashback requests etc) ───────────────
create table public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  type        text not null,
  message     text,
  status      text default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at  timestamptz default now()
);
alter table public.support_tickets enable row level security;
create policy "Customers create tickets" on public.support_tickets
  for insert with check (customer_id = auth.uid());
create policy "Ops manage tickets" on public.support_tickets
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ops'));

-- ── Driver approval status ────────────────────────────────────
alter table public.profiles add column if not exists status text default 'active'
  check (status in ('active','pending','suspended'));

alter table public.drivers add column if not exists status text default 'active'
  check (status in ('active','pending','suspended'));

alter table public.drivers add column if not exists licence_number text;
