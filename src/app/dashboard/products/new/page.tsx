import { AddProductForm, DashboardShell } from "../../components";
import { getSellerDashboardData } from "../../data";

type NewProductPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const params = await searchParams;
  const { categories, expired, profile, tenant } = await getSellerDashboardData();

  return (
    <DashboardShell
      active="new"
      email={profile.email}
      expired={expired}
      tenant={tenant}
    >
      <AddProductForm categories={categories} error={params.error} />
    </DashboardShell>
  );
}
