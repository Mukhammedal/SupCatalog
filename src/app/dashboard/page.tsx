import Link from "next/link";
import { DashboardShell, money } from "./components";
import { getSellerDashboardData } from "./data";

export default async function DashboardPage() {
  const { categories, expired, products, profile, tenant } =
    await getSellerDashboardData();
  const activeProducts = products.filter((product) => product.status === "active").length;
  const archivedProducts = products.length - activeProducts;
  const recentProducts = products.slice(0, 5);

  return (
    <DashboardShell
      active="home"
      email={profile.email}
      expired={expired}
      tenant={tenant}
    >
      <section className="grid max-w-[1120px] gap-3 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Кабинет продавца
              </p>
              <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-slate-950">
                {tenant?.name ?? "Мой магазин"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {tenant ? `/${tenant.slug}` : "Магазин ещё не создан"}
              </p>
            </div>

            <span
              className={`inline-flex h-8 w-fit items-center rounded-full px-3 text-xs font-semibold ${
                expired
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              }`}
            >
              {expired ? "Каталог закрыт" : "Каталог открыт"}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-[#fafafa] px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Активных товаров
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none">
                {activeProducts}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#fafafa] px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                WhatsApp
              </p>
              <p className="mt-1 truncate text-lg font-semibold">
                {tenant?.whatsapp || "не указан"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Link
            className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-sm transition hover:bg-slate-800"
            href="/dashboard/products/new"
          >
            <span>
              <span className="block text-sm font-semibold">Добавить товар</span>
              <span className="mt-0.5 block text-xs text-slate-300">
                Цена, остаток и фото
              </span>
            </span>
            <span className="text-xl leading-none">+</span>
          </Link>

          <Link
            className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            href="/dashboard/products"
          >
            <span>
              <span className="block text-sm font-semibold">Мои товары</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Цены, остатки, архив
              </span>
            </span>
            <span className="text-lg leading-none text-slate-400">→</span>
          </Link>

          <Link
            className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            href="/dashboard/settings"
          >
            <span>
              <span className="block text-sm font-semibold">Настройки</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Название, WhatsApp, логотип
              </span>
            </span>
            <span className="text-lg leading-none text-slate-400">→</span>
          </Link>
        </div>
      </section>

      <section className="mt-3 flex max-w-[1120px] flex-wrap gap-2">
        <Link
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          href="/dashboard/categories"
        >
          Категории
        </Link>
        {tenant ? (
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href={`/${tenant.slug}`}
          >
            Открыть магазин
          </Link>
        ) : null}
      </section>

      <section className="mt-3 grid max-w-[1120px] gap-3 xl:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Последние товары</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Быстрый обзор каталога
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              href="/dashboard/products"
            >
              Все товары
            </Link>
          </div>

          {recentProducts.length ? (
            <div className="divide-y divide-slate-100">
              {recentProducts.map((product) => (
                <div
                  className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_110px_90px_92px] sm:items-center"
                  key={product.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {product.article || "без артикула"}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                      product.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.status === "active" ? "Активен" : "Архив"}
                  </span>
                  <span className="text-slate-600">
                    Остаток: {product.quantity}
                  </span>
                  <span className="font-semibold text-slate-950">
                    {money(product.retail_price)} ₸
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-slate-500">
              Товаров пока нет.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Сводка</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Всего товаров</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-slate-500">В архиве</span>
              <span className="font-semibold">{archivedProducts}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Категории</span>
              <span className="font-semibold">{categories.length}</span>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
