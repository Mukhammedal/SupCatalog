import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, pathForRole } from "@/lib/auth";
import { login } from "./actions";

const errorMessages: Record<string, string> = {
  empty: "Введите email и пароль.",
  invalid: "Неверный email или пароль.",
  "no-profile": "Аккаунт найден, но роль ещё не настроена.",
  "wrong-tenant": "Этот аккаунт не привязан к выбранному каталогу.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    seller?: string;
    tenant?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const isSellerLogin = params.seller === "1";

  if (profile && !isSellerLogin) {
    redirect(pathForRole(profile.role));
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#edf2f7] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-5 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_410px] lg:items-center lg:gap-12">
        <div className="relative max-w-2xl">
          <div className="mb-6 flex min-w-0 items-center gap-3 sm:mb-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-slate-950 text-base font-bold text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] sm:h-12 sm:w-12 sm:text-xl">
              A
            </span>
            <span className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              Ali group product
            </span>
          </div>

          <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-emerald-600 sm:text-sm sm:tracking-[0.24em]">
            Внутренняя платформа
          </p>
          <h1 className="max-w-[11ch] text-[2.35rem] font-semibold leading-[1.02] tracking-tight sm:max-w-none sm:text-6xl lg:text-7xl">
            {isSellerLogin
              ? "Вход продавца в кабинет"
              : "Управление магазинами и каталогами"}
          </h1>
          <p className="mt-4 max-w-[34rem] text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            {isSellerLogin
              ? "Введите email и пароль, которые выдал владелец платформы."
              : "Войдите в аккаунт, чтобы создавать продавцов, продлевать подписки или наполнять свой каталог товарами."}
          </p>
        </div>

        <form
          action={login}
          className="mt-7 rounded-[1.35rem] border border-white/80 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.12)] sm:mt-10 sm:rounded-[1.75rem] sm:p-6 lg:mt-0"
        >
          {isSellerLogin ? (
            <input name="sellerLogin" type="hidden" value="1" />
          ) : null}
          {params.tenant ? (
            <input name="tenantId" type="hidden" value={params.tenant} />
          ) : null}

          <div className="mb-5 border-b border-slate-100 pb-4 sm:mb-6 sm:pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Доступ
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Войти</h2>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white sm:h-[3.25rem]"
              name="email"
              placeholder="email@example.com"
              required
              type="email"
            />
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Пароль
            <input
              autoComplete="current-password"
              className="mt-2 h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white sm:h-[3.25rem]"
              name="password"
              placeholder="Введите пароль"
              required
              type="password"
            />
          </label>

          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="mt-7 h-12 w-full rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 sm:h-[3.25rem]"
            type="submit"
          >
            Войти
          </button>

          {isSellerLogin ? (
            <Link
              className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              href="/login"
            >
              Вход администратора
            </Link>
          ) : null}
        </form>
      </section>
    </main>
  );
}
