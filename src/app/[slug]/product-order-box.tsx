"use client";

import { useMemo, useState } from "react";

type ProductOrderBoxProps = {
  article: string | null;
  mode: "retail" | "wholesale";
  price: number;
  productName: string;
  quantity: number;
  shopName: string;
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

export function ProductOrderBox({
  article,
  mode,
  price,
  productName,
  quantity,
  shopName,
  whatsapp,
}: ProductOrderBoxProps) {
  const [count, setCount] = useState(1);
  const whatsappNumber = normalizeWhatsapp(whatsapp);
  const canOrder = quantity > 0 && Boolean(whatsappNumber);

  const orderUrl = useMemo(() => {
    if (!canOrder) {
      return "";
    }

    const modeLabel = mode === "retail" ? "розница" : "опт";
    const articleLine = article ? `Артикул: ${article}` : "";
    const text = [
      `Заказ из магазина: ${shopName}`,
      `Товар: ${productName}`,
      articleLine,
      `Тип цены: ${modeLabel}`,
      `Количество: ${count}`,
      `Цена: ${formatMoney(price)} ₸`,
      `Итого: ${formatMoney(price * count)} ₸`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }, [article, canOrder, count, mode, price, productName, shopName, whatsappNumber]);

  function changeCount(nextCount: number) {
    if (!Number.isFinite(nextCount)) {
      return;
    }

    setCount(Math.max(1, Math.min(nextCount, Math.max(quantity, 1))));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {mode === "retail" ? "Розничная цена" : "Оптовая цена"}
          </p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950">
            {formatMoney(price)} ₸
          </p>
        </div>
        <span
          className={
            quantity > 0
              ? "rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              : "rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          }
        >
          {quantity > 0 ? `${quantity} шт.` : "Нет"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[92px_1fr] gap-3">
        <input
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-base font-semibold outline-none transition focus:border-slate-500 focus:bg-white"
          disabled={quantity <= 0}
          max={Math.max(quantity, 1)}
          min={1}
          onChange={(event) => changeCount(Number(event.target.value))}
          type="number"
          value={count}
        />
        {canOrder ? (
          <a
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            href={orderUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Заказать в WhatsApp
          </a>
        ) : (
          <button
            className="h-11 rounded-xl bg-slate-300 px-4 text-sm font-semibold text-white"
            disabled
            type="button"
          >
            Заказ недоступен
          </button>
        )}
      </div>

      {!whatsappNumber ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
          У магазина не заполнен WhatsApp.
        </p>
      ) : null}
    </div>
  );
}
