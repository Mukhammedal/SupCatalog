import { redirect } from "next/navigation";
import { getCurrentProfile, pathForRole } from "@/lib/auth";

export default async function Home() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  redirect(pathForRole(profile.role));
}
