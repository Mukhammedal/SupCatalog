import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "superadmin" | "client";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  tenant_id: string | null;
};

export function pathForRole(role: UserRole) {
  return role === "superadmin" ? "/admin" : "/dashboard";
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, tenant_id")
    .eq("id", user.id)
    .single<Profile>();

  return profile;
}

export async function requireRole(role: UserRole) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== role) {
    redirect(pathForRole(profile.role));
  }

  return profile;
}
