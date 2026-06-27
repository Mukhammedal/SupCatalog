import Image from "next/image";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "./catalog-browser";
import { CatalogCart, type CartProduct } from "./catalog-cart";
import { CatalogHeader } from "./catalog-header";
import { createAdminClient } from "@/lib/supabase/admin";

type PriceMode = "retail" | "wholesale";

type CatalogPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    stock?: string;
  }>;
  mode: PriceMode;
};

type Tenant = {
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
  status: "active" | "archived";
  subscription_until: string;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
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
};

function isUnavailable(tenant: Tenant) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    tenant.status !== "active" ||
    new Date(`${tenant.subscription_until}T00:00:00`) < today
  );
}

function productPrice(product: Product, mode: PriceMode) {
  return mode === "retail" ? product.retail_price : product.wholesale_price;
}

function catalogPath(slug: string, mode: PriceMode) {
  return `/${slug}${mode === "wholesale" ? "/opt" : ""}`;
}

function normalizeWhatsapp(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}

function StoreMark({ tenant }: { tenant: Tenant }) {
  if (tenant.logo_url) {
    return (
      <Image
        alt={tenant.name}
        className="h-11 w-11 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200"
        height={44}
        src={tenant.logo_url}
        width={44}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-200">
      {tenant.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function UnavailableCatalog() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">
          Каталог временно недоступен
        </h1>
        <p className="mt-4 leading-7 text-slate-500">
          Магазин закрыт или подписка истекла.
        </p>
      </section>
    </main>
  );
}

function EmptyCatalog({ tenant }: { tenant: Tenant }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <StoreMark tenant={tenant} />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Скоро здесь появятся товары
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-slate-500">
            Продавец уже получил пустой каталог и скоро наполнит его.
          </p>
        </div>
      </div>
    </div>
  );
}

function CatalogFooter({ tenant }: { tenant: Tenant }) {
  const links = [
    {
      label: "WhatsApp",
      type: "whatsapp",
      href: normalizeWhatsapp(tenant.whatsapp),
    },
    { label: "Instagram", type: "instagram", href: tenant.instagram_url },
    { label: "TikTok", type: "tiktok", href: tenant.tiktok_url },
  ].filter((link): link is { label: string; type: string; href: string } =>
    Boolean(link.href),
  );

  function SocialIcon({ type }: { type: string }) {
    if (type === "instagram") {
      return (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
          <rect height="15" rx="5" stroke="currentColor" strokeWidth="2.2" width="15" x="4.5" y="4.5" />
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="17" cy="7" fill="currentColor" r="1.2" />
        </svg>
      );
    }

    if (type === "tiktok") {
      return (
        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.4 3.5c.5 2.6 2 4.1 4.4 4.3v3.4a8.2 8.2 0 0 1-4.3-1.3v6.4c0 3.3-2.4 5.7-5.8 5.7-3.1 0-5.5-2.1-5.5-5.1 0-3.3 2.6-5.5 6.2-5.2v3.5c-1.6-.3-2.6.5-2.6 1.7 0 1 .8 1.7 1.9 1.7 1.3 0 2.1-.8 2.1-2.4V3.5h3.6Z" />
        </svg>
      );
    }

    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.2 19.2 6.3 16A7.6 7.6 0 1 1 9 18.4l-3.8.8Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9.1 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.4.5c.5 1 1.3 1.8 2.4 2.4l.5-.4c.2-.2.5-.2.8-.1l1.3.6c.3.1.5.3.5.6v.5c0 .3-.1.6-.4.8-.5.3-1.2.5-1.8.4-2.8-.5-5.2-2.7-5.9-5.4-.2-.7 0-1.4.3-2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  function socialClass(type: string) {
    if (type === "instagram") {
      return "border-pink-200 text-pink-500 hover:border-pink-300 hover:bg-pink-50";
    }

    if (type === "tiktok") {
      return "border-slate-200 text-slate-950 hover:border-slate-300 hover:bg-slate-50";
    }

    return "border-emerald-200 text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50";
  }

  return (
    <footer className="mt-8 border-t border-slate-200 py-5">
      <div className="max-w-sm pb-14 sm:pb-0">
        <div className="flex items-center gap-3">
          <StoreMark tenant={tenant} />
          <div>
            <p className="text-base font-semibold text-slate-950">{tenant.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              Каталог товаров с заказом через WhatsApp
            </p>
          </div>
        </div>

        {links.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {links.map((link) => (
              <a
                aria-label={link.label}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white shadow-sm transition hover:shadow-md ${socialClass(link.type)}`}
                href={link.href}
                key={link.label}
                rel="noopener noreferrer"
                target="_blank"
                title={link.label}
              >
                <SocialIcon type={link.type} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

export async function CatalogPage({
  params,
  searchParams,
  mode,
}: CatalogPageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "id, name, slug, logo_url, description, phone, whatsapp, address, instagram_url, tiktok_url, status, subscription_until",
    )
    .eq("slug", slug)
    .single<Tenant>();

  if (!tenant) {
    notFound();
  }

  if (isUnavailable(tenant)) {
    return <UnavailableCatalog />;
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    admin
      .from("categories")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true })
      .returns<Category[]>(),
    admin
      .from("products")
      .select(
        "id, name, article, description, photos, retail_price, wholesale_price, quantity, category_id, status",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "active")
      .order("name", { ascending: true })
      .returns<Product[]>(),
  ]);

  const activeProducts = products ?? [];
  const basePath = catalogPath(tenant.slug, mode);
  const cartProducts: CartProduct[] = activeProducts.map((product) => ({
    id: product.id,
    name: product.name,
    article: product.article,
    price: productPrice(product, mode),
    quantity: product.quantity,
  }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f6f8] text-slate-950">
      <CatalogHeader basePath={basePath} tenant={tenant} />

      <section className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
        {activeProducts.length === 0 ? (
          <div>
            <EmptyCatalog tenant={tenant} />
          </div>
        ) : (
          <CatalogBrowser
            categories={categories ?? []}
            initialFilters={filters}
            mode={mode}
            products={activeProducts}
            tenant={tenant}
          />
        )}

        <CatalogFooter tenant={tenant} />
      </section>

      <CatalogCart
        mode={mode}
        products={cartProducts}
        shopName={tenant.name}
        slug={tenant.slug}
        whatsapp={tenant.whatsapp}
      />
    </main>
  );
}
