"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  activateProduct,
  archiveProduct,
  updateProduct,
} from "@/app/dashboard/actions";
import type { Category, Product } from "@/app/dashboard/data";
import { ProductPhotoInput } from "./product-photo-input";

type ProductStatusFilter = "all" | "active" | "archived";

const labelClass = "block text-sm font-semibold text-slate-700";
const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 outline-none transition focus:border-slate-500 focus:bg-white";
const textareaClass =
  "mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none transition focus:border-slate-500 focus:bg-white";
const primaryButtonClass =
  "h-10 rounded-xl bg-slate-950 px-4 font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800";

function money(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: Category[];
  defaultValue?: string | null;
}) {
  return (
    <select
      className={inputClass}
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

function productSearchText(product: Product) {
  return [product.name, product.article, product.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function ProductArchiveForm({
  confirmArchiveId,
  product,
  setConfirmArchiveId,
}: {
  confirmArchiveId: string | null;
  product: Product;
  setConfirmArchiveId: (productId: string | null) => void;
}) {
  if (product.status === "archived") {
    return (
      <form action={activateProduct}>
        <input name="productId" type="hidden" value={product.id} />
        <button className="h-9 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
          Активировать
        </button>
      </form>
    );
  }

  const isConfirming = confirmArchiveId === product.id;

  return (
    <form
      action={archiveProduct}
      onSubmit={(event) => {
        if (!isConfirming) {
          event.preventDefault();
          setConfirmArchiveId(product.id);
        }
      }}
    >
      <input name="productId" type="hidden" value={product.id} />
      <button
        className={
          isConfirming
            ? "h-9 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
            : "h-9 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        }
      >
        {isConfirming ? "Подтвердить архив" : "В архив"}
      </button>
    </form>
  );
}

function ProductCard({
  categories,
  confirmArchiveId,
  product,
  setConfirmArchiveId,
}: {
  categories: Category[];
  confirmArchiveId: string | null;
  product: Product;
  setConfirmArchiveId: (productId: string | null) => void;
}) {
  const [existingPhotos, setExistingPhotos] = useState(product.photos);

  return (
    <article className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
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

        <ProductArchiveForm
          confirmArchiveId={confirmArchiveId}
          product={product}
          setConfirmArchiveId={setConfirmArchiveId}
        />
      </div>

      <details className="mt-3 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Изменить товар
        </summary>

        <form action={updateProduct} className="mt-4 grid gap-3">
          <input name="productId" type="hidden" value={product.id} />
          {existingPhotos.map((photo) => (
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

          {existingPhotos.length ? (
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Текущие фото
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Удалите только лишние фото. Новые добавятся к оставшимся.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {existingPhotos.length}/12
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {existingPhotos.map((photo, index) => (
                  <div
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white"
                    key={photo}
                  >
                    <Image
                      alt={`${product.name} фото ${index + 1}`}
                      className="h-full w-full object-cover"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
                      src={photo}
                    />
                    {index === 0 ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                        Главное
                      </span>
                    ) : null}
                    <button
                      aria-label={`Удалить фото ${index + 1}`}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600"
                      onClick={() =>
                        setExistingPhotos((currentPhotos) =>
                          currentPhotos.filter((item) => item !== photo),
                        )
                      }
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <ProductPhotoInput
            helpText="Новые фото добавятся к текущим."
            label="Добавить фото"
            usedSlots={existingPhotos.length}
          />

          <button className={primaryButtonClass}>Сохранить товар</button>
        </form>
      </details>
    </article>
  );
}

export function ProductList({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProductStatusFilter>("all");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const activeCount = products.filter(
    (product) => product.status === "active",
  ).length;
  const archivedCount = products.length - activeCount;

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        productSearchText(product).includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [products, query, statusFilter]);

  return (
    <section className="grid max-w-[1120px] gap-3">
      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label>
            <span className="sr-only">Поиск товара</span>
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white"
              onChange={(event) => {
                setQuery(event.target.value);
                setConfirmArchiveId(null);
              }}
              placeholder="Поиск: название, артикул, описание"
              value={query}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                ["all", `Все ${products.length}`],
                ["active", `Активные ${activeCount}`],
                ["archived", `Архив ${archivedCount}`],
              ].map(([value, label]) => (
                <button
                  className={
                    statusFilter === value
                      ? "h-8 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"
                      : "h-8 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  }
                  key={value}
                  onClick={() => {
                    setStatusFilter(value as ProductStatusFilter);
                    setConfirmArchiveId(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Показано {filteredProducts.length}
            </span>
          </div>
        </div>
      </div>

      {filteredProducts.length ? (
        filteredProducts.map((product) => (
          <ProductCard
            categories={categories}
            confirmArchiveId={confirmArchiveId}
            key={`${product.id}:${product.photos.join("|")}`}
            product={product}
            setConfirmArchiveId={setConfirmArchiveId}
          />
        ))
      ) : (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500">
          Товары не найдены.
        </div>
      )}
    </section>
  );
}
