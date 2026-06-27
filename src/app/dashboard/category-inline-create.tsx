"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createCategoryFromProductForm } from "./actions";

type InlineCategoryState = {
  message: string;
  status: "idle" | "success" | "error";
};

export function CategoryInlineCreate() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<InlineCategoryState>({
    message: "",
    status: "idle",
  });

  function handleCreate() {
    const name = inputRef.current?.value ?? "";

    startTransition(async () => {
      const result = await createCategoryFromProductForm(name);

      setState(result);

      if (result.status === "success") {
        if (inputRef.current) {
          inputRef.current.value = "";
        }

        router.refresh();
      }
    });
  }

  return (
    <>
      <input
        className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500"
        disabled={isPending}
        placeholder="Новая категория"
        ref={inputRef}
      />
      <button
        className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
        disabled={isPending}
        onClick={handleCreate}
        title="Сохранить категорию"
        type="button"
      >
        +
      </button>
      {state.message ? (
        <p
          className={`text-xs font-semibold sm:col-span-3 ${
            state.status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </>
  );
}
