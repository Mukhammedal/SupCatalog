import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import {
  activateProduct,
  addCategory,
  addProduct,
  archiveProduct,
  deleteCategory,
  updateProduct,
  updateStorefront,
} from "@/app/dashboard/actions";
import { CategoryInlineCreate } from "./category-inline-create";
import type { Category, Product, Tenant } from "./data";
import { ProductPhotoInput } from "./product-photo-input";
import { SubmitOnceButton, SubmitOnceForm } from "./submit-once-form";

export const panelClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
export const labelClass = "block text-sm font-semibold text-slate-700";
export const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 outline-none transition focus:border-slate-500 focus:bg-white";
export const textareaClass =
  "mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none transition focus:border-slate-500 focus:bg-white";
export const fileClass =
  "mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-500";
export const primaryButtonClass =
  "h-10 rounded-xl bg-slate-950 px-4 font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800";
export const dangerButtonClass =
  "h-9 rounded-xl border border-rose-200 bg-rose-50 px-3.5 font-semibold text-rose-700 transition hover:bg-rose-100";

export function money(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function settingsErrorMessage(error?: string) {
  switch (error) {
    case "too-large":
      return "Логотип больше 8 MB. Выбери файл меньше.";
    case "too-many":
      return "Для логотипа можно выбрать только один файл.";
    case "storage":
    case "upload":
      return "Логотип не загрузился. Проверь файл или настройки storage.";
    case "save":
      return "Не удалось сохранить настройки. Попробуй ещё раз.";
    default:
      return null;
  }
}

function navClass(active: boolean) {
  return active
    ? "rounded-lg bg-slate-950 px-3 py-2 font-semibold text-white shadow-sm"
    : "rounded-lg px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950";
}

export function DashboardShell({
  active,
  children,
  email,
  expired,
  tenant,
}: {
  active: "home" | "products" | "new" | "categories" | "settings";
  children: ReactNode;
  email: string;
  expired: boolean;
  tenant: Tenant | null;
}) {
  const nav = [
    { icon: "□", id: "home", href: "/dashboard", label: "Панель" },
    { icon: "▧", id: "products", href: "/dashboard/products", label: "Товары" },
    { icon: "+", id: "new", href: "/dashboard/products/new", label: "Добавить" },
    { icon: "⚙", id: "settings", href: "/dashboard/settings", label: "Настройки" },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
          <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-sm">
              {tenant?.name.slice(0, 1).toUpperCase() ?? "A"}
            </span>
            <span className="truncate text-base font-semibold tracking-tight">
              {tenant?.name ?? "Ali group product"}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {tenant ? (
              <Link
                className="hidden h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                href={`/${tenant.slug}`}
              >
                Магазин
              </Link>
            ) : null}
            <span className="hidden max-w-[220px] truncate text-sm font-medium text-slate-500 lg:block">
              {email}
            </span>
            <form action={logout}>
              <button className="h-9 rounded-lg bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] lg:grid-cols-[208px_1fr]">
        <aside className="hidden min-h-[calc(100vh-64px)] border-r border-slate-200 bg-white px-3 py-4 lg:block">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Управление
          </p>
          <nav className="mt-3 grid gap-1">
            {nav.map((item) => (
              <Link
                className={`${navClass(active === item.id)} flex items-center gap-2.5 text-sm`}
                href={item.href}
                key={item.id}
              >
                <span className="w-4 text-center text-sm leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-7">
          <nav className="mb-4 flex gap-2 overflow-x-auto text-sm lg:hidden">
            {nav.map((item) => (
              <Link
                className={navClass(active === item.id)}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {expired ? (
            <div className="mb-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
              Подписка истекла. Каталог закрыт для покупателей до продления.
            </div>
          ) : null}

          {children}
        </section>
      </div>
    </main>
  );
}

export function CategorySelect({
  categories,
  defaultValue,
  noTopMargin = false,
}: {
  categories: Category[];
  defaultValue?: string | null;
  noTopMargin?: boolean;
}) {
  return (
    <select
      className={
        noTopMargin
          ? "h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-500"
          : inputClass
      }
      defaultValue={defaultValue ?? ""}
      name="categoryId"
    >
      <option value="">Без категории</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export function AddProductForm({
  categories,
  error,
}: {
  categories: Category[];
  error?: string;
}) {
  const errorMessage =
    error === "too-many"
      ? "Можно загрузить максимум 12 фото."
      : error === "too-large"
        ? "Одно из фото больше 8 MB. Выбери файл меньше."
        : error === "storage"
          ? "Фото не загрузились. Проверь настройки storage."
          : error === "save"
            ? "Товар не сохранился. Попробуй ещё раз."
            : error === "upload"
              ? "Фото не загрузились. Попробуй ещё раз."
              : null;

  return (
    <section className="mx-auto w-full max-w-[780px] rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.045)] sm:p-5">
      <h2 className="text-xl font-semibold tracking-tight">Добавить товар</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        Заполните основные поля. Описание и категорию можно добавить ниже.
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <SubmitOnceForm action={addProduct} className="mt-5 grid gap-3">
        <label className={labelClass}>
          Название товара
          <input
            className={inputClass}
            name="name"
            placeholder="Например: AirPods Pro"
            required
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Цена
            <input
              className={inputClass}
              min="0"
              name="retailPrice"
              placeholder="25000"
              required
              type="number"
            />
          </label>
          <label className={labelClass}>
            Оптовая цена
            <input
              className={inputClass}
              min="0"
              name="wholesalePrice"
              placeholder="22000"
              required
              type="number"
            />
          </label>
          <label className={labelClass}>
            Количество
            <input
              className={inputClass}
              min="0"
              name="quantity"
              placeholder="10"
              required
              type="number"
            />
          </label>
        </div>

        <ProductPhotoInput
          helpText="Можно выбрать до 12 фото, до 8 MB каждое."
          label="Фото товара"
        />

        <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Дополнительно: описание, артикул, категория
          </summary>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Артикул
                <input className={inputClass} name="article" />
              </label>
              <label className={labelClass}>
                Категория
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(160px,200px)_40px]">
                  <CategorySelect categories={categories} noTopMargin />
                  <CategoryInlineCreate />
                </div>
              </label>
            </div>
            <label className={labelClass}>
              Описание
              <textarea className={textareaClass} name="description" />
            </label>
          </div>
        </details>

        <SubmitOnceButton
          className="h-11 rounded-2xl bg-slate-950 px-5 font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400 disabled:shadow-none disabled:hover:bg-slate-400"
          pendingLabel="Добавляем..."
        >
          Добавить товар
        </SubmitOnceButton>
      </SubmitOnceForm>
    </section>
  );
}

export function ProductList({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  return (
    <section className="grid max-w-[1120px] gap-3">
      {products.length ? (
        products.map((product) => (
          <article
            className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)]"
            key={product.id}
          >
            <div className="grid gap-3 md:grid-cols-[76px_1fr_auto] md:items-start">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {product.photos[0] ? (
                  <Image
                    alt={product.name}
                    className="h-full w-full object-cover"
                    height={96}
                    src={product.photos[0]}
                    width={96}
                  />
                ) : null}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {product.status === "active" ? "Активен" : "Архив"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  Артикул: {product.article || "не указан"} · Остаток:{" "}
                  {product.quantity}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950">
                  Цена {money(product.retail_price)} ₸ · Опт{" "}
                  {money(product.wholesale_price)} ₸
                </p>
              </div>

              <form
                action={
                  product.status === "archived" ? activateProduct : archiveProduct
                }
              >
                <input name="productId" type="hidden" value={product.id} />
                <button
                  className={
                    product.status === "archived"
                      ? "h-9 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      : "h-9 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  }
                >
                  {product.status === "archived" ? "Активировать" : "В архив"}
                </button>
              </form>
            </div>

            <details className="mt-3 border-t border-slate-100 pt-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                Изменить товар
              </summary>

              <form action={updateProduct} className="mt-4 grid gap-3">
                <input name="productId" type="hidden" value={product.id} />
                {product.photos.map((photo) => (
                  <input
                    key={photo}
                    name="existingPhotos"
                    type="hidden"
                    value={photo}
                  />
                ))}

                <div className="grid gap-3 md:grid-cols-2">
                  <label className={labelClass}>
                    Название
                    <input
                      className={inputClass}
                      defaultValue={product.name}
                      name="name"
                      required
                    />
                  </label>
                  <label className={labelClass}>
                    Артикул
                    <input
                      className={inputClass}
                      defaultValue={product.article ?? ""}
                      name="article"
                    />
                  </label>
                </div>

                <label className={labelClass}>
                  Описание
                  <textarea
                    className={textareaClass}
                    defaultValue={product.description ?? ""}
                    name="description"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-5">
                  <label className={labelClass}>
                    Цена
                    <input
                      className={inputClass}
                      defaultValue={product.retail_price}
                      min="0"
                      name="retailPrice"
                      required
                      type="number"
                    />
                  </label>
                  <label className={labelClass}>
                    Опт
                    <input
                      className={inputClass}
                      defaultValue={product.wholesale_price}
                      min="0"
                      name="wholesalePrice"
                      required
                      type="number"
                    />
                  </label>
                  <label className={labelClass}>
                    Кол-во
                    <input
                      className={inputClass}
                      defaultValue={product.quantity}
                      min="0"
                      name="quantity"
                      required
                      type="number"
                    />
                  </label>
                  <label className={labelClass}>
                    Категория
                    <CategorySelect
                      categories={categories}
                      defaultValue={product.category_id}
                    />
                  </label>
                  <label className={labelClass}>
                    Статус
                    <select
                      className={inputClass}
                      defaultValue={product.status}
                      name="status"
                    >
                      <option value="active">Активен</option>
                      <option value="archived">Архив</option>
                    </select>
                  </label>
                </div>

                <ProductPhotoInput
                  helpText="До 12 новых фото. Они заменят текущие."
                  label="Новые фото заменят текущие"
                />

                <button className={primaryButtonClass}>Сохранить товар</button>
              </form>
            </details>
          </article>
        ))
      ) : (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500">
          Товаров пока нет.
        </div>
      )}
    </section>
  );
}

export function SettingsForm({
  error,
  saved,
  tenant,
}: {
  error?: string;
  saved?: boolean;
  tenant: Tenant | null;
}) {
  const errorMessage = settingsErrorMessage(error);

  return (
    <section className={`${panelClass} mx-auto w-full max-w-[920px]`}>
      <h2 className="text-2xl font-semibold tracking-tight">
        Настройки магазина
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Здесь меняются название, WhatsApp, адрес и соцсети.
      </p>

      {saved ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Настройки магазина сохранены.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <form action={updateStorefront} className="mt-6 grid gap-4">
        {tenant?.logo_url ? (
          <div>
            <Image
              alt="Логотип магазина"
              className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
              height={80}
              src={tenant.logo_url}
              width={80}
            />
            <input name="currentLogoUrl" type="hidden" value={tenant.logo_url} />
          </div>
        ) : null}

        <label className={labelClass}>
          Логотип
          <input accept="image/*" className={fileClass} name="logo" type="file" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Название
            <input
              className={inputClass}
              defaultValue={tenant?.name ?? ""}
              name="name"
              required
            />
          </label>
          <label className={labelClass}>
            WhatsApp
            <input
              className={inputClass}
              defaultValue={tenant?.whatsapp ?? ""}
              name="whatsapp"
            />
          </label>
        </div>

        <label className={labelClass}>
          Описание
          <textarea
            className={textareaClass}
            defaultValue={tenant?.description ?? ""}
            name="description"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Телефон
            <input
              className={inputClass}
              defaultValue={tenant?.phone ?? ""}
              name="phone"
            />
          </label>
          <label className={labelClass}>
            Адрес
            <input
              className={inputClass}
              defaultValue={tenant?.address ?? ""}
              name="address"
            />
          </label>
          <label className={labelClass}>
            Instagram
            <input
              className={inputClass}
              defaultValue={tenant?.instagram_url ?? ""}
              name="instagramUrl"
              placeholder="https://instagram.com/shop"
            />
          </label>
          <label className={labelClass}>
            TikTok
            <input
              className={inputClass}
              defaultValue={tenant?.tiktok_url ?? ""}
              name="tiktokUrl"
              placeholder="https://tiktok.com/@shop"
            />
          </label>
        </div>

        <button className={primaryButtonClass} type="submit">
          Сохранить магазин
        </button>
      </form>
    </section>
  );
}

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  return (
    <section className={`${panelClass} mx-auto w-full max-w-[720px]`}>
      <h2 className="text-2xl font-semibold tracking-tight">Категории</h2>

      <form action={addCategory} className="mt-5 flex gap-2">
        <input
          className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-500 focus:bg-white"
          name="name"
          placeholder="Например: Наушники"
          required
        />
        <button className="h-11 rounded-2xl bg-slate-950 px-4 font-semibold text-white">
          Добавить
        </button>
      </form>

      <div className="mt-5 grid gap-2">
        {categories.length ? (
          categories.map((category) => (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              key={category.id}
            >
              <span className="font-medium text-slate-700">{category.name}</span>
              <form action={deleteCategory}>
                <input name="categoryId" type="hidden" value={category.id} />
                <button className="text-sm font-semibold text-rose-600">
                  Удалить
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Категорий пока нет.</p>
        )}
      </div>
    </section>
  );
}
