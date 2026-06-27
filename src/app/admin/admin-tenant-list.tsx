"use client";

import { useMemo, useState } from "react";
import {
  activateTenant,
  archiveTenant,
  renewTenant,
} from "@/app/admin/actions";
import { ResetPasswordForm } from "@/app/admin/reset-password-form";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  status: "active" | "archived";
  expired: boolean;
  subscriptionLabel: string;
  clientProfile?: {
    id: string;
    email: string;
  };
  visiblePassword?: string;
  productStats: {
    active: number;
    archived: number;
    total: number;
  };
};

type StatusFilter = "all" | "active" | "archived" | "expired";

function rowSearchText(row: TenantRow) {
  return [
    row.name,
    row.slug,
    row.clientProfile?.email,
    row.whatsapp,
    row.phone,
    row.address,
    row.instagram_url,
    row.tiktok_url,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function tenantStatusLabel(row: TenantRow) {
  if (row.expired) {
    return "expired";
  }

  return row.status;
}

function TenantStatusBadge({ row }: { row: TenantRow }) {
  const isHealthy = row.status === "active" && !row.expired;

  return (
    <span
      className={
        isHealthy
          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-emerald-700"
          : "rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-rose-700"
      }
    >
      {tenantStatusLabel(row)}
    </span>
  );
}

function TenantArchiveForm({
  confirmArchiveId,
  row,
  setConfirmArchiveId,
}: {
  confirmArchiveId: string | null;
  row: TenantRow;
  setConfirmArchiveId: (tenantId: string | null) => void;
}) {
  const needsArchiveConfirmation =
    row.status !== "archived" && confirmArchiveId !== row.id;

  return (
    <form
      action={row.status === "archived" ? activateTenant : archiveTenant}
      onSubmit={(event) => {
        if (needsArchiveConfirmation) {
          event.preventDefault();
          setConfirmArchiveId(row.id);
        }
      }}
    >
      <input name="tenantId" type="hidden" value={row.id} />
      <button
        className={
          row.status === "archived"
            ? "h-9 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            : confirmArchiveId === row.id
              ? "h-9 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              : "h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        }
      >
        {row.status === "archived"
          ? "Активировать"
          : confirmArchiveId === row.id
            ? "Подтвердить архив"
            : "Архив"}
      </button>
    </form>
  );
}

function TenantCard({
  confirmArchiveId,
  row,
  setConfirmArchiveId,
}: {
  confirmArchiveId: string | null;
  row: TenantRow;
  setConfirmArchiveId: (tenantId: string | null) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">
              {row.name}
            </h3>
            <TenantStatusBadge row={row} />
          </div>

          <div className="mt-3 grid gap-x-4 gap-y-1.5 text-sm text-slate-500 md:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-700">Email:</span>{" "}
              {row.clientProfile?.email ?? "Email не найден"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">WhatsApp:</span>{" "}
              {row.whatsapp || "не заполнен"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Телефон:</span>{" "}
              {row.phone || "не заполнен"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Адрес:</span>{" "}
              {row.address || "не заполнен"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Instagram:</span>{" "}
              {row.instagram_url || "не заполнен"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">TikTok:</span>{" "}
              {row.tiktok_url || "не заполнен"}
            </p>
          </div>

          {row.description ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {row.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              href={`/${row.slug}`}
              target="_blank"
            >
              Открыть сайт /{row.slug}
            </a>
            <a
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/${row.slug}/opt`}
              target="_blank"
            >
              Оптовая витрина
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-500">Подписка до</p>
              <p
                className={
                  row.expired
                    ? "mt-1 font-semibold text-rose-700"
                    : "mt-1 font-semibold text-emerald-700"
                }
              >
                {row.subscriptionLabel}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Товары</p>
              <p className="mt-1 font-semibold text-slate-950">
                {row.productStats.active} активных
              </p>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">
              Доступ продавца
            </p>
            <ResetPasswordForm
              currentPassword={row.visiblePassword}
              email={row.clientProfile?.email}
              profileId={row.clientProfile?.id}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <form action={renewTenant}>
              <input name="tenantId" type="hidden" value={row.id} />
              <button className="h-9 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                +30 дней
              </button>
            </form>
            <TenantArchiveForm
              confirmArchiveId={confirmArchiveId}
              row={row}
              setConfirmArchiveId={setConfirmArchiveId}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminTenantList({ rows }: { rows: TenantRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery || rowSearchText(row).includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          row.status === "active" &&
          !row.expired) ||
        (statusFilter === "archived" && row.status === "archived") ||
        (statusFilter === "expired" && row.expired);

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  return (
    <section>
      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Список продавцов
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Показано: {filteredRows.length} из {rows.length}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="block">
              <span className="sr-only">Поиск продавца</span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 md:w-72"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setConfirmArchiveId(null);
                }}
                placeholder="Поиск: название, slug, email"
                value={query}
              />
            </label>

            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                ["all", "Все"],
                ["active", "Активные"],
                ["archived", "Архив"],
                ["expired", "Истекшие"],
              ].map(([value, label]) => (
                <button
                  className={
                    statusFilter === value
                      ? "h-8 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"
                      : "h-8 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  }
                  key={value}
                  onClick={() => {
                    setStatusFilter(value as StatusFilter);
                    setConfirmArchiveId(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredRows.length ? (
          filteredRows.map((row) => (
            <TenantCard
              confirmArchiveId={confirmArchiveId}
              key={row.id}
              row={row}
              setConfirmArchiveId={setConfirmArchiveId}
            />
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500">
            Продавцы не найдены.
          </div>
        )}
      </div>
    </section>
  );
}
