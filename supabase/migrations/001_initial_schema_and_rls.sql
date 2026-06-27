-- Initial schema for the catalog SaaS platform.
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  phone text,
  whatsapp text,
  address text,
  instagram_url text,
  tiktok_url text,
  subscription_until date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),

  constraint tenants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_status_check check (status in ('active', 'archived'))
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null,
  tenant_id uuid references public.tenants(id) on delete set null,

  constraint profiles_role_check check (role in ('superadmin', 'client')),
  constraint profiles_role_tenant_check check (
    (role = 'superadmin' and tenant_id is null)
    or
    (role = 'client' and tenant_id is not null)
  )
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  article text,
  description text,
  photos text[] not null default '{}',
  retail_price numeric(12, 2) not null default 0,
  wholesale_price numeric(12, 2) not null default 0,
  quantity integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),

  constraint products_status_check check (status in ('active', 'archived')),
  constraint products_retail_price_check check (retail_price >= 0),
  constraint products_wholesale_price_check check (wholesale_price >= 0),
  constraint products_quantity_check check (quantity >= 0)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  shop_name text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_tenant_id_idx on public.profiles(tenant_id);
create index if not exists tenants_slug_idx on public.tenants(slug);
create index if not exists tenants_public_status_idx on public.tenants(status, subscription_until);
create index if not exists categories_tenant_id_idx on public.categories(tenant_id);
create unique index if not exists categories_tenant_name_unique_idx
  on public.categories(tenant_id, lower(name));
create index if not exists products_tenant_id_idx on public.products(tenant_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_public_status_idx on public.products(tenant_id, status);
create index if not exists products_article_idx on public.products(article);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'superadmin', false)
$$;

create or replace function public.is_active_tenant(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.id = check_tenant_id
      and t.status = 'active'
      and t.subscription_until >= current_date
  )
$$;

create or replace function public.prevent_client_tenant_admin_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.role() <> 'service_role'
     and not public.is_superadmin()
     and (
       new.slug is distinct from old.slug
       or new.status is distinct from old.status
       or new.subscription_until is distinct from old.subscription_until
     )
  then
    raise exception 'Only superadmin can change tenant slug, status, or subscription date.';
  end if;

  return new;
end;
$$;

create or replace function public.ensure_product_category_belongs_to_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null
     and not exists (
       select 1
       from public.categories c
       where c.id = new.category_id
         and c.tenant_id = new.tenant_id
     )
  then
    raise exception 'Product category must belong to the same tenant.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_tenant_admin_changes on public.tenants;
create trigger prevent_client_tenant_admin_changes
before update on public.tenants
for each row
execute function public.prevent_client_tenant_admin_changes();

drop trigger if exists ensure_product_category_belongs_to_tenant on public.products;
create trigger ensure_product_category_belongs_to_tenant
before insert or update on public.products
for each row
execute function public.ensure_product_category_belongs_to_tenant();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;

drop policy if exists "Public can read active subscribed tenants" on public.tenants;
drop policy if exists "Clients can read own tenant" on public.tenants;
drop policy if exists "Clients can update own tenant settings" on public.tenants;
drop policy if exists "Superadmin can manage tenants" on public.tenants;

create policy "Public can read active subscribed tenants"
on public.tenants
for select
to anon, authenticated
using (status = 'active' and subscription_until >= current_date);

create policy "Clients can read own tenant"
on public.tenants
for select
to authenticated
using (id = public.current_tenant_id());

create policy "Clients can update own tenant settings"
on public.tenants
for update
to authenticated
using (id = public.current_tenant_id())
with check (id = public.current_tenant_id());

create policy "Superadmin can manage tenants"
on public.tenants
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Superadmin can manage profiles" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Superadmin can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "Public can read categories of active subscribed tenants" on public.categories;
drop policy if exists "Clients can manage own categories" on public.categories;
drop policy if exists "Superadmin can manage categories" on public.categories;

create policy "Public can read categories of active subscribed tenants"
on public.categories
for select
to anon, authenticated
using (public.is_active_tenant(tenant_id));

create policy "Clients can manage own categories"
on public.categories
for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "Superadmin can manage categories"
on public.categories
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "Public can read active products of active subscribed tenants" on public.products;
drop policy if exists "Clients can manage own products" on public.products;
drop policy if exists "Superadmin can manage products" on public.products;

create policy "Public can read active products of active subscribed tenants"
on public.products
for select
to anon, authenticated
using (status = 'active' and public.is_active_tenant(tenant_id));

create policy "Clients can manage own products"
on public.products
for all
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "Superadmin can manage products"
on public.products
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "Anyone can create leads" on public.leads;
drop policy if exists "Superadmin can manage leads" on public.leads;

create policy "Anyone can create leads"
on public.leads
for insert
to anon, authenticated
with check (true);

create policy "Superadmin can manage leads"
on public.leads
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

grant usage on schema public to anon, authenticated;

grant select on public.tenants to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.leads to anon, authenticated;

grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
