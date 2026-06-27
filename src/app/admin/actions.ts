"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient, hasSupabaseAdminKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateClientState = {
  status: "idle" | "success" | "error";
  message?: string;
  catalogPath?: string;
  email?: string;
  password?: string;
};

export type ResetClientPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
  password?: string;
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generatePassword() {
  return `Cat-${randomBytes(9).toString("base64url")}-10k`;
}

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTenantClient(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  await requireRole("superadmin");

  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(formData.get("slug"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  if (!name || !slug || !email || !whatsapp) {
    return {
      status: "error",
      message: "Заполни название, slug, email и WhatsApp.",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      status: "error",
      message: "Slug должен быть латиницей: naprimer aigerim-shop.",
    };
  }

  if (!hasSupabaseAdminKey()) {
    return {
      status: "error",
      message:
        "Не добавлен SUPABASE_SECRET_KEY или SUPABASE_SERVICE_ROLE_KEY в .env.local.",
    };
  }

  const admin = createAdminClient();
  const password = generatePassword();
  const subscriptionUntil = toDateInputValue(addDays(new Date(), 30));

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name,
      slug,
      whatsapp,
      status: "active",
      subscription_until: subscriptionUntil,
    })
    .select("id, slug")
    .single<{ id: string; slug: string }>();

  if (tenantError || !tenant) {
    return {
      status: "error",
      message:
        tenantError?.code === "23505"
          ? "Такой slug уже занят."
          : tenantError?.message ?? "Не удалось создать каталог.",
    };
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: "client",
        tenant_id: tenant.id,
        visible_password: password,
      },
      user_metadata: {
        role: "client",
        tenant_id: tenant.id,
      },
    });

  if (authError || !authUser.user) {
    await admin.from("tenants").delete().eq("id", tenant.id);

    return {
      status: "error",
      message:
        authError?.message ?? "Каталог создан, но аккаунт клиента создать не удалось.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    email,
    role: "client",
    tenant_id: tenant.id,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    await admin.from("tenants").delete().eq("id", tenant.id);

    return {
      status: "error",
      message: profileError.message,
    };
  }

  revalidatePath("/admin");

  return {
    status: "success",
    message: "Клиент создан. Пустой каталог уже доступен.",
    catalogPath: `/${tenant.slug}`,
    email,
    password,
  };
}

export async function renewTenant(formData: FormData) {
  await requireRole("superadmin");

  const tenantId = String(formData.get("tenantId") ?? "");
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("subscription_until")
    .eq("id", tenantId)
    .single<{ subscription_until: string }>();

  if (tenant) {
    const today = new Date();
    const currentUntil = new Date(`${tenant.subscription_until}T00:00:00`);
    const base = currentUntil > today ? currentUntil : today;
    const nextUntil = toDateInputValue(addDays(base, 30));

    await supabase
      .from("tenants")
      .update({
        status: "active",
        subscription_until: nextUntil,
      })
      .eq("id", tenantId);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function archiveTenant(formData: FormData) {
  await requireRole("superadmin");

  const tenantId = String(formData.get("tenantId") ?? "");
  const supabase = await createClient();

  await supabase
    .from("tenants")
    .update({
      status: "archived",
    })
    .eq("id", tenantId);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function activateTenant(formData: FormData) {
  await requireRole("superadmin");

  const tenantId = String(formData.get("tenantId") ?? "");
  const supabase = await createClient();

  await supabase
    .from("tenants")
    .update({
      status: "active",
    })
    .eq("id", tenantId);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function resetClientPassword(
  _previousState: ResetClientPasswordState,
  formData: FormData,
): Promise<ResetClientPasswordState> {
  try {
    await requireRole("superadmin");

    if (!hasSupabaseAdminKey()) {
      return {
        status: "error",
        message:
          "Не добавлен SUPABASE_SECRET_KEY или SUPABASE_SERVICE_ROLE_KEY в .env.local.",
      };
    }

    const profileId = String(formData.get("profileId") ?? "");
    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("id", profileId)
      .eq("role", "client")
      .single<{ id: string; email: string; role: "client" }>();

    if (profileError || !profile) {
      return {
        status: "error",
        message: "Клиент не найден.",
      };
    }

    const password = generatePassword();
    const { data: authUser, error: authUserError } =
      await admin.auth.admin.getUserById(profile.id);

    if (authUserError) {
      return {
        status: "error",
        message: authUserError.message,
      };
    }

    const { error } = await admin.auth.admin.updateUserById(profile.id, {
      password,
      app_metadata: {
        ...(authUser.user?.app_metadata ?? {}),
        visible_password: password,
      },
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "success",
      message: "Новый временный пароль создан.",
      email: profile.email,
      password,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Не удалось создать новый пароль.",
    };
  }
}
