import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    !provided ||
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { error } = await createAdminClient().rpc("evaluate_notifications");
  if (error)
    return NextResponse.json({ error: "Falha na avaliação" }, { status: 500 });
  return NextResponse.json({ result: "ok" });
}
