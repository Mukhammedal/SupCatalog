"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTenantClient,
  type CreateClientState,
} from "@/app/admin/actions";

const initialState: CreateClientState = {
  status: "idle",
};

export function CreateClientForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createTenantClient,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Название магазина
          <input
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            name="name"
            required
          />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Slug
          <input
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            name="slug"
            placeholder="aigerim-shop"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Email клиента
          <input
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            name="email"
            type="email"
            required
          />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          WhatsApp
          <input
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            name="whatsapp"
            placeholder="77001234567"
            required
          />
        </label>
      </div>

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
              : "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
          }
        >
          <p>{state.message}</p>
          {state.status === "success" ? (
            <div className="mt-3 grid gap-1 text-emerald-700">
              <p>
                Каталог:{" "}
                <a
                  className="font-semibold underline underline-offset-4"
                  href={state.catalogPath}
                >
                  {state.catalogPath}
                </a>
              </p>
              <p>Email: {state.email}</p>
              <p>Временный пароль: {state.password}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Создаю..." : "Создать клиента"}
      </button>
    </form>
  );
}
