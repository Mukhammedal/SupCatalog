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
    <main className="min-h-screen bg-[#eef2f7] px-5 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white shadow-lg shadow-slate-300">
              A
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              Ali group product
            </span>
          </div>

          <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
            Внутренняя платформа
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            {isSellerLogin
              ? "Вход продавца в кабинет"
              : "Управление магазинами и каталогами"}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            {isSellerLogin
              ? "Введите email и пароль, которые выдал владелец платформы."
              : "Войдите в аккаунт, чтобы создавать продавцов, продлевать подписки или наполнять свой каталог товарами."}
          </p>
        </div>

        <form
          action={login}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
        >
          <div className="mb-7">
            <h2 className="text-3xl font-semibold tracking-tight">Войти</h2>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white"
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
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-slate-500 focus:bg-white"
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
