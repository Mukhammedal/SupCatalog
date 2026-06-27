-- Tighten tenant isolation for authenticated sellers.
-- Run this in Supabase SQL Editor after 001_initial_schema_and_rls.sql.

drop policy if exists "Public can read categories of active subscribed tenants" on public.categories;
drop policy if exists "Public can read active products of active subscribed tenants" on public.products;

create policy "Anon can read categories of active subscribed tenants"
on public.categories
for select
to anon
using (public.is_active_tenant(tenant_id));

create policy "Anon can read active products of active subscribed tenants"
on public.products
for select
to anon
using (status = 'active' and public.is_active_tenant(tenant_id));
