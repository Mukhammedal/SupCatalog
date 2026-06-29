"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountLinkState = {
  href: string;
  label: string;
  loading: boolean;
};

function sellerLoginHref(tenantId: string) {
  const params = new URLSearchParams({
    tenant: tenantId,
  });

  return `/login/seller?${params.toString()}`;
}

export function CatalogAccountLink({ tenantId }: { tenantId: string }) {
  const [state, setState] = useState<AccountLinkState>({
    href: "#",
    label: "Аккаунт",
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadAccountLink() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session?.user) {
        setState({
          href: sellerLoginHref(tenantId),
          label: "Войти",
          loading: false,
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, tenant_id")
        .eq("id", session.user.id)
        .single<{ role: "superadmin" | "client"; tenant_id: string | null }>();

      if (!mounted) {
        return;
      }

      if (!profile || profile.role !== "client" || profile.tenant_id !== tenantId) {
        setState({
          href: sellerLoginHref(tenantId),
          label: "Войти",
          loading: false,
        });
        return;
      }

      setState({
        href: "/dashboard",
        label: "Панель",
        loading: false,
      });
    }

    void loadAccountLink();

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  return (
    <Link
      aria-disabled={state.loading}
      className={`inline-flex h-10 min-w-[76px] items-center justify-center rounded-2xl px-4 text-sm shadow-sm transition sm:h-11 sm:min-w-[96px] sm:px-5 ${
        state.loading
          ? "pointer-events-none bg-slate-100 text-transparent"
          : "bg-slate-950 text-white hover:bg-slate-800"
      }`}
      href={state.href}
    >
      {state.label}
    </Link>
  );
}
