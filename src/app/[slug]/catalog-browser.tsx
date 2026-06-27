"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const PRODUCTS_PER_PAGE = 12;

type PriceMode = "retail" | "wholesale";

type Tenant = {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
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
};

type InitialFilters = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  stock?: string;
};

type CatalogBrowserProps = {
  categories: Category[];
  initialFilters: InitialFilters;
  mode: PriceMode;
  products: Product[];
  tenant: Tenant;
};

function numberParam(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function productPrice(product: Product, mode: PriceMode) {
  return Number(mode === "retail" ? product.retail_price : product.wholesale_price);
}

function catalogPath(slug: string, mode: PriceMode) {
  return `/${slug}${mode === "wholesale" ? "/opt" : ""}`;
}

function isGeneratedPlaceholder(photo?: string) {
  return Boolean(photo?.includes("placehold.co"));
}

function ProductVisual({
  categoryName,
  product,
}: {
  categoryName?: string;
  product: Product;
}) {
  const photo = product.photos[0];

  if (photo && !isGeneratedPlaceholder(photo)) {
    return (
      <Image
        alt={product.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        height={360}
        src={photo}
        width={480}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_54%,#e2e8f0_100%)] p-4 text-center">
      <div className="mb-3 h-8 w-8 rounded-full border border-slate-300 bg-white/70" />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {categoryName || "Каталог"}
        </p>
        <p className="mt-1.5 max-w-36 text-xs font-medium leading-4 text-slate-500">
          Фото товара можно добавить в кабинете.
        </p>
      </div>
    </div>
  );
}

function ProductCard({
  categoryName,
  mode,
  product,
  productHref,
}: {
  categoryName?: string;
  mode: PriceMode;
  product: Product;
  productHref: string;
}) {
  const price = productPrice(product, mode);

  return (
    <article className="group h-full min-w-0 overflow-hidden rounded-[1.05rem] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)] sm:rounded-[1.15rem]">
      <Link
        className="relative block aspect-square min-w-0 overflow-hidden bg-slate-100 sm:aspect-[4/2.65]"
        href={productHref}
      >
        {categoryName ? (
          <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:left-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
            {categoryName}
          </span>
        ) : null}

        <ProductVisual categoryName={categoryName} product={product} />
      </Link>

      <div className="min-w-0 p-2.5 sm:p-3">
        <div className="min-h-11 sm:min-h-12">
          <Link href={productHref}>
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-4 text-slate-950 transition hover:text-emerald-600 sm:text-sm sm:leading-5">
              {product.name}
            </h3>
          </Link>
          {product.description ? (
            <p className="mt-1 hidden text-xs leading-4 text-slate-500 sm:line-clamp-2">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex items-end justify-between gap-1.5 border-t border-slate-100 pt-2">
          <div className="min-w-0">
            {product.article ? (
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:text-[11px] sm:tracking-[0.12em]">
                {product.article}
              </p>
            ) : null}
            <p className="mt-1 whitespace-nowrap text-base font-semibold tracking-tight text-slate-950 sm:text-xl">
              {money(price)} ₸
            </p>
          </div>
          <span
            className={
              product.quantity > 0
                ? "shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 sm:px-3 sm:text-xs"
                : "shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 sm:px-3 sm:text-xs"
            }
          >
            {product.quantity > 0 ? `${product.quantity} шт.` : "Нет"}
          </span>
        </div>

        <form className="mt-2 grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-1.5 sm:grid-cols-[52px_1fr] sm:gap-2">
          <input
            className="h-9 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-1.5 text-center text-sm font-semibold outline-none transition focus:border-slate-500 focus:bg-white sm:px-2"
            defaultValue={1}
            min={1}
            max={Math.max(product.quantity, 1)}
            name="quantity"
            type="number"
          />
          <button
            className="h-9 min-w-0 rounded-xl bg-emerald-500 px-2 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:px-3 sm:text-sm"
            data-add-to-cart={product.id}
            disabled={product.quantity <= 0}
            type="button"
          >
            {product.quantity > 0 ? "В корзину" : "Нет в наличии"}
          </button>
        </form>
      </div>
    </article>
  );
}

function pageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", currentPage, "ellipsis-end", totalPages] as const;
}

function Pagination({
  currentPage,
  onPageChange,
  totalPages,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Страницы товаров"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        ‹ Назад
      </button>

      {pageItems(currentPage, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            aria-current={item === currentPage ? "page" : undefined}
            className={
              item === currentPage
                ? "h-10 min-w-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-200"
                : "h-10 min-w-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-slate-50"
            }
            key={item}
            onClick={() => onPageChange(item)}
            type="button"
          >
            {item}
          </button>
        ) : (
          <span
            className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-medium text-slate-400"
            key={item}
          >
            ...
          </span>
        ),
      )}

      <button
        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Вперёд ›
      </button>
    </nav>
  );
}

export function CatalogBrowser({
  categories,
  initialFilters,
  mode,
  products,
  tenant,
}: CatalogBrowserProps) {
  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [categoryId, setCategoryId] = useState(initialFilters.category ?? "");
  const [minPrice, setMinPrice] = useState(initialFilters.min ?? "");
  const [maxPrice, setMaxPrice] = useState(initialFilters.max ?? "");
  const [stock, setStock] = useState(initialFilters.stock ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const basePath = catalogPath(tenant.slug, mode);
  const alternateHref =
    mode === "retail" ? `/${tenant.slug}/opt` : `/${tenant.slug}`;
  const modeLabel = mode === "retail" ? "Розница" : "Опт";

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = numberParam(minPrice);
    const max = numberParam(maxPrice);

    return products.filter((product) => {
      const price = productPrice(product, mode);
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.article?.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !categoryId || product.category_id === categoryId;
      const matchesMin = min === null || price >= min;
      const matchesMax = max === null || price <= max;
      const matchesStock = stock !== "in" || product.quantity > 0;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesMin &&
        matchesMax &&
        matchesStock
      );
    });
  }, [categoryId, maxPrice, minPrice, mode, products, query, stock]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = visibleProducts.slice(
    (safeCurrentPage - 1) * PRODUCTS_PER_PAGE,
    safeCurrentPage * PRODUCTS_PER_PAGE,
  );
  const pageStart =
    visibleProducts.length === 0
      ? 0
      : (safeCurrentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const pageEnd = Math.min(
    safeCurrentPage * PRODUCTS_PER_PAGE,
    visibleProducts.length,
  );

  function resetFilters() {
    setQuery("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setStock("");
    setCurrentPage(1);
  }

  function updateFilter(update: () => void) {
    update();
    setCurrentPage(1);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-6">
      <aside className="lg:self-start">
        <div className="overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 p-3 sm:p-3">
            <p className="text-sm font-semibold">Категории</p>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length} разделов
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto p-2 lg:grid lg:overflow-visible lg:p-2.5">
            <button
              className={
                !categoryId
                  ? "max-w-48 shrink-0 truncate rounded-xl bg-slate-950 px-3 py-2 text-left text-sm font-bold text-white"
                  : "max-w-48 shrink-0 truncate rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              }
              onClick={() => updateFilter(() => setCategoryId(""))}
              type="button"
            >
              Все товары
            </button>
            {categories.map((category) => (
              <button
                className={
                  categoryId === category.id
                    ? "max-w-48 shrink-0 truncate rounded-xl bg-slate-950 px-3 py-2 text-left text-sm font-bold text-white"
                    : "max-w-48 shrink-0 truncate rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                }
                key={category.id}
                onClick={() => updateFilter(() => setCategoryId(category.id))}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 overflow-hidden">
        <form
          className="grid grid-cols-2 gap-2 rounded-[1.15rem] border border-slate-200 bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-2.5 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_105px_105px_120px_auto_auto]"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            className="col-span-2 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white xl:col-span-1"
            name="q"
            onChange={(event) =>
              updateFilter(() => setQuery(event.target.value))
            }
            placeholder="Поиск или артикул"
            value={query}
          />
          <input
            className="h-10 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            min="0"
            name="min"
            onChange={(event) =>
              updateFilter(() => setMinPrice(event.target.value))
            }
            placeholder="Мин ₸"
            type="number"
            value={minPrice}
          />
          <input
            className="h-10 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            min="0"
            name="max"
            onChange={(event) =>
              updateFilter(() => setMaxPrice(event.target.value))
            }
            placeholder="Макс ₸"
            type="number"
            value={maxPrice}
          />
          <select
            className="h-10 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            name="stock"
            onChange={(event) =>
              updateFilter(() => setStock(event.target.value))
            }
            value={stock}
          >
            <option value="">Все</option>
            <option value="in">В наличии</option>
          </select>
          <button
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
            onClick={resetFilters}
            type="button"
          >
            Сброс
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            href={alternateHref}
          >
            {mode === "retail" ? "Опт" : "Розница"}
          </Link>
        </form>

        <p className="mt-3 text-sm font-semibold text-slate-500 sm:mt-4">
          {modeLabel}: показано {pageStart}-{pageEnd} из{" "}
          {visibleProducts.length} товаров
        </p>

        {visibleProducts.length ? (
          <>
            <div
              className="mt-3 grid min-w-0 grid-cols-2 gap-2.5 sm:mt-4 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              {paginatedProducts.map((product) => (
                <ProductCard
                  categoryName={
                    product.category_id
                      ? categoryById.get(product.category_id)
                      : undefined
                  }
                  key={product.id}
                  mode={mode}
                  product={product}
                  productHref={`${basePath}/products/${product.id}`}
                />
              ))}
            </div>
            <Pagination
              currentPage={safeCurrentPage}
              onPageChange={setCurrentPage}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-500">
            По этим фильтрам товаров нет.
          </div>
        )}
      </div>
    </div>
  );
}
