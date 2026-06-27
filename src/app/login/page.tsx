import { redirect } from "next/navigation";
import { getCurrentProfile, pathForRole } from "@/lib/auth";
import { login } from "./actions";

const errorMessages: Record<string, string> = {
  empty: "Введите email и пароль.",
  invalid: "Неверный email или пароль.",
  "no-profile": "Аккаунт найден, но роль ещё не настроена.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    seller?: string;
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
    <main className="min-h-screen overflow-x-hidden bg-[#eef2f7] px-4 py-5 text-slate-950 sm:px-8 sm:py-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl items-center gap-5 sm:min-h-[calc(100vh-4rem)] sm:gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="max-w-2xl">
          <div className="mb-5 flex min-w-0 items-center gap-3 sm:mb-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-300 sm:h-12 sm:w-12 sm:text-xl">
              A
            </span>
            <span className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              Ali group product
            </span>
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 sm:mb-5 sm:text-sm sm:tracking-[0.18em]">
            Внутренняя платформа
          </p>
          <h1 className="text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {isSellerLogin
              ? "Вход продавца в кабинет"
              : "Управление магазинами и каталогами"}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            {isSellerLogin
              ? "Введите email и пароль, которые выдал владелец платформы."
              : "Войдите в аккаунт, чтобы создавать продавцов, продлевать подписки или наполнять свой каталог товарами."}
          </p>
        </div>

        <form
          action={login}
          className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:rounded-[1.75rem] sm:p-6"
        >
          <div className="mb-5 sm:mb-7">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Войти</h2>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white"
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
              className="mt-2 h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white"
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
            className="mt-7 h-12 w-full rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
            type="submit"
          >
            Войти
          </button>
        </form>
      </section>
    </main>
  );
}
