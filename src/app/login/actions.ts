"use server";

import { redirect } from "next/navigation";
import { pathForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function loginErrorPath(
  error: "empty" | "invalid" | "no-profile" | "wrong-tenant",
  sellerLogin: boolean,
  tenantId: string,
) {
  const params = new URLSearchParams({ error });

  if (sellerLogin) {
    params.set("seller", "1");
  }

  if (tenantId) {
    params.set("tenant", tenantId);
  }

  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const sellerLogin = String(formData.get("sellerLogin") ?? "") === "1";
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  if (!email || !password) {
    redirect(loginErrorPath("empty", sellerLogin, tenantId));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(loginErrorPath("invalid", sellerLogin, tenantId));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("email", email)
    .single<{ role: "superadmin" | "client"; tenant_id: string | null }>();

  if (!profile) {
    await supabase.auth.signOut();
    redirect(loginErrorPath("no-profile", sellerLogin, tenantId));
  }

  if (
    sellerLogin &&
    (profile.role !== "client" || (tenantId && profile.tenant_id !== tenantId))
  ) {
    await supabase.auth.signOut();
    redirect(loginErrorPath("wrong-tenant", sellerLogin, tenantId));
  }

  redirect(pathForRole(profile.role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
