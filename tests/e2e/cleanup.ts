import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function isE2EEmail(email: string | undefined) {
  return (
    Boolean(email) &&
    (email!.startsWith("e2e-") || email!.startsWith("created-")) &&
    email!.endsWith("@example.com")
  );
}

function isE2ESlug(slug: string) {
  return (
    slug.startsWith("admin-shop-") ||
    slug.startsWith("seller-shop-") ||
    slug.startsWith("created-")
  );
}

export function createE2EAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function cleanupE2EData(admin: SupabaseClient) {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .returns<{ id: string; email: string }[]>();

  const profileIds = (profiles ?? [])
    .filter((profile) => isE2EEmail(profile.email))
    .map((profile) => profile.id);

  if (profileIds.length) {
    await admin.from("profiles").delete().in("id", profileIds);
  }

  let page = 1;
  const userIds: string[] = [];

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    for (const user of data.users) {
      if (isE2EEmail(user.email)) {
        userIds.push(user.id);
      }
    }

    if (data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  for (const userId of userIds) {
    await admin.auth.admin.deleteUser(userId);
  }

  const { data: tenants } = await admin
    .from("tenants")
    .select("id, slug")
    .or("slug.like.admin-shop-%,slug.like.seller-shop-%,slug.like.created-%")
    .returns<{ id: string; slug: string }[]>();

  const tenantIds = (tenants ?? [])
    .filter((tenant) => isE2ESlug(tenant.slug))
    .map((tenant) => tenant.id);

  if (tenantIds.length) {
    await admin.from("tenants").delete().in("id", tenantIds);
  }

  await admin.from("leads").delete().like("shop_name", "Lead Shop %");
}
