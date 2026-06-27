"use client";

import { useActionState, useState } from "react";
import {
  resetClientPassword,
  type ResetClientPasswordState,
} from "@/app/admin/actions";

const initialState: ResetClientPasswordState = {
  status: "idle",
};

export function ResetPasswordForm({
  currentPassword,
  email,
  profileId,
}: {
  currentPassword?: string;
  email?: string;
  profileId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    resetClientPassword,
    initialState,
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const activeEmail = state.status === "success" ? state.email : email;
  const activePassword =
    state.status === "success" ? state.password : currentPassword;

  if (!profileId) {
    return <span className="text-xs text-slate-500">Профиль не найден</span>;
  }

  return (
    <form action={formAction} className="grid gap-2">
      <input name="profileId" type="hidden" value={profileId} />

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
        <p className="truncate">
          <span className="font-semibold text-slate-800">Email:</span>{" "}
          {activeEmail ?? "не найден"}
        </p>
        <p className="break-all">
          <span className="font-semibold text-slate-800">Пароль:</span>{" "}
          {activePassword
            ? isPasswordVisible
              ? activePassword
              : "••••••••••"
            : "не выдан"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!activePassword}
          onClick={() => setIsPasswordVisible((value) => !value)}
          type="button"
        >
          {isPasswordVisible ? "Скрыть" : "Смотреть"}
        </button>
        <button
          className="h-8 rounded-lg bg-slate-950 px-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Создаю..." : "Новый"}
        </button>
      </div>

      {state.status === "success" ? (
        <p className="text-xs font-medium text-emerald-700">
          Новый пароль создан.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-xs leading-5 text-rose-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
