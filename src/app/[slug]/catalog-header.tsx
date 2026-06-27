import Image from "next/image";
import Link from "next/link";
import { CatalogAccountLink } from "./catalog-account-link";

type HeaderTenant = {
  id: string;
  name: string;
  logo_url: string | null;
};

function StoreMark({ tenant }: { tenant: HeaderTenant }) {
  if (tenant.logo_url) {
    return (
      <Image
        alt={tenant.name}
        className="h-11 w-11 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200"
        height={44}
        src={tenant.logo_url}
        width={44}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-200">
      {tenant.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export async function CatalogHeader({
  basePath,
  tenant,
}: {
  basePath: string;
  tenant: HeaderTenant;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-18 w-full max-w-[1680px] items-center justify-between gap-4 px-5 sm:px-8 xl:px-10">
        <Link className="flex min-w-0 items-center gap-3" href={basePath}>
          <StoreMark tenant={tenant} />
          <span className="max-w-[48vw] truncate text-lg font-semibold tracking-tight text-slate-950 sm:max-w-none sm:text-xl">
            {tenant.name}
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-600 sm:gap-3">
          <CatalogAccountLink tenantId={tenant.id} />
        </nav>
      </div>
    </header>
  );
}
