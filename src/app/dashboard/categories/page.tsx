import { CategoriesPanel, DashboardShell } from "../components";
import { getSellerDashboardData } from "../data";

export default async function CategoriesPage() {
  const { categories, expired, profile, tenant } = await getSellerDashboardData();

  return (
    <DashboardShell
      active="categories"
      email={profile.email}
      expired={expired}
      tenant={tenant}
    >
      <CategoriesPanel categories={categories} />
    </DashboardShell>
  );
}
