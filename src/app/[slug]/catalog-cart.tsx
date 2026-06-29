"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type CartProduct = {
  id: string;
  name: string;
  article: string | null;
  price: number;
  quantity: number;
};

type CartItem = CartProduct & {
  count: number;
};

type CatalogCartProps = {
  mode: "retail" | "wholesale";
  products: CartProduct[];
  shopName: string;
  slug: string;
  whatsapp: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeWhatsapp(value: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function CatalogCart({
  mode,
  products,
  shopName,
  slug,
  whatsapp,
}: CatalogCartProps) {
  const storageKey = `cart:${slug}:${mode}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.count * item.price,
    0,
  );
  const whatsappNumber = normalizeWhatsapp(whatsapp);

  const addToCart = useCallback(
    (productId: string, count: number) => {
      const product = productsById.get(productId);
      if (!product || product.quantity <= 0 || count <= 0) {
        return;
      }

      setItems((currentItems) => {
        const existing = currentItems.find((item) => item.id === product.id);
        const nextCount = existing
          ? Math.min(existing.count + count, product.quantity)
          : Math.min(count, product.quantity);

        if (existing) {
          return currentItems.map((item) =>
            item.id === product.id ? { ...item, count: nextCount } : item,
          );
        }

        return [...currentItems, { ...product, count: nextCount }];
      });
    },
    [productsById],
  );

  useEffect(() => {
    function handleAddToCart(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const button = target.closest<HTMLButtonElement>("[data-add-to-cart]");
      if (!button) {
        return;
      }

      const productId = button.dataset.addToCart;
      const form = button.closest("form");
      const input = form?.querySelector<HTMLInputElement>(
        'input[name="quantity"]',
      );
      const count = Number(input?.value ?? 1);

      if (productId) {
        addToCart(productId, Number.isFinite(count) ? count : 1);
      }
    }

    document.addEventListener("click", handleAddToCart);
    return () => document.removeEventListener("click", handleAddToCart);
  }, [addToCart]);

  function changeCount(productId: string, count: number) {
    if (count <= 0) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? { ...item, count: Math.min(count, item.quantity) }
          : item,
      ),
    );
  }

  function removeItem(productId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }

  function clearCart() {
    setItems([]);
    window.localStorage.removeItem(storageKey);
  }

  function orderViaWhatsapp() {
    if (!whatsappNumber || items.length === 0) {
      return;
    }

    const modeLabel = mode === "retail" ? "розница" : "опт";
    const lines = [
      `Заказ из магазина: ${shopName}`,
      `Тип цены: ${modeLabel}`,
      "",
      ...items.map((item, index) => {
        const article = item.article ? `, арт. ${item.article}` : "";
        return `${index + 1}. ${item.name}${article} x ${item.count} = ${formatMoney(
          item.count * item.price,
        )} ₸`;
      }),
      "",
      `Итого: ${formatMoney(totalPrice)} ₸`,
    ];
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      lines.join("\n"),
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
    clearCart();
    setIsOpen(false);
  }

  return (
    <>
      <div className="fixed left-3 right-3 z-30 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-5 sm:left-auto sm:right-5">
        <button
          className="h-12 w-full rounded-xl bg-emerald-500 px-4 text-base font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.30)] transition hover:bg-emerald-600 sm:h-11 sm:w-auto sm:text-sm"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Корзина · {totalCount}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/35 p-2 backdrop-blur-sm sm:px-4 sm:py-5">
          <aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:gap-4 sm:p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">Корзина</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {mode === "retail" ? "Розничный заказ" : "Оптовый заказ"}
                </p>
              </div>
              <button
                className="h-9 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:rounded-2xl sm:px-4 sm:text-base"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Закрыть
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              {items.length ? (
                <div className="grid gap-3 sm:gap-4">
                  {items.map((item) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                      key={item.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950 sm:text-base">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatMoney(item.price)} ₸ · остаток {item.quantity}
                          </p>
                        </div>
                        <button
                          className="text-sm font-bold text-rose-600"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          Удалить
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
                        <button
                          className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                          onClick={() => changeCount(item.id, item.count - 1)}
                          type="button"
                        >
                          -
                        </button>
                        <input
                          className="h-9 w-14 rounded-xl border border-slate-200 bg-white text-center font-semibold sm:w-16"
                          min="1"
                          max={item.quantity}
                          onChange={(event) =>
                            changeCount(item.id, Number(event.target.value))
                          }
                          type="number"
                          value={item.count}
                        />
                        <button
                          className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                          onClick={() => changeCount(item.id, item.count + 1)}
                          type="button"
                        >
                          +
                        </button>
                        <span className="ml-auto whitespace-nowrap text-sm font-semibold text-slate-950 sm:text-base">
                          {formatMoney(item.count * item.price)} ₸
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                  Корзина пустая.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between text-lg font-semibold text-slate-950">
                <span>Итого</span>
                <span>{formatMoney(totalPrice)} ₸</span>
              </div>

              {!whatsappNumber ? (
                <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  У магазина не заполнен WhatsApp.
                </p>
              ) : null}

              <button
                className="h-12 w-full rounded-2xl bg-emerald-500 px-5 font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                disabled={!items.length || !whatsappNumber}
                onClick={orderViaWhatsapp}
                type="button"
              >
                Заказать через WhatsApp
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="hidden">
        {products.map((product) => (
          <span data-cart-product={product.id} key={product.id} />
        ))}
      </div>
    </>
  );
}
