import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { e2eStatePath, type E2EState } from "./state";

async function loadState() {
  return JSON.parse(await readFile(e2eStatePath, "utf8")) as E2EState;
}

async function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const content = await readFile(envPath, "utf8");

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
      const value = line.slice(equalsIndex + 1).trim();

      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    }
  } catch {
    // The test runner can also receive env values directly.
  }
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

test("seller Supabase session is isolated to its own tenant", async () => {
  await loadLocalEnv();
  const state = await loadState();
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: state.seller.email,
    password: state.seller.password,
  });
  expect(loginError).toBeNull();

  const { data: ownCategories, error: ownCategoryError } = await supabase
    .from("categories")
    .select("id, tenant_id")
    .eq("tenant_id", state.seller.tenantId);
  expect(ownCategoryError).toBeNull();
  expect(ownCategories?.map((category) => category.id)).toContain(
    state.seller.category.id,
  );

  const { data: foreignTenantRows, error: foreignTenantReadError } =
    await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", state.adminTenant.id);
  expect(foreignTenantReadError).toBeNull();
  expect(foreignTenantRows).toEqual([]);

  const { data: foreignCategories, error: foreignCategoryReadError } =
    await supabase
      .from("categories")
      .select("id, tenant_id")
      .eq("tenant_id", state.adminTenant.id);
  expect(foreignCategoryReadError).toBeNull();
  expect(foreignCategories).toEqual([]);

  const { data: foreignProducts, error: foreignProductReadError } =
    await supabase
      .from("products")
      .select("id, tenant_id")
      .eq("tenant_id", state.adminTenant.id);
  expect(foreignProductReadError).toBeNull();
  expect(foreignProducts).toEqual([]);

  const { data: tenantUpdateRows, error: tenantUpdateError } = await supabase
    .from("tenants")
    .update({ name: "Blocked tenant write" })
    .eq("id", state.adminTenant.id)
    .select("id");
  expect(tenantUpdateError).toBeNull();
  expect(tenantUpdateRows).toEqual([]);

  const { error: foreignCategoryInsertError } = await supabase
    .from("categories")
    .insert({
      name: "Blocked foreign category",
      tenant_id: state.adminTenant.id,
    });
  expect(foreignCategoryInsertError).not.toBeNull();

  const { error: crossTenantProductError } = await supabase
    .from("products")
    .insert({
      article: "BLOCKED-CROSS-TENANT",
      category_id: state.adminTenant.categoryId,
      name: "Blocked cross-tenant product",
      quantity: 1,
      retail_price: 1000,
      status: "active",
      tenant_id: state.seller.tenantId,
      wholesale_price: 900,
    });
  expect(crossTenantProductError).not.toBeNull();
});
