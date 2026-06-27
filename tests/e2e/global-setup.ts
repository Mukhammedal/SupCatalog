import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanupE2EData, createE2EAdminClient } from "./cleanup";
import { e2eStatePath, type E2EState } from "./state";

function parseEnvFile(content: string) {
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = await readFile(envPath, "utf8");
    const parsed = parseEnvFile(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional. The test run can also inherit environment variables directly.
  }
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function uniqueSuffix() {
  return randomBytes(4).toString("hex");
}

function seedPassword(prefix: string) {
  return `${prefix}-${randomBytes(6).toString("hex")}-A1`;
}

async function createAuthUser(
  admin: SupabaseClient,
  input: {
    email: string;
    password: string;
    appMetadata: Record<string, string | null>;
    userMetadata: Record<string, string | null>;
  },
) {
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: input.appMetadata,
    user_metadata: input.userMetadata,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Failed to create auth user ${input.email}.`);
  }

  return data.user;
}

export default async function globalSetup() {
  await loadLocalEnv();

  requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  requireEnv(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
  );

  const admin = createE2EAdminClient();
  await cleanupE2EData(admin);

  const suffix = uniqueSuffix();
  const adminEmail = `e2e-superadmin-${suffix}@example.com`;
  const adminPassword = seedPassword("Admin");
  const adminClientEmail = `e2e-admin-client-${suffix}@example.com`;
  const adminClientPassword = seedPassword("Client");
  const sellerEmail = `e2e-seller-${suffix}@example.com`;
  const sellerPassword = seedPassword("Seller");
  const adminTenantSlug = `admin-shop-${suffix}`;
  const sellerTenantSlug = `seller-shop-${suffix}`;

  const adminUser = await createAuthUser(admin, {
    email: adminEmail,
    password: adminPassword,
    appMetadata: {
      role: "superadmin",
    },
    userMetadata: {
      role: "superadmin",
    },
  });

  const sellerUser = await createAuthUser(admin, {
    email: sellerEmail,
    password: sellerPassword,
    appMetadata: {
      role: "client",
      tenant_id: "",
    },
    userMetadata: {
      role: "client",
      tenant_id: "",
    },
  });

  const { data: adminTenant, error: adminTenantError } = await admin
    .from("tenants")
    .insert({
      name: `Admin Shop ${suffix}`,
      slug: adminTenantSlug,
      whatsapp: "77001230001",
      status: "active",
      subscription_until: toDateInputValue(addDays(new Date(), 30)),
    })
    .select("id, name, slug")
    .single<{ id: string; name: string; slug: string }>();

  if (adminTenantError || !adminTenant) {
    throw new Error(adminTenantError?.message ?? "Failed to seed admin tenant.");
  }

  const { error: adminProfileError } = await admin.from("profiles").upsert({
    id: adminUser.id,
    email: adminEmail,
    role: "superadmin",
    tenant_id: null,
  });

  if (adminProfileError) {
    throw new Error(adminProfileError.message);
  }

  const adminClientUser = await createAuthUser(admin, {
    email: adminClientEmail,
    password: adminClientPassword,
    appMetadata: {
      role: "client",
      tenant_id: adminTenant.id,
    },
    userMetadata: {
      role: "client",
      tenant_id: adminTenant.id,
    },
  });

  const { error: adminClientProfileError } = await admin.from("profiles").upsert({
    id: adminClientUser.id,
    email: adminClientEmail,
    role: "client",
    tenant_id: adminTenant.id,
  });

  if (adminClientProfileError) {
    throw new Error(adminClientProfileError.message);
  }

  const { data: adminCategory, error: adminCategoryError } = await admin
    .from("categories")
    .insert({
      tenant_id: adminTenant.id,
      name: `Admin Private ${suffix}`,
    })
    .select("id, name")
    .single<{ id: string; name: string }>();

  if (adminCategoryError || !adminCategory) {
    throw new Error(
      adminCategoryError?.message ?? "Failed to seed admin tenant category.",
    );
  }

  const { data: adminProduct, error: adminProductError } = await admin
    .from("products")
    .insert({
      tenant_id: adminTenant.id,
      name: `Admin Private Product ${suffix}`,
      article: `AP-${suffix}`,
      description: "Private product used for tenant isolation tests.",
      photos: [],
      retail_price: 99000,
      wholesale_price: 88000,
      quantity: 5,
      category_id: adminCategory.id,
      status: "active",
    })
    .select("id, name")
    .single<{ id: string; name: string }>();

  if (adminProductError || !adminProduct) {
    throw new Error(
      adminProductError?.message ?? "Failed to seed admin tenant product.",
    );
  }

  const { data: sellerTenant, error: sellerTenantError } = await admin
    .from("tenants")
    .insert({
      name: `Seller Shop ${suffix}`,
      slug: sellerTenantSlug,
      description: "Seeded seller store for Playwright.",
      phone: "77001230002",
      whatsapp: "77001230002",
      address: "Almaty",
      instagram_url: "https://instagram.com/example-shop",
      tiktok_url: "https://tiktok.com/@example-shop",
      status: "active",
      subscription_until: toDateInputValue(addDays(new Date(), 30)),
    })
    .select("id, name, slug")
    .single<{ id: string; name: string; slug: string }>();

  if (sellerTenantError || !sellerTenant) {
    throw new Error(sellerTenantError?.message ?? "Failed to seed seller tenant.");
  }

  const { error: sellerProfileError } = await admin.from("profiles").upsert({
    id: sellerUser.id,
    email: sellerEmail,
    role: "client",
    tenant_id: sellerTenant.id,
  });

  if (sellerProfileError) {
    throw new Error(sellerProfileError.message);
  }

  const { data: category, error: categoryError } = await admin
    .from("categories")
    .insert({
      tenant_id: sellerTenant.id,
      name: `Accessories ${suffix}`,
    })
    .select("id, name")
    .single<{ id: string; name: string }>();

  if (categoryError || !category) {
    throw new Error(categoryError?.message ?? "Failed to seed category.");
  }

  const { data: activeProduct, error: activeProductError } = await admin
    .from("products")
    .insert({
      tenant_id: sellerTenant.id,
      name: `Wireless Headphones ${suffix}`,
      article: `WH-${suffix}`,
      description: "Seeded active product for catalog tests.",
      photos: [],
      retail_price: 25000,
      wholesale_price: 21000,
      quantity: 12,
      category_id: category.id,
      status: "active",
    })
    .select("id, name, article")
    .single<{ id: string; name: string; article: string }>();

  if (activeProductError || !activeProduct) {
    throw new Error(
      activeProductError?.message ?? "Failed to seed active product.",
    );
  }

  const { data: archivedProduct, error: archivedProductError } = await admin
    .from("products")
    .insert({
      tenant_id: sellerTenant.id,
      name: `Old Cable ${suffix}`,
      article: `OC-${suffix}`,
      description: "Seeded archived product for dashboard tests.",
      photos: [],
      retail_price: 7000,
      wholesale_price: 5000,
      quantity: 0,
      category_id: category.id,
      status: "archived",
    })
    .select("id, name, article")
    .single<{ id: string; name: string; article: string }>();

  if (archivedProductError || !archivedProduct) {
    throw new Error(
      archivedProductError?.message ?? "Failed to seed archived product.",
    );
  }

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      name: "Aigul",
      phone: "77005550101",
      shop_name: `Lead Shop ${suffix}`,
      handled: false,
    })
    .select("id, shop_name")
    .single<{ id: string; shop_name: string }>();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Failed to seed lead.");
  }

  const state: E2EState = {
    admin: {
      email: adminEmail,
      password: adminPassword,
    },
    adminTenant: {
      categoryId: adminCategory.id,
      id: adminTenant.id,
      name: adminTenant.name,
      productId: adminProduct.id,
      slug: adminTenant.slug,
    },
    adminClient: {
      email: adminClientEmail,
      password: adminClientPassword,
      tenantId: adminTenant.id,
    },
    lead: {
      id: lead.id,
      shopName: lead.shop_name,
    },
    seller: {
      email: sellerEmail,
      password: sellerPassword,
      tenantId: sellerTenant.id,
      tenantName: sellerTenant.name,
      tenantSlug: sellerTenant.slug,
      category: {
        id: category.id,
        name: category.name,
      },
      activeProduct: {
        id: activeProduct.id,
        name: activeProduct.name,
        article: activeProduct.article,
      },
      archivedProduct: {
        id: archivedProduct.id,
        name: archivedProduct.name,
        article: archivedProduct.article,
      },
    },
  };

  await mkdir(path.dirname(e2eStatePath), { recursive: true });
  await writeFile(e2eStatePath, JSON.stringify(state, null, 2), "utf8");
}
