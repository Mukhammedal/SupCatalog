import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogHeader } from "./catalog-header";
import { ProductGallery } from "./product-gallery";
import { ProductOrderBox } from "./product-order-box";
import { createAdminClient } from "@/lib/supabase/admin";

type PriceMode = "retail" | "wholesale";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
    productId: string;
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

function money(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function productPrice(product: Product, mode: PriceMode) {
  return mode === "retail" ? product.retail_price : product.wholesale_price;
}

function catalogPath(slug: string, mode: PriceMode) {
  return `/${slug}${mode === "wholesale" ? "/opt" : ""}`;
}

function productPath(slug: string, mode: PriceMode, productId: string) {
  return `${catalogPath(slug, mode)}/products/${productId}`;
}

function isGeneratedPlaceholder(photo?: string) {
  return Boolean(photo?.includes("placehold.co"));
}

function ProductMiniCard({
  categoryName,
  href,
  mode,
  product,
}: {
  categoryName?: string;
  href: string;
  mode: PriceMode;
  product: Product;
}) {
  return (
    <Link
      className="group grid grid-cols-[64px_1fr] gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
      href={href}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {product.photos[0] && !isGeneratedPlaceholder(product.photos[0]) ? (
          <Image
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            height={160}
            src={product.photos[0]}
            width={160}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100 px-2 text-center text-xs font-medium text-slate-400">
            Фото товара
          </div>
        )}
      </div>
      <div className="min-w-0">
        {categoryName ? (
          <span className="text-[11px] font-semibold uppercase text-emerald-700">
            {categoryName}
          </span>
        ) : null}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-950">
          {money(productPrice(product, mode))} ₸
        </p>
      </div>
    </Link>
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

export async function ProductDetailPage({
  params,
  mode,
}: ProductDetailPageProps) {
  const { slug, productId } = await params;
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

  const { data: product } = await admin
    .from("products")
    .select(
      "id, name, article, description, photos, retail_price, wholesale_price, quantity, category_id, status",
    )
    .eq("tenant_id", tenant.id)
    .eq("id", productId)
    .eq("status", "active")
    .single<Product>();

  if (!product) {
    notFound();
  }

  const [{ data: category }, { data: categories }, { data: relatedProducts }] =
    await Promise.all([
      product.category_id
        ? admin
            .from("categories")
            .select("id, name")
            .eq("tenant_id", tenant.id)
            .eq("id", product.category_id)
            .single<Category>()
        : Promise.resolve({ data: null }),
      admin
        .from("categories")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .returns<Category[]>(),
      admin
        .from("products")
        .select(
          "id, name, article, description, photos, retail_price, wholesale_price, quantity, category_id, status",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .neq("id", product.id)
        .limit(4)
        .returns<Product[]>(),
    ]);

  const basePath = catalogPath(tenant.slug, mode);
  const alternateMode = mode === "retail" ? "wholesale" : "retail";
  const categoryById = new Map(
    (categories ?? []).map((item) => [item.id, item.name]),
  );

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <CatalogHeader basePath={basePath} tenant={tenant} />

      <section className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
          <Link className="hover:text-slate-950" href={basePath}>
            Каталог
          </Link>
          <span>/</span>
          {category ? (
            <>
              <Link
                className="hover:text-slate-950"
                href={`${basePath}?category=${category.id}`}
              >
                {category.name}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-slate-950">{product.name}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,680px)_minmax(360px,520px)] xl:justify-center">
          <ProductGallery photos={product.photos} productName={product.name} />

          <aside className="self-start">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {mode === "retail" ? "Розница" : "Опт"}
              </span>
              {category ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {category.name}
                </span>
              ) : null}
            </div>

            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 lg:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-400">
                  Артикул
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950">
                  {product.article || "Не указан"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-400">
                  Склад
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950">
                  {product.quantity} шт.
                </p>
              </div>
              <Link
                className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50"
                href={productPath(tenant.slug, alternateMode, product.id)}
              >
                <p className="text-[11px] font-semibold uppercase text-slate-400">
                  Цена
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950">
                  {mode === "retail" ? "Открыть опт" : "Открыть розницу"}
                </p>
              </Link>
            </div>

            <div className="mt-4">
              <ProductOrderBox
                article={product.article}
                mode={mode}
                price={productPrice(product, mode)}
                productName={product.name}
                quantity={product.quantity}
                shopName={tenant.name}
                whatsapp={tenant.whatsapp}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href={basePath}
              >
                Назад к каталогу
              </Link>
              {tenant.whatsapp ? (
                <a
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Написать продавцу
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="mt-8 grid items-start gap-6 border-t border-slate-200 pt-6 xl:grid-cols-[minmax(0,720px)_340px] xl:justify-center">
          <section className="self-start rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Описание
              </h2>
              {category ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {category.name}
                </span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-600">
                {product.description}
              </p>
            ) : (
              <p className="mt-4 text-[15px] leading-7 text-slate-500">
                Описание пока не заполнено.
              </p>
            )}
          </section>

          <section className="self-start">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Похожие товары
            </h2>
            <div className="grid gap-2.5">
              {(relatedProducts ?? []).map((item) => (
                <ProductMiniCard
                  categoryName={
                    item.category_id ? categoryById.get(item.category_id) : undefined
                  }
                  href={productPath(tenant.slug, mode, item.id)}
                  key={item.id}
                  mode={mode}
                  product={item}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
