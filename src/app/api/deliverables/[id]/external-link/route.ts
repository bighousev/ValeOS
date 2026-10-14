import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await createClient();
  const { data: claims } = await db.auth.getClaims();
  if (!claims?.claims?.sub)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("id", claims.claims.sub)
    .eq("active", true)
    .single();
  if (!profile)
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const { error } = await db.rpc("issue_external_approval", {
    p_deliverable_id: id,
    p_token_hash: hash,
  });
  if (error)
    return NextResponse.json(
      {
        error: "A aprovação interna deve ser concluída antes do link externo.",
      },
      { status: 409 },
    );
  const base = process.env.APP_URL || new URL(request.url).origin;
  return NextResponse.json(
    { url: `${base}/aprovar/${token}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
