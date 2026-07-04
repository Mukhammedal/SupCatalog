import Link from "next/link";
import { DashboardShell } from "../components";
import { getSellerDashboardData } from "../data";
import { ProductList } from "../product-list";

type ProductsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function productErrorMessage(error?: string) {
  switch (error) {
    case "too-many":
      return "Можно оставить максимум 12 фото.";
    case "too-large":
      return "Одно из фото больше 8 MB. Выбери файл меньше.";
    case "storage":
    case "upload":
      return "Фото не загрузились. Попробуй ещё раз.";
    case "save":
      return "Товар не сохранился. Проверь категорию и попробуй ещё раз.";
    default:
      return null;
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { categories, expired, products, profile, tenant } =
    await getSellerDashboardData();
  const errorMessage = productErrorMessage(params.error);

  return (
    <DashboardShell
      active="products"
      email={profile.email}
      expired={expired}
      tenant={tenant}
    >
      <div className="mb-4 flex max-w-[1120px] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
          <p className="mt-1 text-sm text-slate-500">Всего: {products.length}</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
          href="/dashboard/products/new"
        >
          Добавить товар
        </Link>
      </div>

      {errorMessage ? (
        <div className="mb-4 max-w-[1120px] rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <ProductList categories={categories} products={products} />
    </DashboardShell>
  );
}
