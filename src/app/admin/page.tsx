import { logout } from "@/app/login/actions";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminKey } from "@/lib/supabase/admin";
import { AdminTenantList } from "@/app/admin/admin-tenant-list";
import { CreateClientForm } from "@/app/admin/create-client-form";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  subscription_until: string;
  status: "active" | "archived";
  created_at: string;
};

type ClientProfile = {
  id: string;
  email: string;
  tenant_id: string;
};

type ProductSummary = {
  tenant_id: string;
  status: "active" | "archived";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function isExpired(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`) < today;
}

export default async function AdminPage() {
  const profile = await requireRole("superadmin");
  const supabase = await createClient();
  const hasAdminKey = hasSupabaseAdminKey();

  const [
    { data: tenants },
    { data: clientProfiles },
    { data: productSummaries },
  ] =
    await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, name, slug, description, phone, whatsapp, address, instagram_url, tiktok_url, subscription_until, status, created_at",
      )
      .order("created_at", { ascending: false })
      .returns<Tenant[]>(),
    supabase
      .from("profiles")
      .select("id, email, tenant_id")
      .eq("role", "client")
      .returns<ClientProfile[]>(),
    supabase
      .from("products")
      .select("tenant_id, status")
      .returns<ProductSummary[]>(),
  ]);

  const profilesByTenantId = new Map(
    clientProfiles?.map((clientProfile) => [
      clientProfile.tenant_id,
      clientProfile,
    ]) ?? [],
  );
  const productStatsByTenantId = new Map<
    string,
    { active: number; archived: number; total: number }
  >();
  const visiblePasswordsByProfileId = new Map<string, string>();

  if (hasAdminKey) {
    const admin = createAdminClient();
    const { data: authUsers } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    for (const user of authUsers.users) {
      const visiblePassword = user.app_metadata?.visible_password;
      if (typeof visiblePassword === "string" && visiblePassword) {
        visiblePasswordsByProfileId.set(user.id, visiblePassword);
      }
    }
  }

  for (const product of productSummaries ?? []) {
    const current = productStatsByTenantId.get(product.tenant_id) ?? {
      active: 0,
      archived: 0,
      total: 0,
    };

    current.total += 1;
    if (product.status === "active") {
      current.active += 1;
    } else {
      current.archived += 1;
    }
    productStatsByTenantId.set(product.tenant_id, current);
  }

  const activeTenants =
    tenants?.filter(
      (tenant) => tenant.status === "active" && !isExpired(tenant.subscription_until),
    ).length ?? 0;
  const tenantRows =
    tenants?.map((tenant) => {
      const clientProfile = profilesByTenantId.get(tenant.id);
      const productStats = productStatsByTenantId.get(tenant.id) ?? {
        active: 0,
        archived: 0,
        total: 0,
      };

      return {
        ...tenant,
        clientProfile: clientProfile
          ? {
              id: clientProfile.id,
              email: clientProfile.email,
            }
          : undefined,
        expired: isExpired(tenant.subscription_until),
        productStats,
        subscriptionLabel: formatDate(tenant.subscription_until),
        visiblePassword: clientProfile
          ? visiblePasswordsByProfileId.get(clientProfile.id)
          : undefined,
      };
    }) ?? [];

  return (
    <main className="min-h-screen bg-[#eef2f7] px-5 py-5 text-slate-950 sm:px-7">
      <section className="mx-auto w-full max-w-[1440px]">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white shadow-sm">
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">
                Ali group product
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Панель суперадмина
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="max-w-[230px] truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
              {profile.email}
            </span>
            <form action={logout}>
              <button className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Выйти
              </button>
            </form>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Продавцы и подписки
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
            <div className="min-w-24 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-slate-400">
                Всего
              </p>
              <p className="mt-0.5 text-lg font-semibold">
                {tenants?.length ?? 0}
              </p>
            </div>
            <div className="min-w-24 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-slate-400">
                Активные
              </p>
              <p className="mt-0.5 text-lg font-semibold text-emerald-700">
                {activeTenants}
              </p>
            </div>
          </div>
        </div>

        {!hasAdminKey ? (
          <div className="mt-5 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium leading-6 text-rose-700">
            Для создания Auth-аккаунтов клиентов добавь Supabase secret/service
            key в <code>SUPABASE_SECRET_KEY</code> или{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> в <code>.env.local</code>.
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] xl:gap-6">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold tracking-tight">
              Создать продавца
            </h2>

            <div className="mt-4">
              <CreateClientForm />
            </div>
          </aside>

          <div className="grid gap-6">
            <AdminTenantList rows={tenantRows} />
          </div>
        </div>
      </section>
    </main>
  );
}
