import { DashboardShell, SettingsForm } from "../components";
import { getSellerDashboardData } from "../data";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const { expired, profile, tenant } = await getSellerDashboardData();

  return (
    <DashboardShell
      active="settings"
      email={profile.email}
      expired={expired}
      tenant={tenant}
    >
      <SettingsForm
        error={params.error}
        saved={params.saved === "1"}
        tenant={tenant}
      />
    </DashboardShell>
  );
}
