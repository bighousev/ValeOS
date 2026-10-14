import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (
    tokenHash &&
    (type === "invite" || type === "recovery" || type === "email")
  ) {
    const db = await createClient();
    const { error } = await db.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error)
      return NextResponse.redirect(
        new URL(type === "email" ? "/" : "/auth/redefinir", url.origin),
      );
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
