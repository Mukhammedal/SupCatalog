import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await requireRole("client");
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { message: "Напиши название категории.", status: "error" },
      { status: 400 },
    );
  }

  if (!profile.tenant_id) {
    return NextResponse.json(
      { message: "Магазин не найден.", status: "error" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    tenant_id: profile.tenant_id,
  });

  if (error) {
    return NextResponse.json(
      { message: "Категория не сохранилась. Попробуй ещё раз.", status: "error" },
      { status: 400 },
    );
  }

  revalidatePath("/dashboard/products/new");
  revalidatePath("/dashboard/categories");

  return NextResponse.json({
    message: "Категория добавлена.",
    status: "success",
  });
}
