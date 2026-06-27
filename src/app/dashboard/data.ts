import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  subscription_until: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  article: string | null;
  description: string | null;
  photos: string[];
  retail_price: number;
  wholesale_price: number;
  quantity: number;
  category_id: string | null;
  status: "active" | "archived";
  created_at: string;
};

function isSubscriptionExpired(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`) < today;
}

export async function getSellerDashboardData() {
  const profile = await requireRole("client");
  const supabase = await createClient();

  const [{ data: tenant }, { data: categories }, { data: products }] =
    await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id, name, slug, logo_url, description, phone, whatsapp, address, instagram_url, tiktok_url, subscription_until",
        )
        .eq("id", profile.tenant_id)
        .single<Tenant>(),
      supabase
        .from("categories")
        .select("id, name")
        .eq("tenant_id", profile.tenant_id)
        .order("name", { ascending: true })
        .returns<Category[]>(),
      supabase
        .from("products")
        .select(
          "id, name, article, description, photos, retail_price, wholesale_price, quantity, category_id, status, created_at",
        )
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .returns<Product[]>(),
    ]);

  return {
    categories: categories ?? [],
    expired: tenant ? isSubscriptionExpired(tenant.subscription_until) : false,
    products: products ?? [],
    profile,
    tenant,
  };
}
