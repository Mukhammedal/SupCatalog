import Link from "next/link";
import { DashboardShell } from "../components";
import { getSellerDashboardData } from "../data";
import { ProductList } from "../product-list";

type ProductsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { categories, expired, products, profile, tenant } =
    await getSellerDashboardData();

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

      <ProductList
        categories={categories}
        error={params.error}
        products={products}
      />
    </DashboardShell>
  );
}
