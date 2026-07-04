"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient, hasSupabaseAdminKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "catalog-assets";
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024 * 8;
const MAX_PRODUCT_PHOTOS = 12;

class UploadError extends Error {
  constructor(readonly code: "too-large" | "too-many" | "storage") {
    super(code);
  }
}

function stringValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function numberValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableUuid(value: FormDataEntryValue | null) {
  const normalized = stringValue(value);
  return normalized ? normalized : null;
}

async function productCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  value: FormDataEntryValue | null,
) {
  const categoryId = nullableUuid(value);

  if (!categoryId) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return undefined;
  }

  return data.id;
}

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureStorageBucket() {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET);

  if (!exists) {
    await admin.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 8,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
  }

  return admin;
}

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/products/new");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/settings");
}

function uploadErrorCode(error: unknown) {
  return error instanceof UploadError ? error.code : "upload";
}

async function uploadFiles(
  files: FormDataEntryValue[],
  tenantId: string,
  folder: string,
  maxFiles: number,
) {
  const uploadableFiles = files.filter(
    (item): item is File => item instanceof File && item.size > 0,
  );

  if (uploadableFiles.length === 0) {
    return [];
  }

  if (uploadableFiles.length > maxFiles) {
    throw new UploadError("too-many");
  }

  if (!hasSupabaseAdminKey()) {
    throw new UploadError("storage");
  }

  const admin = await ensureStorageBucket();
  const urls: string[] = [];

  for (const item of uploadableFiles) {
    if (item.size > MAX_IMAGE_SIZE_BYTES) {
      throw new UploadError("too-large");
    }

    const extension = safeFileName(item.name).split(".").pop() || "jpg";
    const path = `${tenantId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, item, {
      cacheControl: "3600",
      upsert: false,
      contentType: item.type || "image/jpeg",
    });

    if (error) {
      throw new UploadError("storage");
    }

    const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

export async function addCategory(formData: FormData) {
  const profile = await requireRole("client");
  const name = stringValue(formData.get("name"));

  if (name && profile.tenant_id) {
    const supabase = await createClient();
    await supabase.from("categories").insert({
      tenant_id: profile.tenant_id,
      name,
    });
  }

  revalidateDashboard();
  redirect("/dashboard/categories");
}

export async function addCategoryFromProductForm(formData: FormData) {
  const profile = await requireRole("client");
  const name = stringValue(formData.get("newCategoryName"));

  if (name && profile.tenant_id) {
    const supabase = await createClient();
    await supabase.from("categories").insert({
      tenant_id: profile.tenant_id,
      name,
    });
  }

  revalidateDashboard();
  redirect("/dashboard/products/new");
}

export async function createCategoryFromProductForm(name: string) {
  const profile = await requireRole("client");
  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      message: "Напиши название категории.",
      status: "error" as const,
    };
  }

  if (!profile.tenant_id) {
    return {
      message: "Магазин не найден.",
      status: "error" as const,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    tenant_id: profile.tenant_id,
    name: normalizedName,
  });

  if (error) {
    return {
      message: "Категория не сохранилась. Попробуй ещё раз.",
      status: "error" as const,
    };
  }

  revalidateDashboard();

  return {
    message: "Категория добавлена.",
    status: "success" as const,
  };
}

export async function deleteCategory(formData: FormData) {
  const profile = await requireRole("client");
  const categoryId = stringValue(formData.get("categoryId"));

  if (categoryId && profile.tenant_id) {
    const supabase = await createClient();
    await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("tenant_id", profile.tenant_id);
  }

  revalidateDashboard();
  redirect("/dashboard/categories");
}

export async function updateStorefront(formData: FormData) {
  const profile = await requireRole("client");

  if (!profile.tenant_id) {
    redirect("/dashboard");
  }

  let logoUrls: string[];

  try {
    logoUrls = await uploadFiles(formData.getAll("logo"), profile.tenant_id, "logos", 1);
  } catch (error) {
    redirect(`/dashboard/settings?error=${uploadErrorCode(error)}`);
  }

  const currentLogoUrl = stringValue(formData.get("currentLogoUrl"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("tenants")
    .update({
      name: stringValue(formData.get("name")),
      logo_url: (logoUrls[0] ?? currentLogoUrl) || null,
      description: stringValue(formData.get("description")) || null,
      phone: stringValue(formData.get("phone")) || null,
      whatsapp: stringValue(formData.get("whatsapp")) || null,
      address: stringValue(formData.get("address")) || null,
      instagram_url: stringValue(formData.get("instagramUrl")) || null,
      tiktok_url: stringValue(formData.get("tiktokUrl")) || null,
    })
    .eq("id", profile.tenant_id);

  if (error) {
    redirect("/dashboard/settings?error=save");
  }

  revalidateDashboard();
  redirect("/dashboard/settings?saved=1");
}

export async function addProduct(formData: FormData) {
  const profile = await requireRole("client");

  if (!profile.tenant_id) {
    redirect("/dashboard");
  }

  let photos: string[];

  try {
    photos = await uploadFiles(
      formData.getAll("photos"),
      profile.tenant_id,
      "products",
      MAX_PRODUCT_PHOTOS,
    );
  } catch (error) {
    redirect(`/dashboard/products/new?error=${uploadErrorCode(error)}`);
  }

  const supabase = await createClient();
  const categoryId = await productCategoryId(
    supabase,
    profile.tenant_id,
    formData.get("categoryId"),
  );

  if (categoryId === undefined) {
    redirect("/dashboard/products/new?error=category");
  }

  const { error } = await supabase.from("products").insert({
    tenant_id: profile.tenant_id,
    name: stringValue(formData.get("name")),
    article: stringValue(formData.get("article")) || null,
    description: stringValue(formData.get("description")) || null,
    photos,
    retail_price: numberValue(formData.get("retailPrice")),
    wholesale_price: numberValue(formData.get("wholesalePrice")),
    quantity: Math.max(0, Math.floor(numberValue(formData.get("quantity")))),
    category_id: categoryId,
    status: "active",
  });

  if (error) {
    redirect("/dashboard/products/new?error=save");
  }

  revalidateDashboard();
  redirect("/dashboard/products");
}

export async function updateProduct(formData: FormData) {
  const profile = await requireRole("client");

  if (!profile.tenant_id) {
    redirect("/dashboard");
  }

  const productId = stringValue(formData.get("productId"));
  const existingPhotos = formData
    .getAll("existingPhotos")
    .map((value) => stringValue(value))
    .filter(Boolean);
  let newPhotos: string[];

  if (existingPhotos.length > MAX_PRODUCT_PHOTOS) {
    redirect("/dashboard/products?error=too-many");
  }

  try {
    newPhotos = await uploadFiles(
      formData.getAll("photos"),
      profile.tenant_id,
      "products",
      MAX_PRODUCT_PHOTOS - existingPhotos.length,
    );
  } catch (error) {
    redirect(`/dashboard/products?error=${uploadErrorCode(error)}`);
  }

  if (!productId) {
    redirect("/dashboard/products?error=save");
  }

  const supabase = await createClient();
  const categoryId = await productCategoryId(
    supabase,
    profile.tenant_id,
    formData.get("categoryId"),
  );

  if (categoryId === undefined) {
    redirect("/dashboard/products?error=category");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: stringValue(formData.get("name")),
      article: stringValue(formData.get("article")) || null,
      description: stringValue(formData.get("description")) || null,
      photos: [...existingPhotos, ...newPhotos],
      retail_price: numberValue(formData.get("retailPrice")),
      wholesale_price: numberValue(formData.get("wholesalePrice")),
      quantity: Math.max(0, Math.floor(numberValue(formData.get("quantity")))),
      category_id: categoryId,
      status: stringValue(formData.get("status")) === "archived" ? "archived" : "active",
    })
    .eq("id", productId)
    .eq("tenant_id", profile.tenant_id);

  if (error) {
    redirect("/dashboard/products?error=save");
  }

  revalidateDashboard();
  redirect("/dashboard/products");
}

export async function archiveProduct(formData: FormData) {
  const profile = await requireRole("client");
  const productId = stringValue(formData.get("productId"));

  if (productId && profile.tenant_id) {
    const supabase = await createClient();
    await supabase
      .from("products")
      .update({ status: "archived" })
      .eq("id", productId)
      .eq("tenant_id", profile.tenant_id);
  }

  revalidateDashboard();
  redirect("/dashboard/products");
}

export async function activateProduct(formData: FormData) {
  const profile = await requireRole("client");
  const productId = stringValue(formData.get("productId"));

  if (productId && profile.tenant_id) {
    const supabase = await createClient();
    await supabase
      .from("products")
      .update({ status: "active" })
      .eq("id", productId)
      .eq("tenant_id", profile.tenant_id);
  }

  revalidateDashboard();
  redirect("/dashboard/products");
}
