"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function stringValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createLead(formData: FormData) {
  const name = stringValue(formData.get("name"));
  const phone = stringValue(formData.get("phone"));
  const shopName = stringValue(formData.get("shopName"));

  if (!name || !phone || !shopName) {
    redirect("/?lead=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    name,
    phone,
    shop_name: shopName,
  });

  if (error) {
    redirect("/?lead=error");
  }

  redirect("/?lead=success");
}
