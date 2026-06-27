-- Restrict authenticated sellers from reading other tenants' public rows
-- through the Supabase client API. Public storefront pages are rendered by
-- the server, while anon users can still read active public storefront data.

drop policy if exists "Public can read active subscribed tenants" on public.tenants;
drop policy if exists "Public can read categories of active subscribed tenants" on public.categories;
drop policy if exists "Public can read active products of active subscribed tenants" on public.products;
drop policy if exists "Anon can read active subscribed tenants" on public.tenants;
drop policy if exists "Anon can read categories of active subscribed tenants" on public.categories;
drop policy if exists "Anon can read active products of active subscribed tenants" on public.products;

create policy "Anon can read active subscribed tenants"
on public.tenants
for select
to anon
using (status = 'active' and subscription_until >= current_date);

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
