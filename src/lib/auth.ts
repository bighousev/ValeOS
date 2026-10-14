import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect("/setup");
  }
  const db = await createClient();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("id,name,email,is_admin,active")
    .eq("id", data.claims.sub)
    .single();
  if (!profile?.active) redirect("/sem-acesso");
  return { db, profile };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.profile.is_admin) redirect("/");
  return user;
}
