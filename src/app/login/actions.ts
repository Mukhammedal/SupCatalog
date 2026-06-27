"use server";

import { redirect } from "next/navigation";
import { pathForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=empty");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", email)
    .single<{ role: "superadmin" | "client" }>();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=no-profile");
  }

  redirect(pathForRole(profile.role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
